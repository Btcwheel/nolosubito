import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ANALYZE_URL = 'https://nowoiywrzfnjocvsbmih.supabase.co/functions/v1/analyze-preventivo';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd29peXdyemZuam9jdnNibWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTg1MDUsImV4cCI6MjA5MjA3NDUwNX0.0Qr7mgoNnpaxO3l8QKX_g-_LuS7-u2ZelSaCEa9gRIc';

const PDF_PATH = process.argv[2] || join(root, 'supabase/functions/analyze-preventivo/samples/AYVENS - TUTTO A ZERO + VETTURA SOS. + GOMME + ANTICIPO.pdf');

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

const SERVIZI_NOLOSUBITO_MAP = {
  RCA: ['RC Auto', 'Responsabilità Civile Auto verso terzi'],
  DANNI: ['Copertura Danni', 'Penale variabile in base alla società di noleggio'],
  FURTO_INCENDIO: ['Furto e Incendio', 'Penale variabile in base alla società di noleggio'],
  CRISTALLI: ['Cristalli', 'Riparazione e sostituzione cristalli'],
  INFORTUNI: ['Infortuni Conducente', 'Polizza assicurativa inclusa'],
  TUTELA_LEGALE: ['Tutela Legale', 'Assistenza legale inclusa'],
  ATMOSFERICI: ['Eventi Atmosferici', 'Copertura da grandine e meteo'],
  MANUTENZIONE: ['Manutenzione', 'Tagliandi e riparazioni inclusi'],
  CAMBIO_PNEUMATICI: ['Cambio Pneumatici', 'Sostituzione e cambio stagionale pneumatici'],
  SOCCORSO: ['Soccorso Stradale', 'Assistenza e traino inclusi'],
  AUTO_SOSTITUTIVA: ['Auto Sostitutiva', 'Veicolo sostitutivo in caso di fermo'],
  CONSEGNA: ['Consegna Veicolo', 'Consegna presso hub o domicilio'],
  BOLLO: ['Tassa di Proprietà', 'Gestione e pagamento bollo auto'],
  MULTE: ['Gestione Multe', 'Rinotifica contravvenzioni inclusa'],
  SINISTRI: ['Gestione Sinistri', 'Supporto pratiche sinistro'],
  FATTURAZIONE: ['Fatturazione Elettronica', 'Emissione digitale delle fatture'],
  IMMATRICOLAZIONE: ['Immatricolazione', 'Messa su strada inclusa'],
  TELEMATICA: ['Telematica', 'Dispositivo GPS/Blackbox incluso'],
  SERVIZIO_CLIENTI: ['Servizio Clienti', 'Assistenza clienti dedicata'],
};

const SERVIZI_RICHIEDIBILI_DEFAULT = ['AUTO_SOSTITUTIVA', 'CAMBIO_PNEUMATICI'];

function round2(n) { return Math.round(n * 100) / 100; }

function parseServizioRaw(s) {
  if (!s) return null;
  let obj = s;
  if (typeof s === 'string' && s.startsWith('{')) {
    try { obj = JSON.parse(s); } catch { return null; }
  }
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return { codice: obj.codice, penale: obj.penale ?? null, originale: obj.originale };
  }
  if (Array.isArray(s)) return { codice: undefined, penale: null, originale: s[1] || s[0] };
  if (typeof s === 'string') return { codice: undefined, penale: null, originale: s };
  return null;
}

function mapServizioIncluso(s) {
  const parsed = parseServizioRaw(s);
  if (!parsed) return { titolo: 'Servizio', dettaglio: '' };
  if (parsed.codice && SERVIZI_NOLOSUBITO_MAP[parsed.codice]) {
    const [titolo, defaultDettaglio] = SERVIZI_NOLOSUBITO_MAP[parsed.codice];
    let dettaglio;
    if (parsed.penale === 0) dettaglio = 'Nessuna Penale';
    else if (parsed.penale != null && parsed.penale > 0) dettaglio = `Penale € ${parsed.penale}`;
    else dettaglio = defaultDettaglio;
    return { titolo, dettaglio };
  }
  return {
    titolo: parsed.originale || 'Servizio',
    dettaglio: parsed.penale != null && parsed.penale > 0 ? `Penale € ${parsed.penale}` : '',
  };
}

