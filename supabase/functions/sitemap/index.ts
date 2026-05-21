import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DOMAIN = "https://nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS });
  }

  try {
    // Fetch posts pubblicati
    const postsRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=slug,published_date&is_published=eq.true&order=published_date.desc`, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const posts = (await postsRes.json()) as Array<{ slug: string; published_date: string }>;

    // Fetch offers unici (distinct make, model)
    const offersRes = await fetch(`${SUPABASE_URL}/rest/v1/offers?select=make,model,created_at`, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const allOffers = (await offersRes.json()) as Array<{ make: string; model: string; created_at: string }>;

    // Deduplicare offers per make/model
    const uniqueOffers = Array.from(
      new Map(allOffers.map(o => [`${o.make}|${o.model}`, o])).values()
    );

    // Genera XML
    const xml = generateSitemap(posts, uniqueOffers);

    return new Response(xml, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400", // Cache 24h
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }
});

function generateSitemap(
  posts: Array<{ slug: string; published_date: string }>,
  offers: Array<{ make: string; model: string; created_at: string }>
): string {
  const urls: string[] = [];

  // Pagine statiche (priority alta)
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

  return xml;
}
