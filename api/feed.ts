import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DOMAIN = "https://nolosubito.it";
const MAX_ITEMS = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase URL or Key in environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug,title,summary,category,published_date')
      .eq('is_published', true)
      .order('published_date', { ascending: false })
      .limit(MAX_ITEMS);

    if (error) throw error;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(generateFeed(posts || []));
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).send("Error generating feed");
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

type FeedPost = {
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  published_date: string | null;
};

function generateFeed(posts: FeedPost[]): string {
  const dated = posts.filter(p => p.published_date);
  const lastBuild = dated.length ? new Date(dated[0].published_date as string) : new Date();

  const items = dated.map(post => {
    const link = `${DOMAIN}/news/${escapeXml(post.slug)}`;
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.published_date as string).toUTCString()}</pubDate>${post.category ? `
      <category>${escapeXml(post.category)}</category>` : ""}${post.summary ? `
      <description>${escapeXml(post.summary)}</description>` : ""}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nolosubito News</title>
    <link>${DOMAIN}/news</link>
    <atom:link href="${DOMAIN}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Novità e approfondimenti sul noleggio a lungo termine di auto, veicoli commerciali e moto.</description>
    <language>it-IT</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>${items.join("")}
  </channel>
</rss>`;
}