function mapServizioRichiesto(sr) {
  let obj = sr;
  if (typeof sr === 'string' && sr.startsWith('{')) {
    try { obj = JSON.parse(sr); } catch { return null; }
  }
  if (!obj || typeof obj !== 'object') return null;
  const mapped = SERVIZI_NOLOSUBITO_MAP[obj.codice];
  if (!mapped) return null;
  if (obj.richiesto) return { titolo: `✓ ${mapped[0]}`, dettaglio: 'Richiesto — in attesa di conferma costo' };
  return { titolo: mapped[0], dettaglio: 'Disponibile su richiesta' };
}

function buildPayload(prev) {
  const canoneIvaInclusa = Number(prev.canone_finale ?? prev.canone_mensile ?? 0);
  const canoneIvaEsclusa = round2(canoneIvaInclusa / 1.22);
  const quotaVeicoloIvaInclusa = Number(prev.quota_veicolo ?? 0);
  const quotaVeicoloIvaEsclusa = round2(quotaVeicoloIvaInclusa / 1.22);
  const quotaServiziIvaInclusa = Number(prev.quota_servizi ?? 0);
  const quotaServiziIvaEsclusa = round2(quotaServiziIvaInclusa / 1.22);
  const anticipoIvaInclusa = Number(prev.anticipo ?? 0);
  const anticipoIvaEsclusa = round2(anticipoIvaInclusa / 1.22);
  const kmTotali = Math.round(Number(prev.km_annui) * (Number(prev.durata_mesi) / 12));
  const potenzaCv = Number(prev.potenza ?? 0);
  const potenzaKw = potenzaCv ? Math.round(potenzaCv * 0.7355) : 0;
  const listing = Number(prev.valore_listing ?? 0);
  const optional = Number(prev.valore_optional ?? 0);
  const accessori = Number(prev.valore_accessori ?? 0);
  const totaleVeicolo = round2(listing + optional + accessori);
  const titoloDisplay = `${prev.veicolo_marca || ''} ${prev.veicolo_modello || ''}`.trim();
  const sottotitoloDisplay = prev.veicolo_versione || '';
  const dataEmissione = prev.created_at || new Date().toISOString();
  const scadenza = new Date(new Date(dataEmissione).getTime() + 5 * 86400000).toISOString();
  const numero = `NS-${prev.id.slice(-6).toUpperCase()}`;

  const serviziInclusi = (prev.servizi && Array.isArray(prev.servizi) && prev.servizi.length > 0)
    ? prev.servizi.map(mapServizioIncluso)
    : [];

  const codiciInclusi = new Set(
    (prev.servizi || []).map((s) => parseServizioRaw(s)?.codice).filter(Boolean),
  );

  let serviziRichiesti = [];
  if (prev.servizi_richiesti && Array.isArray(prev.servizi_richiesti) && prev.servizi_richiesti.length > 0) {
    serviziRichiesti = prev.servizi_richiesti.map(mapServizioRichiesto).filter(Boolean);
  } else {
    serviziRichiesti = SERVIZI_RICHIEDIBILI_DEFAULT
      .filter((cod) => !codiciInclusi.has(cod))
      .map((cod) => {
        const mapped = SERVIZI_NOLOSUBITO_MAP[cod];
        return mapped ? { titolo: mapped[0], dettaglio: 'Disponibile su richiesta' } : null;
      })
      .filter(Boolean);
  }

  return {
    offerta: { numero, data_emissione: dataEmissione, valida_fino_al: scadenza },
    cliente: { nome: 'Cliente', email: null, telefono: null },
    consulente: {
      ragione_sociale: 'Nolosubito S.r.l.',
      telefono: '+39 06 400 49490',
      cellulare: '+39 345 430 0936',
      email: 'info@nolosubito.it',
      sito: 'nolosubito.it',
    },
    veicolo: {
      marca: prev.veicolo_marca || '—',
      modello: prev.veicolo_modello || '—',
      versione: prev.veicolo_versione || '',
      titolo_display: titoloDisplay,
      sottotitolo_display: sottotitoloDisplay,
      alimentazione: prev.alimentazione || '',
      potenza_cv: potenzaCv,
      potenza_kw: potenzaKw,
      cambio: prev.cambio || '',
      carrozzeria: prev.carrozzeria || '',
      colore_esterno: prev.colore_esterno || 'A definire',
      interni: prev.interni || '',
      emissioni_co2_g_km: null,
      classe_ambientale: null,
      pronta_consegna: true,
      foto_url: null,
    },
    contratto: {
      durata_mesi: Number(prev.durata_mesi) || 0,
      km_annui: Number(prev.km_annui) || 0,
      km_totali: kmTotali,
      anticipo_iva_esclusa: anticipoIvaEsclusa,
      anticipo_iva_inclusa: anticipoIvaInclusa,
      deposito_cauzionale: Number(prev.deposito_cauzionale ?? 0),
    },
    canone: {
      aliquota_iva: 22,
      quota_veicolo_iva_esclusa: quotaVeicoloIvaEsclusa,
      quota_veicolo_iva_inclusa: quotaVeicoloIvaInclusa,
      quota_servizi_iva_esclusa: quotaServiziIvaEsclusa,
      quota_servizi_iva_inclusa: quotaServiziIvaInclusa,
      totale_iva_esclusa: canoneIvaEsclusa,
      totale_iva_inclusa: canoneIvaInclusa,
      canone_mensile_display: canoneIvaInclusa,
    },
    valore_veicolo: { listino: listing, optional, accessori, totale: totaleVeicolo },
    note_cliente: prev.note_cliente || null,
    servizi_inclusi: serviziInclusi.slice(0, 12),
    servizi_richiesti: serviziRichiesti.slice(0, 3),
    branding: null,
  };
}

