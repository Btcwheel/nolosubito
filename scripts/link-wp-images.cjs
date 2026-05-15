/**
 * Collega le immagini WordPress ai post su Supabase.
 *
 * Per ogni post con cover_image_url che punta a nolosubito.it/wp-content/uploads/...
 * o a un URL esterno non funzionante:
 *   1. Estrae il path (YYYY/MM/filename)
 *   2. Cerca il file in public/gigi/uploads/
 *   3. Converte in WebP e carica su Supabase Storage
 *   4. Aggiorna il post con il nuovo URL
 */

const fs   = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = 'gigi-images';
const PUBLIC_DIR   = path.join(__dirname, '..', 'public');

const HEADERS = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
};

async function getRows(table) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=id,cover_image_url&cover_image_url=not.is.null`,
    { headers: HEADERS }
  );
  return res.json();
}

async function updateRow(table, id, newUrl) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ cover_image_url: newUrl }),
  });
}

async function uploadWebp(localFile, storagePath) {
  const sharp = require('sharp');
  const webpBuffer = await sharp(localFile).webp({ quality: 82 }).toBuffer();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: webpBuffer,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

// Da URL WordPress estrae il path relativo: YYYY/MM/filename.ext
function wpUrlToRelPath(url) {
  const m = url.match(/wp-content\/uploads\/(\d{4}\/\d{2}\/.+)$/);
  return m ? m[1] : null;
}

// Cerca il file in gigi/uploads provando estensioni diverse
function findLocalFile(relPath) {
  const base = path.join(PUBLIC_DIR, 'gigi', 'uploads', relPath);
  if (fs.existsSync(base)) return base;
  // Prova senza estensione + estensioni comuni
  const noExt = base.replace(/\.[^.]+$/, '');
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.gif']) {
    const candidate = noExt + ext;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function main() {
  const [posts, drafts] = await Promise.all([
    getRows('posts'),
    getRows('news_drafts'),
  ]);

  const allRows = [
    ...posts.map(r => ({ ...r, table: 'posts' })),
    ...drafts.map(r => ({ ...r, table: 'news_drafts' })),
  ];

  const wpRows = allRows.filter(r =>
    r.cover_image_url && r.cover_image_url.includes('wp-content/uploads')
  );

  console.log(`Post con URL WordPress: ${wpRows.length}`);
  console.log('─'.repeat(60));

  let updated = 0, skipped = 0;

  for (const row of wpRows) {
    const relPath = wpUrlToRelPath(row.cover_image_url);
    if (!relPath) { skipped++; continue; }

    const localFile = findLocalFile(relPath);
    if (!localFile) {
      console.log(`  SKIP (non in locale): ${relPath}`);
      skipped++;
      continue;
    }

    const storagePath = 'uploads/' + relPath.replace(/\.[^.]+$/, '.webp');

    try {
      const newUrl = await uploadWebp(localFile, storagePath);
      await updateRow(row.table, row.id, newUrl);
      console.log(`  ✓ [${row.table}] ${path.basename(relPath)} → webp`);
      updated++;
    } catch (err) {
      console.error(`  ✗ ${relPath}: ${err.message}`);
    }
  }

  console.log('─'.repeat(60));
  console.log(`Aggiornati: ${updated} | Saltati: ${skipped}`);
}

main().catch(e => { console.error(e); process.exit(1); });
