/**
 * wp-migrate-images.mjs
 *
 * Modalità 1 (XML media): legge il file XML export dei media WordPress,
 *   estrae gli URL dagli elementi <wp:attachment_url> e li scarica
 *   simulando un browser reale, poi li carica su Supabase Storage.
 *
 * Modalità 2 (cartella locale): legge i file immagine da una cartella.
 *
 * Usage:
 *   node scripts/wp-migrate-images.mjs "path/to/media-export.xml"
 *   node scripts/wp-migrate-images.mjs "path/to/uploads-folder"
 *
 * Output: wp-import-with-images.sql con URL aggiornati
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, relative } from 'path';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://nowoiywrzfnjocvsbmih.supabase.co';
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd29peXdyemZuam9jdnNibWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ5ODUwNSwiZXhwIjoyMDkyMDc0NTA1fQ.vNOO4EsUREOEutp0M0a0-mIO3ckyeE5FftrE5dHrCSA';
const BUCKET        = 'post-images';
const SQL_INPUT     = 'wp-import.sql';
const SQL_OUTPUT    = 'wp-import-with-images.sql';
const CONCURRENCY   = 3;

// Headers da browser reale per bypassare Cloudflare/WAF
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.nolosubito.it/',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'image',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'same-origin',
};
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/wp-migrate-images.mjs <media-export.xml | uploads-folder>');
  process.exit(1);
}
if (!existsSync(inputPath)) {
  console.error(`❌ Non trovato: ${inputPath}`);
  process.exit(1);
}
if (!existsSync(SQL_INPUT)) {
  console.error(`❌ ${SQL_INPUT} non trovato. Esegui prima wp-import.mjs`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Determina modalità ────────────────────────────────────────────────────────
const isXml = inputPath.toLowerCase().endsWith('.xml');

// ── Raccolta URL / file ───────────────────────────────────────────────────────
// Formato: { type: 'url', url } oppure { type: 'file', relPath, buffer, ext }
const items = [];

if (isXml) {
  console.log('📖 Parsing XML media...');
  const raw = readFileSync(inputPath, 'utf-8');
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
  const xmlItems = Array.isArray(channel?.item) ? channel.item : (channel?.item ? [channel.item] : []);

  // Raccoglie tutti gli URL di attachment dal campo wp:attachment_url
  // e anche tutte le immagini referenziate nel contenuto
  const urlSet = new Set();

  for (const item of xmlItems) {
    const type = item['wp:post_type'];

    // URL diretti degli attachment
    const attUrl = item['wp:attachment_url'];
    if (attUrl) urlSet.add(attUrl.trim());

    // Immagini embedded nel contenuto (anche dai post normali)
    const content = item['content:encoded'] || '';
    const matches = content.match(/https?:\/\/[^\s"')\]]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"')\]]*)?/gi) || [];
    for (const u of matches) urlSet.add(u);
  }

  // Filtra solo URL dello stesso dominio WP
  for (const url of urlSet) {
    if (url.includes('nolosubito.it')) {
      items.push({ type: 'url', url });
    }
  }

  console.log(`🖼  Trovati ${items.length} URL immagine nel XML`);

} else {
  // Modalità cartella locale
  console.log('📂 Scansione cartella...');
  function walk(dir, baseDir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full, baseDir); continue; }
      const ext = extname(name).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;
      const relPath = relative(baseDir, full).replace(/\\/g, '/');
      items.push({ type: 'file', relPath, buffer: readFileSync(full), ext });
    }
  }
  walk(inputPath, inputPath);
  console.log(`🖼  Trovate ${items.length} immagini locali`);
}

if (items.length === 0) {
  console.error('❌ Nessuna immagine trovata.');
  process.exit(1);
}

// ── Ensure bucket ─────────────────────────────────────────────────────────────
const { data: buckets } = await supabase.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) { console.error('❌ Errore bucket:', error.message); process.exit(1); }
  console.log(`✅ Bucket "${BUCKET}" creato`);
} else {
  console.log(`✅ Bucket "${BUCKET}" esistente`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mimeType(ext) {
  return ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[ext]
    || 'application/octet-stream';
}

function storagePathFromUrl(url) {
  try {
    const u = new URL(url);
    const stripped = u.pathname.replace(/^\/wp-content\/uploads\//, '');
    return `wp-images/${stripped}`;
  } catch {
    return `wp-images/${basename(url)}`;
  }
}

async function downloadWithBrowserHeaders(url) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(20_000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), ext: extname(new URL(url).pathname).toLowerCase() };
}

async function uploadToSupabase(storagePath, buffer, ext) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType(ext),
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

// ── Upload ────────────────────────────────────────────────────────────────────
console.log(`\n⬆️  Upload su Supabase Storage (concorrenza: ${CONCURRENCY})...\n`);

// oldUrl → newUrl
const urlMap = new Map();
let uploaded = 0, failed = 0;

async function processItem(item) {
  if (item.type === 'url') {
    const { url } = item;
    const storagePath = storagePathFromUrl(url);
    const { buffer, ext } = await downloadWithBrowserHeaders(url);
    const newUrl = await uploadToSupabase(storagePath, buffer, ext);
    return { oldUrl: url, newUrl };
  } else {
    const { relPath, buffer, ext } = item;
    const storagePath = `wp-images/${relPath}`;
    const oldUrl = `https://www.nolosubito.it/wp-content/uploads/${relPath}`;
    const newUrl = await uploadToSupabase(storagePath, buffer, ext);
    return { oldUrl, newUrl };
  }
}

for (let i = 0; i < items.length; i += CONCURRENCY) {
  const batch = items.slice(i, i + CONCURRENCY);
  const results = await Promise.allSettled(batch.map(processItem));

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { oldUrl, newUrl } = result.value;
      urlMap.set(oldUrl, newUrl);
      uploaded++;
      const label = oldUrl.length > 70 ? '...' + oldUrl.slice(-67) : oldUrl;
      process.stdout.write(`  ✅ ${label}\n`);
    } else {
      failed++;
      process.stdout.write(`  ❌ ${result.reason?.message || 'errore sconosciuto'}\n`);
    }
  }

  const done = Math.min(i + CONCURRENCY, items.length);
  process.stdout.write(`   [${done}/${items.length}]\n`);
}

console.log(`\n📊 ${uploaded} caricati, ${failed} falliti`);

if (uploaded === 0) {
  console.log('\n⚠️  Nessuna immagine caricata. Il sito potrebbe bloccare ancora i download.');
  console.log('   Prova a scaricare la cartella uploads/ via FTP e rilancia con il percorso locale.');
  process.exit(1);
}

// ── Rewrite SQL ───────────────────────────────────────────────────────────────
console.log(`\n✏️  Riscrittura ${SQL_INPUT} → ${SQL_OUTPUT}...`);
let sql = readFileSync(SQL_INPUT, 'utf-8');
let replaced = 0;

for (const [oldUrl, newUrl] of urlMap) {
  const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const newSql = sql.replace(new RegExp(escaped, 'g'), newUrl);
  if (newSql !== sql) { replaced++; sql = newSql; }
}

writeFileSync(SQL_OUTPUT, sql, 'utf-8');
console.log(`✅ ${SQL_OUTPUT} generato — ${replaced} URL sostituiti`);
console.log('▶  Importa wp-import-with-images.sql nel Supabase SQL Editor\n');