async function main() {
  const extractedPath = join(root, 'temp_broker_extracted.json');
  let extracted;
  try {
    extracted = JSON.parse(await readFile(extractedPath, 'utf-8'));
    console.log('Dati estratti letti da:', extractedPath);
  } catch {
    console.error('File temp_broker_extracted.json non trovato. Esegui prima scripts/extract-broker-pdf.py');
    process.exit(1);
  }

  console.log('Dati estratti:', JSON.stringify(extracted, null, 2));

  const prev = {
    id: 'broker-test-001',
    created_at: new Date().toISOString(),
    ...extracted,
    servizi: (extracted.servizi || []).map((s) =>
      typeof s === 'string' ? { codice: s.codice, penale: s.penale, originale: s.originale } : s
    ),
    servizi_richiesti: [],
  };

  const payload = buildPayload(prev);
  console.log('Servizi inclusi nel payload:', payload.servizi_inclusi.length);
  console.log('Servizi richiesti nel payload:', payload.servizi_richiesti.length);

  const tpl = await readFile(join(root, 'public/export/preventivo-template.html'), 'utf-8');
  const html = renderTemplate(tpl, payload);
  const outHtml = join(root, 'temp_broker_preventivo.html');
  await writeFile(outHtml, html);
  console.log('HTML compilato:', outHtml);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + outHtml.replace(/\\/g, '/'));
  await page.waitForTimeout(1000);

  const pages = await page.$$('.page');
  console.log('Pagine trovate:', pages.length);

  let overflowFound = false;
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
      overflowFound = true;
    } else {
      console.log(`✅ Pagina ${i + 1} rientra in A4`);
    }
  }

  await page.pdf({ path: join(root, 'temp_broker_preventivo.pdf'), format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('PDF generato:', join(root, 'temp_broker_preventivo.pdf'));

  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: join(root, `temp_broker_preventivo_p${i + 1}.png`) });
  }
  console.log('Screenshot generati');

  await browser.close();

  if (overflowFound) {
    console.warn('\n⚠️ ATTENZIONE: una o più pagine sono in overflow. I servizi in eccesso verranno tagliati nel PDF finale.');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
