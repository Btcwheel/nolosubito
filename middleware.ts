export const config = {
  matcher: ['/', '/vehicle/:make/:model', '/news/:path+'],
};

const DOMAIN = 'https://nolosubito.it';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Social media crawlers that need pre-rendered OG tags
const CRAWLER_UA =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

export default async function middleware(request: Request): Promise<Response | void> {
  const ua = request.headers.get('user-agent') || '';

  // Regular users: pass through to vercel.json rewrite → index.html (SPA)
  if (!CRAWLER_UA.test(ua)) return;

  const url = new URL(request.url);
  const pathname = url.pathname;

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
