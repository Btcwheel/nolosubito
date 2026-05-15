/**
 * Migrazione graduale immagini gigi → Supabase Storage (WebP)
 * Eseguito da GitHub Action ogni giorno: processa 10 immagini a partire dalle più recenti.
 *
 * Env richiesti:
 *   SUPABASE_URL           (es. https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_KEY   (service_role key — non la anon key)
 *
 * Uso locale: node scripts/migrate-images.cjs [--batch 10]
 */

const fs   = require('fs');
const path = require('path');

const BUCKET      = 'gigi-images';
const BATCH_SIZE  = parseInt(process.argv[3] || '10', 10);
const STATE_FILE  = path.join(__dirname, 'migration-state.json');
const IMAGES_JSON = path.join(__dirname, '..', 'public', 'gigi-images.json');
const PUBLIC_DIR  = path.join(__dirname, '..', 'public');

// ── Env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Mancano SUPABASE_URL e/o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ── Helpers Supabase (fetch puro, no SDK per evitare ESM issues) ─────────────
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

async function dbUpdateUrl(oldUrl, newUrl) {
  // Aggiorna posts
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/posts?cover_image_url=eq.${encodeURIComponent(oldUrl)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ cover_image_url: newUrl }),
  });
  // Aggiorna news_drafts
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/news_drafts?cover_image_url=eq.${encodeURIComponent(oldUrl)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ cover_image_url: newUrl }),
  });
  return { posts: r1.ok, drafts: r2.ok };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sharp = require('sharp');

  // Carica lista immagini datate, ordine decrescente (più recenti prima)
  const allImages = JSON.parse(fs.readFileSync(IMAGES_JSON, 'utf8'));
  const dated = allImages
    .filter(p => /\/uploads\/20\d{2}\/\d{2}\//.test(p))
    .sort((a, b) => b.localeCompare(a));

  // Stato migrazione
  let state = { offset: 0, migrated: [] };
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  const batch = dated.slice(state.offset, state.offset + BATCH_SIZE);

  if (batch.length === 0) {
    console.log('Migrazione completata! Tutte le immagini sono già state processate.');
    return;
  }

  console.log(`Batch ${state.offset + 1}–${state.offset + batch.length} di ${dated.length}`);
  console.log('─'.repeat(60));

  let successCount = 0;

  for (const imgPath of batch) {
    const localFile = path.join(PUBLIC_DIR, imgPath);

    if (!fs.existsSync(localFile)) {
      console.log(`  SKIP (file non trovato): ${imgPath}`);
      continue;
    }

    // Ricava il percorso storage: uploads/YYYY/MM/name.webp
    const rel     = imgPath.replace('/gigi/', '');                          // uploads/YYYY/MM/name.ext
    const noExt   = rel.replace(/\.[^.]+$/, '');
    const storagePath = noExt + '.webp';

    try {
      const webpBuffer = await sharp(localFile)
        .webp({ quality: 82 })
        .toBuffer();

      const publicUrl = await storageUpload(storagePath, webpBuffer, 'image/webp');

      // Aggiorna DB: sia il path locale (/gigi/...) sia eventuale URL assoluto vecchio
      await dbUpdateUrl(imgPath, publicUrl);

      console.log(`  ✓ ${path.basename(imgPath)} → ${storagePath}`);
      state.migrated.push({ from: imgPath, to: publicUrl, at: new Date().toISOString() });
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${path.basename(imgPath)}: ${err.message}`);
    }
  }

  state.offset += batch.length;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log('─'.repeat(60));
  console.log(`Completati ${successCount}/${batch.length}. Offset aggiornato: ${state.offset}/${dated.length}`);
  const remaining = dated.length - state.offset;
  const days = Math.ceil(remaining / BATCH_SIZE);
  console.log(`Rimanenti: ${remaining} immagini (~${days} giorni a ${BATCH_SIZE}/giorno)`);
}

main().catch(e => { console.error(e); process.exit(1); });
