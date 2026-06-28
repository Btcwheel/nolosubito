import { supabase } from './supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-preventivo-print`;
const TEMPLATE_URL = '/export/preventivo-template.html';

async function fetchAsDataUrl(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) return null;
  const blob = await res.blob();
  if (!blob.size) return null;
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(blob);
  });
}

function convertWebpToPngDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function fetchVehicleImageAsPngDataUrl(url) {
  try {
    const dataUrl = await fetchAsDataUrl(url);
    if (!dataUrl) return url;
    if (dataUrl.startsWith('data:image/webp')) {
      const png = await convertWebpToPngDataUrl(dataUrl);
      return png || url;
    }
    return dataUrl;
  } catch (e) {
    console.warn('[preventivoPrint] conversione foto fallita:', e);
    return url;
  }
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

function fmtEur(v) {
  if (v == null || isNaN(Number(v))) return '€ 0,00';
  return '€ ' + Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(v) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('it-IT');
}

function fmtDataIt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function renderTemplate(tpl, data) {
  const fmtAmt = (v) => {
    if (v == null || isNaN(Number(v))) return '0,00';
    return Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
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

export async function buildPayload(prev, pratica) {
  let fotoUrl = null;
  try {
    const { data: offers } = await supabase
      .from('offers')
      .select('make, model, foto_prev')
      .not('foto_prev', 'is', null);
    if (offers && offers.length > 0) {
      const norm = (v) => String(v || '').trim().toUpperCase();
      const normMarca = norm(prev.veicolo_marca);
      const normModello = norm(prev.veicolo_modello);
      const match = offers.find((o) => {
        if (norm(o.make) !== normMarca) return false;
        const normOfferModel = norm(o.model);
        return normModello.startsWith(normOfferModel) || normOfferModel.startsWith(normModello);
      });
      if (match?.foto_prev) fotoUrl = await fetchVehicleImageAsPngDataUrl(match.foto_prev);
    }
  } catch (e) {
    console.warn('[preventivoPrint] foto_prev lookup fallito:', e);
  }

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
    cliente: {
      nome: pratica?.cliente_nome || 'Cliente',
      email: pratica?.cliente_email || null,
      telefono: pratica?.cliente_telefono || null,
    },
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
      foto_url: fotoUrl,
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

export async function scaricaPreventivoPDF(prev, clienteNome) {
  if (!prev?.id) throw new Error('ID preventivo mancante');

  const fnRes = await fetch(`${EDGE_FUNCTION_URL}?id=${encodeURIComponent(prev.id)}`, {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
  });
  if (!fnRes.ok) throw new Error('Preventivo non trovato');
  const { preventivo: _, pratica } = await fnRes.json();

  prev.cliente_nome = clienteNome;

  const payload = await buildPayload(prev, pratica);

  const tplRes = await fetch(TEMPLATE_URL);
  if (!tplRes.ok) throw new Error(`Template HTTP ${tplRes.status}`);
  const tplHtml = await tplRes.text();

  const compiledHtml = renderTemplate(tplHtml, payload);

        // @ts-ignore
        window.dataLayer = [];
        // @ts-ignore
        window.gtag = function() {};
  document.querySelectorAll('script[src*="googletagmanager"]').forEach(s => s.remove());

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;';
  document.body.appendChild(iframe);

  return new Promise((resolve, reject) => {
    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        await doc.fonts.ready;
        await Promise.all(Array.from(doc.querySelectorAll('img')).map(
          (img) => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; }),
        ));
        await new Promise(r => setTimeout(r, 500));

        const pages = doc.querySelectorAll('.page');
        if (!pages.length) throw new Error('Nessuna pagina trovata');

        const overflows = Array.from(pages).filter((p) => p.scrollHeight > p.clientHeight + 2);
        if (overflows.length) {
          throw new Error('Il contenuto del preventivo supera lo spazio disponibile in una pagina A4. Riduci i servizi inclusi o le note.');
        }

        const pdf = new jsPDF('p', 'mm', [210, 297]);

        for (let i = 0; i < pages.length; i++) {
          const el = /** @type {HTMLElement} */ (pages[i]);
          if (i > 0) pdf.addPage([210, 297]);

          const raw = await html2canvas(el, {
            useCORS: true,
            scale: 2,
            backgroundColor: null,
          });

          pdf.addImage(raw.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        }

        pdf.save(`preventivo-${prev.id.slice(-6).toUpperCase()}.pdf`);
        document.body.removeChild(iframe);
        resolve();
      } catch (e) {
        document.body.removeChild(iframe);
        reject(e);
      }
    };

    iframe.srcdoc = compiledHtml;
  });
}
