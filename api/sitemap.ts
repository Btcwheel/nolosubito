import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DOMAIN = "https://nolosubito.it";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch posts pubblicati
    const { data: posts } = await supabase
      .from('posts')
      .select('slug,published_date')
      .eq('is_published', true)
      .order('published_date', { ascending: false });

    // Fetch offers unici
    const { data: allOffers } = await supabase
      .from('offers')
      .select('make,model,created_at');

    // Deduplicare offers per make/model
    const uniqueOffers = Array.from(
      new Map((allOffers || []).map(o => [`${o.make}|${o.model}`, o])).values()
    );

    const xml = generateSitemap(posts || [], uniqueOffers);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Error generating sitemap");
  }
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
    const lastmod = new Date(post.published_date).toISOString().split("T")[0];
    urls.push(`
  <url>
    <loc>${DOMAIN}/news/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Vehicle details dinamici
  for (const offer of offers) {
    const makeSlug = offer.make.toLowerCase().replace(/\s+/g, "-");
    const modelSlug = offer.model.toLowerCase().replace(/\s+/g, "-");
    const lastmod = new Date(offer.created_at).toISOString().split("T")[0];
    urls.push(`
  <url>
    <loc>${DOMAIN}/vehicle/${makeSlug}/${modelSlug}</loc>
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
