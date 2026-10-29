import { createClient } from '@supabase/supabase-js';

// Sitemap generata a runtime dal catalogo e dalle news; cache CDN di un'ora.
export const dynamic = 'force-dynamic';

const DOMAIN = "https://nolosubito.it";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    // Solo lato server: la chiave service role non deve mai avere il prefisso NEXT_PUBLIC_
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase URL or Key in environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch posts pubblicati
    const { data: posts } = await supabase
      .from('posts')
      .select('slug,published_date')
      .eq('is_published', true)
      .order('published_date', { ascending: false });

    // Fetch offers unici (solo attive)
    const { data: allOffers } = await supabase
      .from('offers')
      .select('make,model,created_at')
      .eq('is_active', true);

    // Deduplicare offers per make/model
    const uniqueOffers = Array.from(
      new Map((allOffers || []).map(o => [`${o.make}|${o.model}`, o])).values()
    );

    const xml = generateSitemap(posts || [], uniqueOffers);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap(
  posts: Array<{ slug: string; published_date: string }>,
  offers: Array<{ make: string; model: string; created_at: string }>
): string {
  const urls: string[] = [];

  // Static pages
  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "daily" },
    { url: "/offers", priority: 0.9, changefreq: "daily" },
    { url: "/hero-compare", priority: 0.8, changefreq: "weekly" },
    { url: "/fleet", priority: 0.8, changefreq: "monthly" },
    { url: "/green", priority: 0.8, changefreq: "monthly" },
    { url: "/private-offers", priority: 0.8, changefreq: "monthly" },
    { url: "/commercial", priority: 0.8, changefreq: "monthly" },
    { url: "/moto", priority: 0.7, changefreq: "monthly" },
    { url: "/reuse", priority: 0.7, changefreq: "monthly" },
    { url: "/usato", priority: 0.7, changefreq: "monthly" },
    { url: "/news", priority: 0.9, changefreq: "daily" },
    { url: "/chi-siamo", priority: 0.6, changefreq: "monthly" },
    { url: "/contact", priority: 0.6, changefreq: "monthly" },
    { url: "/careers", priority: 0.6, changefreq: "monthly" },
    { url: "/privacy", priority: 0.3, changefreq: "yearly" },
    { url: "/termini", priority: 0.3, changefreq: "yearly" },
  ];

  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // News dinamiche
  for (const post of posts) {
    // Slug con spazi, tab o ":" non sono URL validi: Google scarterebbe la riga come errore di sitemap
    if (!/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(post.slug)) continue;
    const lastmod = new Date(post.published_date).toISOString().split("T")[0];
    urls.push(`
  <url>
    <loc>${DOMAIN}/news/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Vehicle details dinamici
  for (const offer of offers) {
    const makeSlug = offer.make.trim().toLowerCase().replace(/\s+/g, "-");
    const modelSlug = offer.model.trim().toLowerCase().replace(/\s+/g, "-");
    const lastmod = new Date(offer.created_at).toISOString().split("T")[0];
    urls.push(`
  <url>
    <loc>${DOMAIN}/vehicle/${escapeXml(encodeURIComponent(makeSlug))}/${escapeXml(encodeURIComponent(modelSlug))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;
}
