#!/usr/bin/env node
/**
 * Confronta redirect, 410 e header di routes.json tra due server (es. produzione e nuovo host).
 * Per ogni regola costruisce un URL di esempio e verifica che status e Location coincidano.
 *
 * Uso: node scripts/check-routes.mjs https://nolosubito.it http://localhost:3000 [--host-header]
 *   --host-header: il secondo server riceve "Host: nolosubito.it" (utile per localhost / IP della VPS)
 * Esce con codice 1 se c'è almeno una differenza.
 */
import fs from 'node:fs';

const [A, B] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const HOST_HEADER = process.argv.includes('--host-header');
if (!A || !B) { console.error('Uso: check-routes.mjs <baseA> <baseB> [--host-header]'); process.exit(2); }
const routes = JSON.parse(fs.readFileSync(new URL('../routes.json', import.meta.url), 'utf8'));

// Sorgente path-to-regexp → path di esempio: {/}? tolto, :p(a|b) → a, :n(\d+) → 2, :p* → esempio
const sample = (src) => src
  .replace(/\{\/\}\?/g, '')
  .replace(/:\w+\(\\d\+\)/g, '2')
  .replace(/:\w+\(([^|)]+)[^)]*\)/g, '$1')
  .replace(/:\w+\*/g, 'esempio')
  .replace(/:\w+/g, 'esempio')
  .replace(/\(\.\*\)/g, 'esempio');

const cases = [
  ...routes.redirects.filter((r) => !r.has).map((r) => sample(r.source)),
  ...routes.rewrites.map((r) => sample(r.source)),
  '/', '/sw.js', '/favicon.ico', '/robots.txt', // header
];
const HEADERS = ['cache-control', 'x-content-type-options', 'x-frame-options', 'referrer-policy'];

const norm = (loc) => (loc || '').replace(/^https?:\/\/[^/]+/, '');
async function probe(base, path, host) {
  const headers = host ? { host: 'nolosubito.it' } : {};
  const res = await fetch(base + encodeURI(path), { redirect: 'manual', headers });
  const h = Object.fromEntries(HEADERS.map((k) => [k, res.headers.get(k) || '']));
  return { status: res.status, location: norm(res.headers.get('location')), ...h };
}

let diff = 0;
const unique = [...new Set(cases)];
for (let i = 0; i < unique.length; i += 10) {
  await Promise.all(unique.slice(i, i + 10).map(async (path) => {
    const [a, b] = await Promise.all([probe(A, path, false), probe(B, path, HOST_HEADER)]);
    // Header di cache solo sulle risposte 200: sui redirect li decide la piattaforma.
    const keys = ['status', 'location', ...(a.status === 200 ? HEADERS : [])];
    const bad = keys.filter((k) => a[k] !== b[k]);
    if (bad.length) { diff++; console.log(`DIFF ${path}\n  ${bad.map((k) => `${k}: "${a[k]}" ≠ "${b[k]}"`).join('\n  ')}`); }
  }));
}
console.log(`\n${unique.length} URL controllati, ${diff} differenze.`);
process.exit(diff ? 1 : 0);
