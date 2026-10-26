export const config = {
  matcher: ['/', '/vehicle/:make/:model', '/news/:path+'],
};

const DOMAIN = 'https://nolosubito.it';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Crawler social: leggono solo i tag OG, non eseguono JS → pagina statica con i meta
const SOCIAL_UA = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|Applebot/i;
// Motori di ricerca: renderizzano la SPA, quindi ricevono la pagina vera (mai lo stub OG, che per
// Google era una pagina da ~200 caratteri = soft 404). Qui si controlla solo che l'URL esista.
const SEARCH_UA = /Googlebot|Google-InspectionTool|GoogleOther|bingbot/i;

export default async function middleware(request: Request): Promise<Response | void> {
  const ua = request.headers.get('user-agent') || '';
  const isSocial = SOCIAL_UA.test(ua);
  const isSearch = SEARCH_UA.test(ua);

  // Utenti normali: passano al rewrite di vercel.json → app.html (SPA)
  if (!isSocial && !isSearch) return;

  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isSearch) return handleSearchBot(pathname);

  // ── Homepage: / ────────────────────────────────────────────────────────
  if (pathname === '/') {
    return handleHomepage();
  }

  // ── Vehicle detail: /vehicle/:make/:model ──────────────────────────────
  const vehicleMatch = pathname.match(/^\/vehicle\/([^/]+)\/([^/]+)$/);
  if (vehicleMatch) {
    const make = decodeURIComponent(vehicleMatch[1]);
    const model = decodeURIComponent(vehicleMatch[2]);
    return handleVehicle(make, model, url.toString());
  }

  // ── News detail: /news/:slug ───────────────────────────────────────────
  const slug = pathname.replace(/^\/news\//, '').split('/')[0];
  if (slug) {
    return handleNews(slug, url.toString());
  }

  // Fallback: let the SPA handle it
  return;
}

// ── Motori di ricerca: 404 vero per news e veicoli inesistenti ───────────────
// La SPA risponde sempre 200 anche per slug sconosciuti: Google li segnala come soft 404.
async function handleSearchBot(pathname: string): Promise<Response | void> {
  try {
    const vehicleMatch = pathname.match(/^\/vehicle\/([^/]+)\/([^/]+)\/?$/);
    if (vehicleMatch) {
      const make = decodeURIComponent(vehicleMatch[1]);
      const model = decodeURIComponent(vehicleMatch[2]);
      return (await vehicleExists(make, model)) ? undefined : notFoundResponse();
    }

    const parts = pathname.replace(/^\/news\//, '').split('/').filter(Boolean);
    if (parts.length === 0) return;
    // /news/amp/..., /news/page/N: vecchi URL WordPress, il 410 lo dà il rewrite di vercel.json
    if (parts.length > 1 || parts[0] === 'amp' || parts[0] === 'page') return;
    return (await postExists(decodeURIComponent(parts[0]))) ? undefined : notFoundResponse();
  } catch {
    // Se Supabase non risponde meglio servire la pagina che un 404 sbagliato
    return;
  }
}

async function supabaseGet(query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

async function postExists(slug: string): Promise<boolean> {
  const rows = await supabaseGet(`posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=slug&limit=1`);
  return rows.length > 0;
}

// Nel DB make/model sono maiuscoli, gli URL usano lo slug minuscolo: si confrontano gli slug.
// L'elenco è piccolo (un centinaio di righe) e resta in memoria per qualche minuto.
const slugOf = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-');
let vehicleSlugs: { at: number; set: Set<string> } | null = null;

async function vehicleExists(make: string, model: string): Promise<boolean> {
  if (!vehicleSlugs || Date.now() - vehicleSlugs.at > 5 * 60 * 1000) {
    const rows = await supabaseGet('offers?select=make,model&limit=5000');
    vehicleSlugs = { at: Date.now(), set: new Set(rows.map((r) => `${slugOf(r.make)}/${slugOf(r.model)}`)) };
  }
  return vehicleSlugs.set.has(`${slugOf(make)}/${slugOf(model)}`);
}

function notFoundResponse(): Response {
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Pagina non trovata | Nolosubito</title>
</head>
<body>
  <h1>Pagina non trovata</h1>
  <p>La pagina che cerchi non esiste più.</p>
  <a href="https://nolosubito.it/">Torna alla home</a>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    },
  });
}

// ── Homepage handler ─────────────────────────────────────────────────────────
async function handleHomepage(): Promise<Response | void> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?key=eq.seo_homepage&select=value`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    const rows = await res.json();
    const seo = rows?.[0]?.value || {};

    const title = esc(seo.title || 'Nolosubito | Noleggio Lungo Termine');
    const description = esc(seo.description || 'Scopri le migliori offerte di Noleggio Lungo Termine per Aziende e Privati. Preventivi veloci e canoni trasparenti.');
    const image = seo.og_image_url || `${DOMAIN}/og-image.png`;
    const pageUrl = DOMAIN;

    return ogResponse(title, description, image, pageUrl, 'website');
  } catch {
    return;
  }
}

// ── Vehicle handler ──────────────────────────────────────────────────────────
async function handleVehicle(make: string, model: string, pageUrl: string): Promise<Response | void> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/offers?make=eq.${encodeURIComponent(make)}&model=eq.${encodeURIComponent(model)}&select=make,model,version,category,fuel_type,vehicle_image,promo_discount_pct,promo_expires_at&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    const vehicles = await res.json();
    const vehicle = vehicles?.[0];

    if (!vehicle) return;

    const title = esc(`${vehicle.make} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ''} | Noleggio Lungo Termine`);
    const description = esc(
      vehicle.category
        ? `Noleggio a lungo termine ${vehicle.make} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ''} · ${vehicle.category} · ${vehicle.fuel_type || ''}`
        : `Scopri l'offerta di noleggio per ${vehicle.make} ${vehicle.model}`
    );
    const image = vehicle.vehicle_image || `${DOMAIN}/og-image.png`;

    return ogResponse(title, description, image, pageUrl, 'article');
  } catch {
    return;
  }
}

// ── News handler ─────────────────────────────────────────────────────────────
async function handleNews(slug: string, pageUrl: string): Promise<Response | void> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=title,seo_title,seo_description,summary,cover_image_url`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    const posts = await res.json();
    const post = posts?.[0];

    if (!post) return;

    const title = esc(post.seo_title || post.title || 'Nolosubito');
    const description = esc(post.seo_description || post.summary || '');
    const image = post.cover_image_url || `${DOMAIN}/og-image.png`;

    return ogResponse(title, description, image, pageUrl, 'article');
  } catch {
    return;
  }
}

// ── OG HTML response builder ─────────────────────────────────────────────────
function ogResponse(
  title: string,
  description: string,
  image: string,
  pageUrl: string,
  type: 'website' | 'article'
): Response {
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="Nolosubito" />
  <meta property="og:locale" content="it_IT" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${pageUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${pageUrl}">Vai al sito</a>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
