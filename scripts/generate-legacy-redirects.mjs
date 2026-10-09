#!/usr/bin/env node
/**
 * Genera la sezione "redirects" di vercel.json per gli URL del vecchio sito WordPress
 * (www.nolosubito.it) → pagine del sito attuale. Possiede l'intero array "redirects":
 * va rieseguito (idempotente) quando cambiano post o offerte, non modificato a mano.
 *
 * Uso (dry-run: stampa il report, non scrive):
 *   node --env-file=.env scripts/generate-legacy-redirects.mjs --csv-dir "<cartella con Pagine.csv e Tabella.csv>"
 * Scrittura di vercel.json:
 *   ... --write
 *
 * Input: export di Search Console (Pagine.csv = pagine con traffico, Tabella.csv = 404), usati solo
 * per validare le regole e riportare cosa resta scoperto. Le regole articolo sono generate dagli
 * slug dei post pubblicati in Supabase, quindi coprono anche URL non presenti nei CSV.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToRegexp } from 'path-to-regexp';

const args = process.argv.slice(2);
const argVal = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const WRITE = args.includes('--write');
const CSV_DIR = argVal('--csv-dir');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Servono VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (node --env-file=.env ...)');

const SECTIONS = ['novita-sul-mondo-auto', 'approfondimenti-di-settore', 'curiosita', 'guide', 'senza-categoria', 'consigli-fiscali'];
const SECTION_PARAM = `:s(${SECTIONS.join('|')})`;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function rest(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status}`);
  return res.json();
}

// CSV minimale (campi tra virgolette con virgole/a capo, come negli export di Search Console)
function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.slice(1);
}

const toPath = (url) => {
  const u = url.replace(/\s+/g, '').replace(/^https?:\/\/(www\.)?nolosubito\.it/i, '');
  return decodeURI(u.split('?')[0].split('#')[0]).replace(/\/+$/, '') || '/';
};
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const tokens = (s) => slugify(s).split('-').filter(Boolean);

function dice(a, b) {
  const bg = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
  const A = bg(a), B = bg(b); let inter = 0;
  for (const [k, v] of A) inter += Math.min(v, B.get(k) || 0);
  return (2 * inter) / Math.max(1, a.length - 1 + b.length - 1);
}

// ── Dati ─────────────────────────────────────────────────────────────────────
const posts = await rest('posts', 'select=slug&is_published=eq.true&limit=2000');
const offers = await rest('offers', 'select=make,model&is_active=eq.true&limit=2000');
const goodSlugs = posts.map((p) => p.slug).filter((s) => SLUG_RE.test(s)).sort();
const badSlugs = posts.map((p) => p.slug).filter((s) => !SLUG_RE.test(s));

const vehicleUrl = (o) => `/vehicle/${o.make.toLowerCase().replace(/\s+/g, '-')}/${o.model.toLowerCase().replace(/\s+/g, '-')}`;

// Prodotto WooCommerce → offerta attiva: stessa marca e il modello dell'offerta è un prefisso dei token
// dello slug (es. "bmw-x1-xdrive-25e" → BMW X1). Prefisso nell'altro verso (es. "citroen-c3" → "C3 AIRCROSS")
// sarebbe un modello diverso: in quel caso nessun match e si va su /offers.
function matchOffer(productSlug) {
  const pt = tokens(productSlug);
  let best = null;
  for (const o of offers) {
    const mt = tokens(o.make);
    if (mt.some((t, i) => pt[i] !== t)) continue;
    const mo = tokens(o.model);
    if (!mo.length || mo.some((t, i) => pt[mt.length + i] !== t)) continue;
    if (!best || mo.length > best.len) best = { o, len: mo.length };
  }
  return best && best.o;
}

// ── CSV (validazione e report) ───────────────────────────────────────────────
const csvRows = [];
if (CSV_DIR) {
  for (const f of ['Pagine.csv', 'Tabella.csv']) {
    const p = path.join(CSV_DIR, f);
    if (!fs.existsSync(p)) continue;
    for (const r of parseCsv(fs.readFileSync(p, 'utf8'))) {
      if (!r[0]) continue;
      csvRows.push({ file: f, path: toPath(r[0]), clicks: f === 'Pagine.csv' ? Number(r[1]) || 0 : 0 });
    }
  }
}
const oldProducts = [...new Set(csvRows.filter((r) => r.path.startsWith('/prodotto/')).map((r) => r.path.split('/')[2]))];

// ── Regole (l'ordine conta: vince la prima che combacia) ─────────────────────
// {/}? = slash finale opzionale: gli URL di WordPress finiscono quasi tutti con "/", e in vercel.json
// "/a/b" NON combacia con "/a/b/" (verificato su preview).
const R = (source, destination, extra = {}) => ({ source: `${source}{/}?`, destination, permanent: true, ...extra });
const rules = [];

// 1) www → apex
rules.push(R('/:path*', 'https://nolosubito.it/:path*', { has: [{ type: 'host', value: 'www.nolosubito.it' }] }));

// 1b) Redirect manuali confermati (articolo vecchio → articolo nuovo con slug diverso)
const MANUAL_ARTICLES = [
  { from: 'approfondimenti-di-settore/batteria-auto', toSlug: 'batteria-auto-2' },
];
for (const { from, toSlug } of MANUAL_ARTICLES) {
  if (!goodSlugs.includes(toSlug)) throw new Error(`MANUAL_ARTICLES: il post "${toSlug}" non esiste tra quelli pubblicati`);
  rules.push(R(`/${from}`, `/news/${toSlug}`));
  rules.push(R(`/${from}/amp`, `/news/${toSlug}`));
}

// 2) Articoli: /<sezione>[/<categoria>]/<slug>[/amp] → /news/<slug>
for (const slug of goodSlugs) {
  rules.push(R(`/${SECTION_PARAM}/:cat?/${slug}`, `/news/${slug}`));
  rules.push(R(`/${SECTION_PARAM}/:cat?/${slug}/amp`, `/news/${slug}`));
}

// 3) Prodotti con offerta attiva corrispondente (letterali), poi il resto → /offers
const productMap = [];
for (const slug of oldProducts.sort()) {
  const o = matchOffer(slug);
  productMap.push({ slug, to: o ? vehicleUrl(o) : '/offers' });
  if (o) rules.push(R(`/prodotto/${slug}`, vehicleUrl(o)));
}
rules.push(R('/prodotto/:path*', '/offers'));

// 4) Archivi WooCommerce/WordPress e paginazioni AMP
for (const base of ['tipo-di-contratto', 'tg-vc', 'ct-vc', 'marchio', 'veicoli']) rules.push(R(`/${base}/:path*`, '/offers'));
for (const base of ['tag', 'cat']) rules.push(R(`/${base}/:path*`, '/news'));
rules.push(R('/news/amp/:path*', '/news'));
rules.push(R('/news/page/:n(\\d+)', '/news'));
rules.push(R('/amp/:path*', '/'));
rules.push(R('/amp', '/'));
rules.push(R(`/${SECTION_PARAM}`, '/news'));

// 5) Pagine istituzionali
rules.push(R('/contatti', '/contact'));
rules.push(R('/azienda', '/'));
rules.push(R('/homepage-1-2', '/'));

// Pagine del vecchio WordPress (dal backup del 30/04/2026): istituzionali verso la route equivalente,
// tecniche (carrello, checkout, account, ecc.) e senza equivalente verso la home.
const LEGACY_PAGES = {
  'privacy-policy': '/privacy',
  'termini-e-condizioni': '/termini',
  'lavora-con-noi-nolosubito': '/careers',
  'privati': '/private-offers',
  'noleggio-lungo-termine-privati': '/private-offers',
  'noleggio-lungo-termine-aziende': '/fleet',
  'noleggio-n1': '/commercial',
  'preventivo': '/offers',
  'faq': '/contact',
  'cuorisita-e-novita': '/news',
  'noleggio-vs-acquisto': '/news/noleggio-a-lungo-termine-vs-acquisto-veicolo',
  'noleggio-vs-leasing': '/news/leasing-o-noleggio',
  'noleggio-lungo-termine': '/',
  'vantaggi-noleggio-lungo-termine': '/',
  'servizi': '/',
  'homepage-1': '/',
  'carrello': '/',
  'checkout': '/',
  'mio-account': '/',
  'cancel-payment': '/',
  'questions_and_answers_unsubscription': '/',
};
for (const [from, to] of Object.entries(LEGACY_PAGES)) {
  if (to.startsWith('/news/') && !goodSlugs.includes(to.slice(6))) throw new Error(`LEGACY_PAGES: il post "${to.slice(6)}" non esiste tra quelli pubblicati`);
  rules.push(R(`/${from}`, to));
}

// ── Simulazione di Vercel sugli URL reali dei CSV ────────────────────────────
const compiled = rules.map((r) => ({ r, re: pathToRegexp(r.source) }));
const apply = (p, host = 'nolosubito.it') => {
  for (const { r, re } of compiled) {
    if (r.has && host !== 'www.nolosubito.it') continue;
    if (re.exec(p)) return r;
  }
  return null;
};
const final = (p, depth = 0) => { const r = apply(p); if (!r || r.destination.startsWith('http')) return { r, hops: depth + (r ? 1 : 0), dest: r ? r.destination : p }; const d = r.destination; return depth > 5 ? { r, hops: depth, dest: 'LOOP' } : (apply(d) ? final(d, depth + 1) : { r, hops: depth + 1, dest: d }); };

const VALID_STATIC = new Set(['/', '/offers', '/fleet', '/green', '/contact', '/private-offers', '/careers', '/commercial', '/moto', '/reuse', '/usato', '/news', '/privacy', '/cookie-policy', '/termini', '/hero-compare']);
const postSet = new Set(posts.map((p) => p.slug));
const existsNow = (p) => VALID_STATIC.has(p) || p.startsWith('/vehicle/') || (p.startsWith('/news/') && postSet.has(p.slice(6)));
let covered = 0, coveredClicks = 0, chains = 0;
const uncovered = [];
let slashMismatch = 0;
for (const row of csvRows) {
  const f = final(row.path);
  const fSlash = final(`${row.path}/`);
  if (!!f.r !== !!fSlash.r || (f.r && f.dest !== fSlash.dest)) slashMismatch++;
  if (f.r && fSlash.r) { covered++; coveredClicks += row.clicks; if (f.hops > 1) chains++; }
  else if (!existsNow(row.path)) uncovered.push(row);
}

// ── Report ───────────────────────────────────────────────────────────────────
const needing = csvRows.filter((r) => !existsNow(r.path));
const total = needing.length;
const totalClicks = needing.reduce((s, r) => s + r.clicks, 0);
console.log(`Regole generate: ${rules.length} (limite Vercel 2048) | post con slug valido: ${goodSlugs.length} | slug scartati: ${badSlugs.length}`);
if (badSlugs.length) console.log('  slug non validi (da correggere in Supabase, nessun redirect generato):', badSlugs.map((s) => JSON.stringify(s)).join(', '));
console.log(`Prodotti vecchi: ${oldProducts.length} | con offerta corrispondente: ${productMap.filter((x) => x.to !== '/offers').length}`);
if (csvRows.length) {
  console.log(`URL dei CSV (esclusi quelli già validi nel sito nuovo) coperti da un redirect (con e senza slash finale): ${covered}/${total} (${coveredClicks}/${totalClicks} clic) | catene: ${chains} | esito diverso con/senza slash: ${slashMismatch}`);
  const byClicks = uncovered.sort((a, b) => b.clicks - a.clicks);
  console.log(`Non coperti: ${byClicks.length} (${byClicks.reduce((s, r) => s + r.clicks, 0)} clic). Primi 12:`);
  const bySection = {};
  for (const r of byClicks) { const k = '/' + (r.path.split('/')[1] || ''); (bySection[k] ||= [0, 0]); bySection[k][0]++; bySection[k][1] += r.clicks; }
  console.log('  per sezione:', Object.entries(bySection).sort((a, b) => b[1][1] - a[1][1]).slice(0, 8).map(([k, v]) => `${k} ${v[0]} url/${v[1]} clic`).join(' | '));
  const fuzzy = byClicks.map((r) => { const slug = r.path.split('/').filter((x) => x && x !== 'amp').pop(); const n = goodSlugs.map((s) => [s, dice(slug, s)]).sort((a, b) => b[1] - a[1])[0]; return n && n[1] >= 0.8 ? { r, n } : null; }).filter(Boolean);
  console.log(`  slug simili ma non uguali (da rivedere a mano, NON applicati): ${fuzzy.length}`);
  for (const { r, n } of fuzzy.slice(0, 10)) console.log(`    ${String(r.clicks).padStart(4)} ${r.path} ~ /news/${n[0]} (${n[1].toFixed(2)})`);
  for (const r of byClicks.slice(0, 12)) {
    const slug = r.path.split('/').filter((x) => x && x !== 'amp').pop();
    const near = goodSlugs.map((s) => [s, dice(slug, s)]).sort((a, b) => b[1] - a[1])[0];
    console.log(`  ${String(r.clicks).padStart(4)}  ${r.path}${near && near[1] >= 0.8 ? `   ~ forse: /news/${near[0]} (${near[1].toFixed(2)})` : ''}`);
  }
  console.log('Mappatura prodotti (verificare a mano):');
  for (const m of productMap.slice(0, 200)) console.log(`  /prodotto/${m.slug} -> ${m.to}`);
}

if (WRITE) {
  const file = path.resolve('vercel.json');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = { redirects: rules, ...Object.fromEntries(Object.entries(cfg).filter(([k]) => k !== 'redirects')) };
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nvercel.json aggiornato (${rules.length} redirect).`);
} else console.log('\nDry-run: vercel.json non modificato (usa --write).');
