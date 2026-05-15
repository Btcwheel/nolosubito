/**
 * Migrazione graduale immagini gigi → Supabase Storage (WebP)
 * Lo stato (offset) è salvato nella tabella app_settings su Supabase — nessun git push necessario.
 *
 * Env richiesti:
 *   SUPABASE_URL         (es. https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_KEY (service_role key)
 *
 * Uso locale: node scripts/migrate-images.cjs [--batch 10]
 */

const fs   = require('fs');
const path = require('path');

const BUCKET      = 'gigi-images';
const BATCH_SIZE  = parseInt(process.argv[3] || '10', 10);
const IMAGES_JSON = path.join(__dirname, '..', 'public', 'gigi-images.json');
const PUBLIC_DIR  = path.join(__dirname, '..', 'public');
const STATE_KEY   = 'gigi_migration_offset';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Mancano SUPABASE_URL e/o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// ── Stato su Supabase (tabella app_settings) ──────────────────────────────────
async function getOffset() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_settings?key=eq.${STATE_KEY}&select=value`,
    { headers: HEADERS }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return 0;
  return parseInt(rows[0].value, 10) || 0;
}

async function saveOffset(offset) {
  await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: STATE_KEY, value: String(offset) }),
  });
}

// ── Storage upload ────────────────────────────────────────────────────────────
async function storageUpload(filePath, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Storage upload failed (${res.status}): ${txt}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

// ── Aggiorna cover_image_url nel DB ──────────────────────────────────────────
async function dbUpdateUrl(oldUrl, newUrl) {
  await fetch(`${SUPABASE_URL}/rest/v1/posts?cover_image_url=eq.${encodeURIComponent(oldUrl)}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ cover_image_url: newUrl }),
  });
  await fetch(`${SUPABASE_URL}/rest/v1/news_drafts?cover_image_url=eq.${encodeURIComponent(oldUrl)}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ cover_image_url: newUrl }),
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sharp = require('sharp');

  const allImages = JSON.parse(fs.readFileSync(IMAGES_JSON, 'utf8'));
  const dated = allImages
    .filter(p => /\/uploads\/20\d{2}\/\d{2}\//.test(p))
    .sort((a, b) => b.localeCompare(a));

  const offset = await getOffset();
  const batch  = dated.slice(offset, offset + BATCH_SIZE);

  if (batch.length === 0) {
    console.log('Migrazione completata! Tutte le immagini sono già state processate.');
    return;
  }

  console.log(`Batch ${offset + 1}–${offset + batch.length} di ${dated.length}`);
  console.log('─'.repeat(60));

  let successCount = 0;

  for (const imgPath of batch) {
    const localFile = path.join(PUBLIC_DIR, imgPath);

    if (!fs.existsSync(localFile)) {
      console.log(`  SKIP (file non trovato): ${imgPath}`);
      continue;
    }

    const rel         = imgPath.replace('/gigi/', '');
    const storagePath = rel.replace(/\.[^.]+$/, '') + '.webp';

    try {
      const webpBuffer = await sharp(localFile).webp({ quality: 82 }).toBuffer();
      const publicUrl  = await storageUpload(storagePath, webpBuffer, 'image/webp');
      await dbUpdateUrl(imgPath, publicUrl);
      console.log(`  ✓ ${path.basename(imgPath)} → ${storagePath}`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${path.basename(imgPath)}: ${err.message}`);
    }
  }

  await saveOffset(offset + batch.length);

  console.log('─'.repeat(60));
  const newOffset  = offset + batch.length;
  const remaining  = dated.length - newOffset;
  console.log(`Completati ${successCount}/${batch.length}. Offset: ${newOffset}/${dated.length}`);
  console.log(`Rimanenti: ${remaining} (~${Math.ceil(remaining / BATCH_SIZE)} giorni)`);
}

main().catch(e => { console.error(e); process.exit(1); });
