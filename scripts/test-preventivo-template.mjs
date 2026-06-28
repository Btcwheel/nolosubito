import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const fmtEur = (v) => {
  if (v == null || isNaN(Number(v))) return '€ 0,00';
  return '€ ' + Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtNum = (v) => {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('it-IT');
};
const fmtDataIt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};
const fmtAmt = (v) => {
  if (v == null || isNaN(Number(v))) return '0,00';
  return Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function getPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function renderTemplate(tpl, data) {
  const helpers = { eur: fmtEur, num: fmtNum, dataIt: fmtDataIt, amt: fmtAmt };

  tpl = tpl.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, path, body) => {
    const val = getPath(data, path);
    const elseIdx = body.indexOf('{{else}}');
    if (elseIdx !== -1) {
      const ifBody = body.slice(0, elseIdx);
      const elseBody = body.slice(elseIdx + 8);
      return val ? ifBody : elseBody;
    }
    if (val) return body;
    return '';
  });

  tpl = tpl.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (m, path, body) => {
    const arr = getPath(data, path);
    if (!Array.isArray(arr)) return '';
    return arr.map((item) => {
      let itemBody = body;
      itemBody = itemBody.replace(/\{\{this\.([\w.]+)\}\}/g, (_, p) => getPath(item, p) ?? '');
      itemBody = itemBody.replace(/\{\{this\}\}/g, () => item);
      return itemBody;
    }).join('');
  });

  tpl = tpl.replace(/\{\{([\w.]+)\.length\}\}/g, (_, path) => {
    const val = getPath(data, path);
    return Array.isArray(val) ? String(val.length) : '0';
  });

  Object.keys(helpers).forEach((hName) => {
    const re = new RegExp(`\\{\\{${hName}\\s+([\\w.]+)\\}\\}`, 'g');
    tpl = tpl.replace(re, (_, path) => helpers[hName](getPath(data, path)));
  });

  tpl = tpl.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
    const val = getPath(data, path);
    return val == null ? '' : String(val);
  });

  return tpl;
}

const data = {
  offerta: { numero: 'NS-C4EBF6', data_emissione: '2026-05-18T10:00:00Z', valida_fino_al: '2026-06-02T10:00:00Z' },
  cliente: { nome: 'Maria Bruno', email: 'cliente@email.it', telefono: '+39 333 1234567' },
  consulente: { ragione_sociale: 'Nolosubito S.r.l.', telefono: '+39 06 400 49490', cellulare: '+39 345 430 0936', email: 'info@nolosubito.it', sito: 'nolosubito.it' },
  veicolo: {
    marca: 'Citroën', modello: 'C3', versione: 'C3 Turbo 100 cv Manuale PLUS',
    titolo_display: 'Citroën C3 Turbo 100 cv', sottotitolo_display: 'Allestimento PLUS',
    alimentazione: 'Benzina', potenza_cv: 100, potenza_kw: 74, cambio: 'Manuale 6 marce', carrozzeria: 'Hatchback / Crossover',
    colore_esterno: 'A definire', interni: 'Tessuto allestimento PLUS', emissioni_co2_g_km: 119, classe_ambientale: 'Euro 6E',
    pronta_consegna: true,
    foto_url: 'https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/object/public/site-images/vehicles/citroen-c3.png',
  },
  contratto: { durata_mesi: 48, km_annui: 25000, km_totali: 100000, anticipo_iva_esclusa: 0, anticipo_iva_inclusa: 0 },
  canone: { quota_veicolo_iva_esclusa: 276.86, quota_veicolo_iva_inclusa: 337.77, quota_servizi_iva_esclusa: 136.36, quota_servizi_iva_inclusa: 166.36, totale_iva_esclusa: 413.22, totale_iva_inclusa: 504.13 },
  valore_veicolo: { listino: 17900, optional: 0, accessori: 0, totale: 17900 },
  servizi_inclusi: [
    { titolo: 'R.C.A. Responsabilità Civile', dettaglio: 'Massimale max 25 milioni' },
    { titolo: 'Copertura Danni Kasko', dettaglio: 'Penale 500 € per sinistro' },
    { titolo: 'Incendio e Furto', dettaglio: 'Penale 10% sul valore' },
    { titolo: 'Manutenzione Ordinaria', dettaglio: 'Tagliandi periodici programmati' },
    { titolo: 'Manutenzione Straordinaria', dettaglio: 'Riparazioni per usura' },
    { titolo: 'Tassa di Possesso', dettaglio: 'Bollo auto gestito con raaddebito' },
    { titolo: 'Immatricolazione', dettaglio: 'Messa su strada inclusa' },
    { titolo: 'Cambio Pneumatici', dettaglio: 'Stagionali (estivi/invernali)' },
    { titolo: 'Assistenza Stradale H24', dettaglio: 'Soccorso 365 giorni l’anno' },
    { titolo: 'Consegna del Veicolo', dettaglio: 'Presso hub più vicino' },
    { titolo: 'Gestione Multe', dettaglio: 'Rinotifica al conducente' },
    { titolo: 'Customer Care Dedicato', dettaglio: 'Numero verde e e-mail' },
  ],
  servizi_richiesti: [
    { titolo: 'Cambio Pneumatici', dettaglio: 'Performance a consumo' },
    { titolo: 'Veicolo Sostitutivo', dettaglio: 'Veicolo Classe simile o Utilitaria' },
    { titolo: 'Servizio Richiesto Extra', dettaglio: 'Test 3° richiesto' },
  ],
  branding: null,
};

async function main() {
  const tpl = await readFile(join(root, 'public/export/preventivo-template.html'), 'utf-8');
  const html = renderTemplate(tpl, data);
  const outHtml = join(root, 'temp_preventivo.html');
  await writeFile(outHtml, html);
  console.log('HTML compilato:', outHtml);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + outHtml.replace(/\\/g, '/'));
  await page.waitForTimeout(1000);

  const pages = await page.$$('.page');
  console.log('Pagine trovate:', pages.length);

  for (let i = 0; i < pages.length; i++) {
    const info = await pages[i].evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }));
    console.log(`Pagina ${i + 1} info:`, info);
    if (info.scrollHeight > info.clientHeight + 2) {
      console.warn(`⚠️ Pagina ${i + 1} in overflow di ${info.scrollHeight - info.clientHeight}px`);
    } else {
      console.log(`✅ Pagina ${i + 1} rientra in A4`);
    }
  }

  await page.pdf({ path: join(root, 'temp_preventivo.pdf'), format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('PDF generato:', join(root, 'temp_preventivo.pdf'));

  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: join(root, `temp_preventivo_p${i + 1}.png`) });
  }
  console.log('Screenshot generati');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
