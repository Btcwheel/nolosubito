/**
 * scrape-finrent.js
 * Scarica le immagini dei veicoli da finrent.it e le carica su Supabase Storage.
 * Genera public/vehicle-catalog.json con la mappa brand → modello → URL.
 *
 * Uso: node scripts/scrape-finrent.js
 */

// Necessario per il certificato TLS di finrent.it non verificabile da Node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Credenziali (service_role per upload storage) ──────────────────────────
const SUPABASE_URL  = 'https://nowoiywrzfnjocvsbmih.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd29peXdyemZuam9jdnNibWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ5ODUwNSwiZXhwIjoyMDkyMDc0NTA1fQ.vNOO4EsUREOEutp0M0a0-mIO3ckyeE5FftrE5dHrCSA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET   = 'vehicle-images';
const BASE_URL = 'https://www.finrent.it';
const DELAY_MS = 400; // pausa tra richieste per non sovraccaricare il server

// ── Mappa slug finrent → brand key (come nel DB nolosubito) ───────────────
const BRAND_PAGES = [
  { slug: 'alfa-romeo',   key: 'alfa-romeo' },
  { slug: 'audi',         key: 'audi' },
  { slug: 'bmw',          key: 'bmw' },
  { slug: 'citroen',      key: 'citroen' },
  { slug: 'dacia',        key: 'dacia' },
  { slug: 'fiat',         key: 'fiat' },
  { slug: 'ford',         key: 'ford' },
  { slug: 'honda',        key: 'honda' },
  { slug: 'hyundai',      key: 'hyundai' },
  { slug: 'jeep',         key: 'jeep' },
  { slug: 'kia',          key: 'kia' },
  { slug: 'mazda',        key: 'mazda' },
  { slug: 'mercedes',     key: 'mercedes-benz' },
  { slug: 'nissan',       key: 'nissan' },
  { slug: 'opel',         key: 'opel' },
  { slug: 'peugeot',      key: 'peugeot' },
  { slug: 'renault',      key: 'renault' },
  { slug: 'seat',         key: 'seat' },
  { slug: 'skoda',        key: 'skoda' },
  { slug: 'tesla',        key: 'tesla' },
  { slug: 'toyota',       key: 'toyota' },
  { slug: 'volkswagen',   key: 'volkswagen' },
  { slug: 'volvo',        key: 'volvo' },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Normalizza il nome modello alla prima parola significativa (es. "Q2 2.0 35 TDI" → "q2") */
function normalizeModel(titleWithBrand, brandSlug) {
  // Rimuovi il nome del brand dal titolo per estrarre il modello
  const brandWords = brandSlug.split('-').join(' ');
  let model = titleWithBrand.toLowerCase();
  model = model.replace(new RegExp(`^${brandWords}\\s*`, 'i'), '').trim();
  // Prendi la prima "parola" che può contenere numeri e lettere (es. "Q2", "X5", "GLA")
  const firstToken = model.split(/\s+/)[0] ?? '';
  return firstToken.replace(/[^a-z0-9-]/g, '');
}

/** Fetch HTML di una pagina brand finrent.it */
async function fetchBrandPage(slug) {
  const url = `${BASE_URL}/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; catalog-builder/1.0)' }
    });
    if (!res.ok) { console.log(`  ⚠️  ${slug}: HTTP ${res.status}`); return null; }
    return await res.text();
  } catch (e) {
    console.log(`  ⚠️  ${slug}: ${e.message} (${e.cause?.message ?? e.cause ?? ''})`);
    return null;
  }
}

/** Estrae i veicoli dalla pagina HTML */
function parseVehicles(html, brandKey, brandSlug) {
  const $ = cheerio.load(html);
  const vehicles = [];

  $('.box-gallery-auto').each((_, el) => {
    const titleEl = $(el).find('.heading.heading__4, p.heading__4, h4').first();
    const imgEl   = $(el).find('.img-container img').first();

    const title   = titleEl.text().trim();
    let   imgSrc  = imgEl.attr('src') ?? imgEl.attr('data-src') ?? '';

    if (!title || !imgSrc) return;

    // Risolvi URL relativo
    if (imgSrc.startsWith('../')) imgSrc = BASE_URL + '/' + imgSrc.replace('../', '');
    else if (imgSrc.startsWith('/')) imgSrc = BASE_URL + imgSrc;
    else if (!imgSrc.startsWith('http')) imgSrc = BASE_URL + '/immagini/veicoli/' + imgSrc;

    const modelKey = normalizeModel(title, brandSlug);
    if (!modelKey) return;

    vehicles.push({ title, brandKey, modelKey, imgSrc });
  });

  return vehicles;
}

/** Scarica immagine come ArrayBuffer */
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; catalog-builder/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** Upload su Supabase Storage, restituisce la URL pubblica */
async function uploadToSupabase(buffer, brand, model, ext) {
  const path        = `${brand}/${model}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  // Cancella versione precedente se esiste (upsert via remove+upload)
  await supabase.storage.from(BUCKET).remove([path]);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚗 Scraping finrent.it...\n');
  const catalog = {};
  let total = 0, skipped = 0;

  for (const { slug, key } of BRAND_PAGES) {
    console.log(`📂 ${key} (/${slug}/)`);
    const html = await fetchBrandPage(slug);
    if (!html) { skipped++; continue; }

    const vehicles = parseVehicles(html, key, slug);
    console.log(`   trovati: ${vehicles.length} veicoli`);

    if (!catalog[key]) catalog[key] = {};

    for (const v of vehicles) {
      if (catalog[key][v.modelKey]) {
        console.log(`   ↩  skip ${v.modelKey} (già presente)`);
        continue;
      }
      try {
        const imgBuffer = await downloadImage(v.imgSrc);
        const ext = v.imgSrc.toLowerCase().includes('.png') ? 'png' : 'jpg';
        const publicUrl = await uploadToSupabase(imgBuffer, key, v.modelKey, ext);
        catalog[key][v.modelKey] = publicUrl;
        console.log(`   ✅ ${v.modelKey} → ${publicUrl}`);
        total++;
      } catch (e) {
        console.log(`   ❌ ${v.modelKey}: ${e.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  // Scrivi il catalog JSON in public/
  const outPath = join(__dirname, '..', 'public', 'vehicle-catalog.json');
  writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n✅ Completato: ${total} immagini caricate, ${skipped} brand saltati`);
  console.log(`📄 Catalog salvato in: ${outPath}`);
}

main().catch(console.error);
