/**
 * Genera il PDF preventivo Nolosubito — 2 pagine A4, html2canvas.
 * Tutte le immagini pre-caricate come base64 per evitare CORS in html2canvas.
 */

// Converte un URL in base64 data-URI
async function toBase64(url) {
  try {
    const res  = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Mappa marca → photo ID Unsplash (lato profilo auto)
const CAR_PHOTOS = {
  'alfa romeo': 'photo-1669215420652-7dce22a5b7fb',
  'audi':       'photo-1605559424843-9073c6223f59',
  'bmw':        'photo-1555215695-3004980ad54e',
  'citroen':    'photo-1590362891991-f776e747a588',
  'fiat':       'photo-1625047509248-ec889cbff17f',
  'ford':       'photo-1551830820-330a71b99659',
  'hyundai':    'photo-1619767886558-efdc259b6e09',
  'kia':        'photo-1606016159991-dfe4f2746ad5',
  'mercedes':   'photo-1618843479313-40f8afb4b4d8',
  'nissan':     'photo-1556189250-72ba954cfc2b',
  'opel':       'photo-1549317661-bd32c8ce0db2',
  'peugeot':    'photo-1590166788614-9c84a8e1ca5c',
  'renault':    'photo-1598791318878-10e76d178023',
  'seat':       'photo-1552519507-da3b142c6e3d',
  'skoda':      'photo-1552519507-da3b142c6e3d',
  'toyota':     'photo-1623869675781-80aa31012a5a',
  'volkswagen': 'photo-1617814076367-b759c7d7e738',
  'volvo':      'photo-1549317661-bd32c8ce0db2',
};

export async function scaricaPreventivoPDF(prev, clienteNome) {
  const { jsPDF }   = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const fmt  = (n) => n != null
    ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000)
    .toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);

  const qVN = canoneNetto * 0.67;
  const qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67;
  const qSL = canone * 0.33;

  // ── Pre-carica immagini come base64 ──────────────────────────────────────
  const brandKey  = (prev.veicolo_marca || '').toLowerCase().trim();
  const photoId   = CAR_PHOTOS[brandKey] || 'photo-1492144534655-ae79c964c9d7';
  const carUrl    = `https://images.unsplash.com/${photoId}?w=520&h=260&fit=crop&q=75&auto=format`;
  const logoUrl   = `${window.location.origin}/logo-bianco.png`;

  const [carB64, logoB64] = await Promise.all([
    toBase64(carUrl),
    toBase64(logoUrl),
  ]);

  // ── Logo HTML ─────────────────────────────────────────────────────────────
  // logo-bianco.png è bianco su trasparente → usabile solo su sfondo scuro (header navy)
  const logoImg = logoB64
    ? `<img src="${logoB64}" alt="Nolosubito" style="height:34px;width:auto;display:block;"/>`
    : `<span style="font-family:Manrope,sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em;">nolo<span style="color:#FFB100;">subito</span></span>`;

  // ── Foto auto ─────────────────────────────────────────────────────────────
  const carImgTag = carB64
    ? `<img src="${carB64}" alt="${prev.veicolo_marca}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;display:block;"/>`
    : carSVG(); // fallback SVG stilizzato

  // ── Servizi ───────────────────────────────────────────────────────────────
  const SERVIZI = [
    ['R.C.A. Responsabilità Civile',  'Massimale max 25 milioni'],
    ['Copertura Danni Kasko',          'Penale 500 € per sinistro'],
    ['Incendio e Furto',               'Penale 10% sul valore'],
    ['Manutenzione Ordinaria',         'Tagliandi periodici programmati'],
    ['Manutenzione Straordinaria',     'Riparazioni per usura'],
    ['Tassa di Possesso',              'Bollo auto gestito da Nolosubito'],
    ['Immatricolazione',               'Messa su strada inclusa'],
    ['Cambio Pneumatici',              'Stagionali (estivi/invernali)'],
    ['Assistenza Stradale H24',        "Soccorso 365 giorni l'anno"],
    ['Consegna del Veicolo',           'Presso sede o domicilio'],
    ['Gestione Multe',                 'Rinotifica al conducente'],
    ['Customer Care Dedicato',         'Numero verde + e-mail'],
  ];

  const chk = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:10px;height:10px;"><path d="M5 12l5 5L20 7"/></svg>`;
  const sHTML = SERVIZI.map(([n, m]) => `
    <div style="display:flex;gap:8px;align-items:flex-start;padding:7px 2px;font-size:11px;line-height:1.3;color:#1F2B42;border-bottom:1px solid #EDF0F6;">
      <span style="flex-shrink:0;width:16px;height:16px;border-radius:5px;background:#E8F4EE;color:#15815A;display:grid;place-items:center;margin-top:1px;">${chk}</span>
      <div><strong style="font-weight:600;color:#0E1A2E;">${n}</strong><span style="display:block;color:#5E6B82;font-size:9.5px;margin-top:1px;">${m}</span></div>
    </div>`).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<p style="margin:0 0 10px;font-size:11px;color:#5E6B82;padding:10px 14px;background:#F4F6FB;border-radius:8px;line-height:1.5;">${prev.note_cliente.trim()}</p>`
    : '';

  // ── Helpers chip ──────────────────────────────────────────────────────────
  const chipStyle   = 'display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:4px 9px;border-radius:999px;font-size:9.5px;font-weight:600;color:#fff;margin:0 4px 4px 0;';
  const chipAccStyle= 'display:inline-flex;align-items:center;gap:4px;background:#FFB100;border:none;padding:4px 9px;border-radius:999px;font-size:9.5px;font-weight:700;color:#3A2700;margin:0 4px 4px 0;';
  const iconCk  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:10px;height:10px;"><path d="M5 12l5 5L20 7"/></svg>`;
  const iconEye = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/></svg>`;
  const iconClk = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:10px;height:10px;"><path d="M12 8v4l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>`;
  const iconArr = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><path d="M3 12h18M12 3l9 9-9 9"/></svg>`;

  // ── HTML A4 (794×1123px ciascuna) ─────────────────────────────────────────
  const PW = 794;
  const PH = 1123;

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:Manrope,sans-serif;-webkit-font-smoothing:antialiased;color:#0E1A2E;}
  .page{width:${PW}px;height:${PH}px;background:#fff;overflow:hidden;display:flex;flex-direction:column;position:relative;}
</style></head><body>

<!-- ══ PAGINA 1 ══ -->
<div class="page">

  <!-- Top bar blu+arancio -->
  <div style="height:12px;background:linear-gradient(90deg,#0B2E5C 65%,#FFB100 65%);flex-shrink:0;"></div>

  <!-- Header -->
  <div style="padding:18px 40px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E2E7F0;flex-shrink:0;background:#fff;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:42px;height:42px;border-radius:10px;background:#0B2E5C;display:grid;place-items:center;flex-shrink:0;">
        ${logoImg}
      </div>
      <div>
        <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#8693AB;font-weight:600;">Noleggio a Lungo Termine</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#8693AB;font-weight:600;">Offerta N.</div>
      <div style="font-family:'DM Mono',monospace;font-size:15px;color:#0E1A2E;font-weight:500;margin:2px 0;">${rif}</div>
      <div style="font-size:10.5px;color:#5E6B82;">Emessa il ${oggi}</div>
      <span style="display:inline-flex;align-items:center;gap:5px;background:#FFF4D6;color:#7A5400;padding:4px 10px;border-radius:999px;font-size:9.5px;font-weight:700;margin-top:4px;">
        <span style="width:5px;height:5px;border-radius:50%;background:#FFB100;display:inline-block;"></span>
        Valida fino al ${scadenza}
      </span>
    </div>
  </div>

  <!-- Title block -->
  <div style="padding:20px 40px 14px;background:linear-gradient(180deg,#fff 0%,#FAFBFD 100%);flex-shrink:0;">
    <span style="display:inline-block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#0B2E5C;font-weight:700;padding:4px 9px;background:#E8EEF8;border-radius:5px;margin-bottom:10px;">Proposta personalizzata</span>
    <h1 style="font-size:25px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:#0B2E5C;margin:0 0 10px;">Proposta di noleggio <span style="color:#0E1A2E;font-weight:700;">a lungo termine</span><br>di veicolo in locazione</h1>
    <p style="font-size:12.5px;line-height:1.6;color:#1F2B42;max-width:660px;">Gentile <strong style="color:#0B2E5C;font-weight:700;">${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<sup style="color:#0B2E5C;font-weight:700;">(1)</sup>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
  </div>

  <!-- Pair cards -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 40px 12px;flex-shrink:0;">
    <!-- Cliente -->
    <div style="border:1px solid #E2E7F0;border-radius:12px;padding:14px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#5E6B82;font-weight:700;margin-bottom:8px;">
        <span>Cliente</span>
        <span style="width:20px;height:20px;border-radius:5px;background:#E8EEF8;color:#0B2E5C;display:grid;place-items:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
      </div>
      <div style="font-size:17px;font-weight:700;color:#0E1A2E;">${clienteNome || 'Cliente'}</div>
    </div>
    <!-- Consulente -->
    <div style="border:1px solid #E2E7F0;border-radius:12px;padding:14px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#5E6B82;font-weight:700;margin-bottom:8px;">
        <span>Consulente di vendita</span>
        <span style="width:20px;height:20px;border-radius:5px;background:#E8EEF8;color:#0B2E5C;display:grid;place-items:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
      </div>
      <div style="font-size:16px;font-weight:700;color:#0E1A2E;margin-bottom:6px;">Nolosubito S.r.l.</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#1F2B42;margin-top:3px;"><svg viewBox="0 0 24 24" fill="none" stroke="#0B2E5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>+39 06 400 49490</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#1F2B42;margin-top:3px;"><svg viewBox="0 0 24 24" fill="none" stroke="#0B2E5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;flex-shrink:0;"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>info@nolosubito.it</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#1F2B42;margin-top:3px;"><svg viewBox="0 0 24 24" fill="none" stroke="#0B2E5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>nolosubito.it</div>
    </div>
  </div>

  <!-- Vehicle hero: navy a sinistra, foto a destra -->
  <div style="margin:0 40px 12px;border-radius:12px;overflow:hidden;display:grid;grid-template-columns:1.1fr 1fr;flex-shrink:0;">
    <!-- Info veicolo su sfondo navy -->
    <div style="padding:18px 22px;background:linear-gradient(135deg,#0B2E5C 0%,#143C76 100%);color:#fff;position:relative;">
      <div style="position:absolute;right:-50px;top:-50px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,177,0,.2),transparent 65%);pointer-events:none;"></div>
      <div style="font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:600;margin-bottom:5px;position:relative;z-index:1;">Veicolo proposto</div>
      <h2 style="font-size:18px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin:0 0 3px;position:relative;z-index:1;">${prev.veicolo_marca} ${prev.veicolo_modello}</h2>
      <div style="font-size:11.5px;color:rgba(255,255,255,.75);margin-bottom:12px;position:relative;z-index:1;">${prev.veicolo_versione || prev.alimentazione || ''}</div>
      <div style="display:flex;flex-wrap:wrap;position:relative;z-index:1;">
        <span style="${chipAccStyle}">${iconCk} Pronta consegna</span>
        ${prev.alimentazione ? `<span style="${chipStyle}">${iconEye} ${prev.alimentazione}</span>` : ''}
        <span style="${chipStyle}">${iconClk} ${prev.durata_mesi} mesi</span>
        <span style="${chipStyle}">${iconArr} ${fmtN(prev.km_annui)} km/anno</span>
      </div>
    </div>
    <!-- Foto auto su sfondo neutro -->
    <div style="background:#F0F2F8;display:flex;align-items:center;justify-content:center;padding:12px;">
      ${carImgTag}
    </div>
  </div>

  <!-- Canone -->
  <div style="padding:0 40px 12px;display:grid;grid-template-columns:1.55fr 1fr;gap:12px;flex-shrink:0;">
    <!-- Tabella -->
    <div style="border:1px solid #E2E7F0;border-radius:12px;overflow:hidden;">
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:10px 16px;background:#F4F6FB;border-bottom:1px solid #E2E7F0;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:700;">
        <div>Composizione del canone</div><div style="text-align:right;">IVA esclusa</div><div style="text-align:right;">IVA inclusa</div>
      </div>
      ${[
        ['Quota Canone Veicolo', fmt(qVN), fmt(qVL)],
        ['Quota Canone Servizi', fmt(qSN), fmt(qSL)],
        ['Anticipo',             fmt(anticipoNetto), fmt(anticipo)],
      ].map(([l,a,b]) => `
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:10px 16px;border-bottom:1px solid #EDF0F6;font-size:12px;align-items:center;">
        <div style="color:#1F2B42;">${l}</div>
        <div style="text-align:right;color:#0E1A2E;font-weight:500;font-variant-numeric:tabular-nums;">€ ${a}</div>
        <div style="text-align:right;color:#0E1A2E;font-weight:500;font-variant-numeric:tabular-nums;">€ ${b}</div>
      </div>`).join('')}
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:10px 16px;background:#E8EEF8;font-size:12px;align-items:center;font-weight:700;">
        <div style="color:#0B2E5C;">Canone Mensile Totale</div>
        <div style="text-align:right;color:#0B2E5C;font-variant-numeric:tabular-nums;">€ ${fmt(canoneNetto)}</div>
        <div style="text-align:right;color:#0B2E5C;font-variant-numeric:tabular-nums;">€ ${fmt(canone)}</div>
      </div>
    </div>
    <!-- Hero canone -->
    <div style="background:#0B2E5C;border-radius:12px;padding:18px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 90% 110%,rgba(255,177,0,.22),transparent 50%);pointer-events:none;"></div>
      <div style="position:relative;z-index:1;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:5px;">Canone mensile · IVA inclusa</div>
      <div style="position:relative;z-index:1;display:flex;align-items:baseline;gap:3px;line-height:1;">
        <span style="font-size:20px;font-weight:700;color:#FFB100;">€</span>
        <span style="font-size:32px;font-weight:800;letter-spacing:-.03em;color:#fff;">${fmt(canone)}</span>
        <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,.7);margin-left:3px;">/mese</span>
      </div>
      <div style="position:relative;z-index:1;margin-top:6px;font-size:10.5px;color:rgba(255,255,255,.7);line-height:1.4;">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno<br>${fmtN(kmTotali)} km totali</div>
      <div style="position:relative;z-index:1;margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.2);display:flex;justify-content:space-between;align-items:center;font-size:11px;">
        <span style="color:rgba(255,255,255,.75);">Anticipo</span>
        <span style="color:#FFB100;font-weight:700;font-size:13px;background:rgba(255,177,0,.14);padding:2px 9px;border-radius:999px;">€ ${fmt(anticipo)}</span>
      </div>
    </div>
  </div>

  <!-- Servizi -->
  <div style="padding:0 40px 12px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <h3 style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0B2E5C;margin:0;">Servizi inclusi nel canone</h3>
      <span style="background:#E8EEF8;color:#0B2E5C;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px;">${SERVIZI.length} servizi</span>
      <span style="flex:1;height:1px;background:#E2E7F0;"></span>
    </div>
    ${noteExtra}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px 14px;">${sHTML}</div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;padding:10px 40px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#5E6B82;background:#FAFBFD;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:7px;">
      <span style="width:5px;height:5px;border-radius:50%;background:#FFB100;display:inline-block;"></span>
      <strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong>
      <span>· info@nolosubito.it · nolosubito.it · +39 06 400 49490</span>
    </div>
    <div>Pagina 1 di 2</div>
  </div>
</div>

<!-- ══ PAGINA 2 ══ -->
<div class="page">

  <div style="height:12px;background:linear-gradient(90deg,#0B2E5C 65%,#FFB100 65%);flex-shrink:0;"></div>

  <div style="padding:18px 40px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E2E7F0;flex-shrink:0;background:#fff;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:42px;height:42px;border-radius:10px;background:#0B2E5C;display:grid;place-items:center;flex-shrink:0;">
        ${logoImg}
      </div>
      <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#8693AB;font-weight:600;">Noleggio a Lungo Termine</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#8693AB;font-weight:600;">Offerta N.</div>
      <div style="font-family:'DM Mono',monospace;font-size:15px;color:#0E1A2E;font-weight:500;margin:2px 0;">${rif}</div>
      <div style="font-size:10.5px;color:#5E6B82;">Emessa il ${oggi}</div>
    </div>
  </div>

  <!-- Titolo pag 2 -->
  <div style="padding:18px 40px 14px;flex-shrink:0;">
    <span style="display:inline-block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#0B2E5C;font-weight:700;padding:4px 9px;background:#E8EEF8;border-radius:5px;margin-bottom:10px;">Dettagli tecnici</span>
    <h1 style="font-size:22px;font-weight:800;letter-spacing:-.025em;line-height:1.15;color:#0B2E5C;margin:0;">Caratteristiche del veicolo<br><span style="color:#0E1A2E;font-weight:700;font-size:20px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</span></h1>
  </div>

  <!-- Specs grid -->
  <div style="padding:0 40px 18px;display:grid;grid-template-columns:1fr 1fr;gap:18px 40px;flex-shrink:0;">
    <div>
      ${[
        ['Marca',             prev.veicolo_marca || '—'],
        ['Modello',           prev.veicolo_modello || '—'],
        prev.veicolo_versione ? ['Versione', prev.veicolo_versione] : null,
        prev.alimentazione    ? ['Alimentazione', prev.alimentazione] : null,
        ['Durata contratto',  `${prev.durata_mesi} mesi`],
        ['Km annui',          `${fmtN(prev.km_annui)} km`],
      ].filter(Boolean).map(([k,v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EDF0F6;font-size:12px;">
          <span style="color:#5E6B82;">${k}</span>
          <span style="color:#0E1A2E;font-weight:600;text-align:right;max-width:58%;">${v}</span>
        </div>`).join('')}
    </div>
    <div>
      ${[
        ['Km totali',          `${fmtN(kmTotali)} km`],
        ['Anticipo',           `€ ${fmt(anticipo)}`],
        ['Canone IVA esclusa', `€ ${fmt(canoneNetto)}/mese`],
        ['Canone IVA inclusa', `€ ${fmt(canone)}/mese`],
      ].map(([k,v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EDF0F6;font-size:12px;">
          <span style="color:#5E6B82;">${k}</span>
          <span style="color:#0E1A2E;font-weight:600;text-align:right;">${v}</span>
        </div>`).join('')}
    </div>
  </div>

  <!-- Perché Nolosubito -->
  <div style="padding:0 40px 16px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <h3 style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0B2E5C;margin:0;">Perché scegliere Nolosubito</h3>
      <span style="flex:1;height:1px;background:#E2E7F0;"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${[
        ['M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z', 'Canone tutto incluso', 'Un solo importo fisso al mese, costi pianificabili senza sorprese.'],
        ['M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2', '15+ anni di esperienza', 'Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.'],
        ['M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM9 12l2 2 4-4', 'Burocrazia zero', 'Immatricolazione, bollo, assicurazione: gestiamo tutto noi.'],
        ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', 'Customer Care H24', 'Assistenza stradale e consulenti dedicati per tutta la durata.'],
      ].map(([path, title, desc]) => `
        <div style="border:1px solid #E2E7F0;border-radius:10px;padding:12px;background:#fff;">
          <div style="width:28px;height:28px;border-radius:7px;background:#E8EEF8;color:#0B2E5C;display:grid;place-items:center;margin-bottom:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="${path}"/></svg>
          </div>
          <h4 style="font-size:11.5px;margin:0 0 3px;color:#0E1A2E;font-weight:700;">${title}</h4>
          <p style="font-size:10px;line-height:1.45;color:#5E6B82;margin:0;">${desc}</p>
        </div>`).join('')}
    </div>
  </div>

  <!-- CTA -->
  <div style="margin:0 40px 16px;background:linear-gradient(135deg,#FFB100 0%,#FF8A00 100%);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-shrink:0;">
    <div>
      <div style="font-weight:800;font-size:14px;color:#3A2700;">Accettando l'offerta, attiviamo subito la pratica.</div>
      <div style="font-size:10.5px;color:#5A3A00;margin-top:2px;">Pronta consegna · Procedura digitale · Risposta in 24h</div>
    </div>
    <a href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}" style="background:#0B2E5C;color:#fff;padding:9px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;gap:7px;text-decoration:none;">
      Accetta offerta
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
  </div>

  <!-- Firma -->
  <div style="padding:0 40px 18px;display:grid;grid-template-columns:1fr 1fr;gap:50px;flex-shrink:0;">
    <div style="border-top:1.5px solid #0E1A2E;padding-top:5px;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:600;">
      Per il Cliente
      <span style="display:block;font-size:10.5px;color:#1F2B42;text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;">${clienteNome || 'Cliente'} · firma per accettazione</span>
    </div>
    <div style="border-top:1.5px solid #0E1A2E;padding-top:5px;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:600;">
      Per Nolosubito S.r.l.
      <span style="display:block;font-size:10.5px;color:#1F2B42;text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;">Il consulente di vendita</span>
    </div>
  </div>

  <!-- Note legali -->
  <div style="padding:0 40px 14px;font-size:9.5px;line-height:1.55;color:#5E6B82;flex-shrink:0;">
    <h4 style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#0B2E5C;margin:0 0 5px;font-weight:700;">Note e condizioni</h4>
    <p style="margin:0 0 5px;"><span style="color:#0B2E5C;font-weight:700;">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.</p>
    <p style="margin:0 0 5px;"><span style="color:#0B2E5C;font-weight:700;">(2)</span> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
    <p style="margin:0 0 10px;">R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici. Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
    <h4 style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#0B2E5C;margin:0 0 5px;font-weight:700;">Informativa Privacy</h4>
    <p style="margin:0;">Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Per esercitare i Suoi diritti: info@nolosubito.it.</p>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;padding:10px 40px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#5E6B82;background:#FAFBFD;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:7px;">
      <span style="width:5px;height:5px;border-radius:50%;background:#FFB100;display:inline-block;"></span>
      <strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong>
      <span>· Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</span>
    </div>
    <div>Pagina 2 di 2 · Ed. 1 — ${new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' })}</div>
  </div>
</div>

</body></html>`;

  // ── Render ────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;top:-${PH * 2 + 200}px;left:0;width:${PW}px;z-index:-999;`;
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 500));

  const pages = wrap.querySelectorAll('.page');
  const doc   = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: false,        // tutto già in base64, no fetch esterni
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: PW,
      height: PH,
      windowWidth: PW,
      imageTimeout: 0,
    });
    if (i > 0) doc.addPage();
    doc.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
  }

  document.body.removeChild(wrap);

  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_').replace(/_+/g, '_');
  doc.save(fileName);
}

