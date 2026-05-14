import { readFileSync, writeFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const [, , xmlPath] = process.argv;
if (!xmlPath) {
  console.error('Usage: node scripts/wp-import.mjs <path-to-wordpress-export.xml>');
  process.exit(1);
}

const raw = readFileSync(xmlPath, 'utf-8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  isArray: (name) => name === 'item',
  trimValues: true,
  processEntities: true,
});

const parsed = parser.parse(raw);
const channel = parsed?.rss?.channel;
const items = channel?.item || [];

const posts = items
  .filter((item) => {
    const type = item['wp:post_type'];
    return type === 'post';
  })
  .map((item) => {
    const rawTitle = item.title || '';
    const rawContent = item['content:encoded'] || '';
    const rawExcerpt = item['excerpt:encoded'] || '';

    const slug = item['wp:post_name'] || '';
    const status = item['wp:status'] || 'draft';
    const pubDateRaw = item['pubDate'] || item['wp:post_date_gmt'] || '';

    const wpCategories = item.category || [];
    const categories = Array.isArray(wpCategories)
      ? wpCategories
          .filter((c) => c['@_domain'] === 'category')
          .map((c) => c['#text'] || c[''])
      : [];

    const category = categories[0] || 'Notizie';

    const imageMatch = rawContent.match(
      /<img[^>]+src=["']([^"']+)["']/
    );
    const coverImageUrl = imageMatch ? imageMatch[1] : '';

    const publishedDate = formatDate(pubDateRaw);

    return {
      title: escapeSql(rawTitle),
      slug: escapeSql(slug || generateSlug(rawTitle)),
      summary: escapeSql(extractSummary(rawExcerpt, rawContent)),
      content: escapeSql(convertToMarkdown(rawContent)),
      category: escapeSql(mapCategory(category)),
      coverImageUrl: escapeSql(coverImageUrl),
      isPublished: status === 'publish' ? 'true' : 'false',
      publishedDate,
    };
  });

if (posts.length === 0) {
  console.log('Nessun post trovato nel file XML.');
  console.log('Verifica che gli elementi abbiano <wp:post_type>post</wp:post_type>');
  process.exit(0);
}

let sql = `-- Import WordPress: ${posts.length} articoli\n`;
sql += `-- Generato il ${new Date().toISOString()}\n\n`;

const rows = posts.map((p) => {
  const cat = p.category || "'Notizie'";
  return (
    `INSERT INTO posts (title, slug, summary, content, category, cover_image_url, is_published, published_date) VALUES\n` +
    `(\n  ${p.title},\n  ${p.slug},\n  ${p.summary},\n  ${p.content},\n  ${cat},\n  ${p.coverImageUrl},\n  ${p.isPublished},\n  ${p.publishedDate}\n)\n` +
    `ON CONFLICT (slug) DO UPDATE SET\n` +
    `  title          = EXCLUDED.title,\n` +
    `  summary        = EXCLUDED.summary,\n` +
    `  content        = EXCLUDED.content,\n` +
    `  category       = EXCLUDED.category,\n` +
    `  cover_image_url = EXCLUDED.cover_image_url,\n` +
    `  is_published   = EXCLUDED.is_published,\n` +
    `  published_date = EXCLUDED.published_date;\n`
  );
});

sql += rows.join('\n');

const outPath = 'wp-import.sql';
writeFileSync(outPath, sql, 'utf-8');
console.log(`✓ Trovati ${posts.length} articoli`);
console.log(`✓ Generato ${outPath}`);
console.log('▶ Apri Supabase SQL Editor e incolla/importa il file.\n');

function escapeSql(val) {
  if (!val) return "''";
  const escaped = val.replace(/'/g, "''");
  return `'${escaped}'`;
}

function formatDate(raw) {
  if (!raw) return 'now()';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'now()';
  return `'${d.toISOString()}'::timestamptz`;
}

function generateSlug(title) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return clean || 'post';
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSummary(excerpt, content) {
  // 1. Try the WP excerpt field first
  const fromExcerpt = cleanText(excerpt);
  if (fromExcerpt.length > 20) return fromExcerpt.slice(0, 300);

  // 2. Fall back to the first <p> with meaningful text
  const pMatches = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (const p of pMatches) {
    const text = cleanText(p);
    if (text.length > 30) return text.slice(0, 300);
  }

  // 3. Last resort: strip all tags and take first 300 chars
  return cleanText(content).slice(0, 300);
}

function convertToMarkdown(html) {
  if (!html) return '';
  let md = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<blockquote>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => `\n${content}\n`)
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => `\n${content}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![image]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
}

function mapCategory(wpCat) {
  const map = {
    news: 'Notizie',
    notizie: 'Notizie',
    approfondimenti: 'Approfondimenti',
    'approfondimenti di settore': 'Approfondimenti',
    'approfondimenti sul settore': 'Approfondimenti',
    offerte: 'Offerte',
    green: 'Green Mobility',
    'green mobility': 'Green Mobility',
    'mobilità sostenibile': 'Green Mobility',
    sostenibilità: 'Green Mobility',
    sostenibilita: 'Green Mobility',
    azienda: 'Azienda',
    'senza categoria': 'Notizie',
    uncategorized: 'Notizie',
  };
  const lower = wpCat.toLowerCase().trim();
  return map[lower] || 'Notizie';
}
