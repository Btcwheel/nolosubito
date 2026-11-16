import { canonicalPath } from './src/lib/canonicalPath';

export const config = {
  matcher: ['/', '/vehicle/:make/:model'],
};

const DOMAIN = 'https://nolosubito.it';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Crawler social: leggono solo i tag OG, non eseguono JS → pagina statica con i meta

const SOCIAL_UA = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|Applebot/i;

export default async function proxy(request: Request): Promise<Response | void> {
  // Solo la home e solo per i crawler social (leggono i tag OG dal CMS, non eseguono JS).
  // Veicoli e news sono pagine Next.js con i propri metadati, e un URL inesistente risponde 404 vero.
  // Vecchi URL WordPress sulla home (?o= tracciamento, ?s= ricerca): 301 verso la home pulita.
  // utm_/gclid restano intatti per non perdere l'attribuzione delle campagne.
  const { pathname, searchParams } = new URL(request.url);
  if (pathname === '/' && (searchParams.has('o') || searchParams.has('s'))) return Response.redirect(`${DOMAIN}/`, 301);

  // Varianti dei veicoli (/vehicle/KIA/SPORTAGE, /vehicle/BMW/F900 R): 308 verso lo slug della sitemap.
  // Qui e non nella pagina: la cache ISR non distingue maiuscole e minuscole e creerebbe un loop.
  if (pathname.startsWith('/vehicle/')) {
    const canonical = canonicalPath(pathname);
    try {
      if (decodeURIComponent(canonical) !== decodeURIComponent(pathname)) return Response.redirect(`${DOMAIN}${canonical}`, 308);
    } catch { /* URL con % malformato: decide la pagina (404) */ }
    return;
  }

  const ua = request.headers.get('user-agent') || '';
  if (!SOCIAL_UA.test(ua)) return;
  if (pathname === '/') return handleHomepage();
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
