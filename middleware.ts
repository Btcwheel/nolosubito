export const config = {
  matcher: ['/news/:path+'],
};

const DOMAIN = 'https://nolosubito.it';

// Social media crawlers that need pre-rendered OG tags
const CRAWLER_UA =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

export default async function middleware(request: Request): Promise<Response | void> {
  const ua = request.headers.get('user-agent') || '';

  // Regular users: pass through to vercel.json rewrite → index.html (SPA)
  if (!CRAWLER_UA.test(ua)) return;

  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/news\//, '').split('/')[0];
  if (!slug) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=title,seo_title,seo_description,summary,cover_image_url`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      }
    );

    const posts = await res.json();
    const post = posts?.[0];

    // Post not found: let the SPA handle 404
    if (!post) return;

    const title = esc(post.seo_title || post.title || 'Nolosubito');
    const description = esc(post.seo_description || post.summary || '');
    const image = post.cover_image_url || `${DOMAIN}/og-image.png`;
    const pageUrl = `${DOMAIN}/news/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:type" content="article" />
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
  <a href="${pageUrl}">Leggi l'articolo completo</a>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    // On any error, fall through to normal SPA routing
    return;
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
