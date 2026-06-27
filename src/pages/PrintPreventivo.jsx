import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-preventivo-print`;

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

const round2 = (n) => Math.round(n * 100) / 100;

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

function renderTemplate(tpl, data) {
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

function getPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
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

async function buildPayload(prev, pratica) {
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
      if (match?.foto_prev) fotoUrl = match.foto_prev;
    }
  } catch (e) {
    console.warn('[PrintPreventivo] foto_prev lookup fallito:', e);
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
    servizi_inclusi: serviziInclusi,
    servizi_richiesti: serviziRichiesti,
    branding: null,
  };
}

const TEMPLATE_URL = 'https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/object/public/site-images/preventivo-template.html';

export default function PrintPreventivo() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';
  const iframeRef = useRef(null);
  const [[status, errorMsg], setState] = useState(['loading', '']);
  const generating = useRef(false);

  const generatePdf = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const fnRes = await fetch(`${EDGE_FUNCTION_URL}?id=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        });
        if (!fnRes.ok) throw new Error('Preventivo non trovato');
        const { preventivo: prev, pratica } = await fnRes.json();

        const payload = await buildPayload(prev, pratica);

        const tplRes = await fetch(TEMPLATE_URL);
        if (!tplRes.ok) throw new Error(`Template HTTP ${tplRes.status}`);
        const tplHtml = await tplRes.text();

        const compiledHtml = renderTemplate(tplHtml, payload);

        window.dataLayer = [];
        window.gtag = function() {};
        document.querySelectorAll('script[src*="googletagmanager"]').forEach(s => s.remove());

        if (cancelled) return;

        if (iframeRef.current) {
          iframeRef.current.srcdoc = compiledHtml;
        }

        generatePdf.current = async () => {
          if (generating.current) return;
          generating.current = true;

          try {
            const iframe = iframeRef.current;
            if (!iframe) return;
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            // Aspetta font + immagini + rendering
            await doc.fonts.ready;
            await Promise.all(Array.from(doc.querySelectorAll('img')).map(
              (img) => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; }),
            ));
            await new Promise(r => setTimeout(r, 500));

            const pages = doc.querySelectorAll('.page');
            if (!pages.length) throw new Error('Nessuna pagina trovata');

            const pdf = new jsPDF('p', 'mm', 'a4');

            for (let i = 0; i < pages.length; i++) {
              const el = pages[i];
              const raw = await html2canvas(el, {
                useCORS: true,
                scale: 2,
                height: Math.round(el.offsetWidth * 297 / 210),
              });

              if (i > 0) pdf.addPage();
              pdf.addImage(raw.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
            }

            pdf.save(`preventivo-${id.slice(-6).toUpperCase()}.pdf`);

            // Chiudi popup dopo il download
            setTimeout(() => { window.close(); }, 500);
          } catch (e) {
            console.error('[PrintPreventivo] PDF fallito:', e);
          }
        };

        setState(['ready', '']);
      } catch (e) {
        if (cancelled) return;
        console.error('[PrintPreventivo] errore:', e);
        setState(['error', e.message || String(e)]);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [id]);

  const handleIframeLoad = () => {
    if (autoPrint) generatePdf.current?.();
  };

  if (status === 'error') {
    return (
      <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#b91c1c', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>Errore generazione PDF</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{errorMsg}</div>
        <button
          onClick={() => window.close()}
          style={{ marginTop: '16px', padding: '6px 16px', background: '#36389D', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {status === 'loading' && (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#374151', textAlign: 'center', fontSize: '14px' }}>
          Generazione preventivo…
        </div>
      )}
      <iframe
        ref={iframeRef}
        onLoad={handleIframeLoad}
        style={{
          width: '794px',
          flex: 1,
          border: 'none',
          background: '#fff',
          margin: '0 auto',
        }}
        title="Preventivo"
      />
    </div>
  );
}