// SVG auto stilizzata come fallback (nessun CORS)
function carSVG() {
  return `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:220px;">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8EEF8"/><stop offset="100%" stop-color="#C8D4E8"/></linearGradient>
      <linearGradient id="bdy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D0D8EE" stop-opacity=".95"/><stop offset="100%" stop-color="#A8B4CC" stop-opacity=".8"/></linearGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0B2E5C"/><stop offset="100%" stop-color="#1C4889"/></linearGradient>
    </defs>
    <rect width="360" height="160" fill="url(#bg)"/>
    <path d="M30 110 C36 80,80 56,130 50 L170 38 C210 32,250 36,280 50 L310 64 C330 70,342 82,344 104 L344 124 C344 130,340 134,332 134 L36 134 C30 134,28 130,28 124 Z" fill="url(#bdy)" stroke="#9FB1CE" stroke-width="1"/>
    <path d="M125 58 C150 50,200 48,240 56 L268 70 L268 84 L88 84 L95 78 C102 70,114 62,125 58 Z" fill="url(#win)" opacity=".9"/>
    <rect x="178" y="50" width="3" height="34" fill="#0B2E5C" opacity=".5"/>
    <ellipse cx="335" cy="92" rx="8" ry="4.5" fill="#FFB100"/>
    <ellipse cx="335" cy="92" rx="5" ry="3" fill="#FFF4D6"/>
    <rect x="34" y="87" width="9" height="7" rx="2" fill="#C8412B" opacity=".8"/>
    <g><circle cx="100" cy="134" r="21" fill="#1F2B42"/><circle cx="100" cy="134" r="13" fill="#2D3D5A"/><circle cx="100" cy="134" r="5" fill="#5E6B82"/><circle cx="100" cy="134" r="21" fill="none" stroke="#FFB100" stroke-width="1.2" opacity=".6"/></g>
    <g><circle cx="268" cy="134" r="21" fill="#1F2B42"/><circle cx="268" cy="134" r="13" fill="#2D3D5A"/><circle cx="268" cy="134" r="5" fill="#5E6B82"/><circle cx="268" cy="134" r="21" fill="none" stroke="#FFB100" stroke-width="1.2" opacity=".6"/></g>
    <ellipse cx="186" cy="150" rx="145" ry="4" fill="#000" opacity=".18"/>
  </svg>`;
}
