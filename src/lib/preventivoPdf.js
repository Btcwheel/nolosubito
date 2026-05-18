/**
 * Genera il PDF preventivo Nolosubito.
 * Usa window.print() — rendering nativo del browser, qualità perfetta.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesAnno  = new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' });

  const logoB64 = await fetch('/logo-blu.svg')
    .then(r => r.ok ? r.blob() : null)
    .then(b => b ? new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }) : null)
    .catch(() => null);

  // Lookup immagine veicolo dal catalogo finrent
  const brandKey = (prev.veicolo_marca ?? '').toLowerCase().replace(/\s+/g, '-');
  const modelKey = (prev.veicolo_modello ?? '').split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
  const catalog  = await fetch('/vehicle-catalog.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const vehicleImageUrl = catalog[brandKey]?.[modelKey] ?? null;

  // Converti immagine veicolo in base64 per embedding nel PDF (evita CORS nella finestra di stampa)
  const vehicleImgB64 = vehicleImageUrl
    ? await fetch(vehicleImageUrl)
        .then(r => r.ok ? r.blob() : null)
        .then(b => b ? new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }) : null)
        .catch(() => null)
    : null;

  const logoContent = logoB64
    ? `<img src="${logoB64}" alt="Nolosubito" style="height:32px;width:auto;display:block;filter:brightness(0) invert(1);"/>`
    : `<span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em;">nolosubito</span>`;

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);

  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  const NAVY   = '#2D2E82';
  const ORANGE = '#F96209';
  const DARK   = '#0E1A2E';

  const SERVIZI = [
    { nome: 'R.C.A. Responsabilità Civile',  nota: 'Massimale max 25 milioni' },
    { nome: 'Copertura Danni Kasko',          nota: 'Penale 500 € per sinistro' },
    { nome: 'Incendio e Furto',               nota: 'Penale 10% sul valore' },
    { nome: 'Manutenzione Ordinaria',         nota: 'Tagliandi periodici programmati' },
    { nome: 'Manutenzione Straordinaria',     nota: 'Riparazioni per usura' },
    { nome: 'Tassa di Possesso',              nota: 'Bollo auto gestito da Nolosubito' },
    { nome: 'Immatricolazione',               nota: 'Messa su strada inclusa' },
    { nome: 'Cambio Pneumatici',              nota: 'Stagionali (estivi/invernali)' },
    { nome: 'Assistenza Stradale H24',        nota: "Soccorso 365 giorni l'anno" },
    { nome: 'Consegna del Veicolo',           nota: 'Presso sede o domicilio' },
    { nome: 'Gestione Multe',                 nota: 'Rinotifica al conducente' },
    { nome: 'Customer Care Dedicato',         nota: 'Numero verde + e-mail' },
  ];

  const checkSvg = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#16A34A"/><path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const serviziHTML = SERVIZI.map(s => `
    <div class="service">
      <span class="check">${checkSvg}</span>
      <div>
        <span class="sname">${s.nome}</span>
        <span class="smeta">${s.nota}</span>
      </div>
    </div>`).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<div class="note-box">${prev.note_cliente.trim()}</div>` : '';

  /* ── SVG AUTO (prospettiva 3/4 frontale-laterale) ── */
  const carSvg = `<svg viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D0DBF0"/>
      <stop offset="60%" stop-color="#B8C8E8"/>
      <stop offset="100%" stop-color="#9AAED4"/>
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E8EFF8"/>
      <stop offset="100%" stop-color="#C4D2E8"/>
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6080C0" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3050A0" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A2A3A"/>
      <stop offset="100%" stop-color="#151520"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,50,0.18)"/>
    </filter>
    <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,40,0.22)"/>
      <stop offset="100%" stop-color="rgba(0,0,40,0)"/>
    </radialGradient>
  </defs>

  <!-- ground shadow -->
  <ellipse cx="240" cy="206" rx="190" ry="12" fill="url(#groundShadow)"/>

  <!-- ── BODY ── -->
  <g filter="url(#shadow)">
    <!-- lower body / sill -->
    <path d="M68 148 Q68 158 78 160 L400 160 Q412 158 414 148 L414 138 L68 138 Z" fill="#8A9EC0"/>
    <!-- main body -->
    <path d="M68 138 L78 90 Q82 76 96 68 L170 46 Q210 34 248 33 Q288 32 320 42 L378 62 Q400 70 410 86 L414 138 Z" fill="url(#bodyGrad)"/>
    <!-- body highlight stripe -->
    <path d="M100 132 L106 92 Q109 82 118 76 L175 56 Q212 46 248 45 Q282 44 310 52 L360 68 Q376 74 382 86 L386 132 Z" fill="rgba(255,255,255,0.12)"/>
    <!-- lower accent line -->
    <path d="M72 142 L410 142" stroke="#7A90B4" stroke-width="1.5"/>
    <!-- body crease line -->
    <path d="M85 115 Q200 108 380 118" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" fill="none"/>
  </g>

  <!-- ── ROOF ── -->
  <path d="M170 46 Q210 34 248 33 Q288 32 320 42 L300 44 Q270 36 248 37 Q218 38 186 48 Z" fill="url(#roofGrad)" opacity="0.9"/>

  <!-- ── WINDSHIELD (front) ── -->
  <path d="M100 68 L96 68 L78 90 L78 114 L164 114 L178 46 Q140 50 100 68 Z" fill="url(#glassGrad)"/>
  <!-- windshield glare -->
  <path d="M96 76 L90 90 L96 90 L106 75 Z" fill="rgba(255,255,255,0.18)"/>
  <path d="M100 68 L152 48 L148 56 L98 76 Z" fill="rgba(255,255,255,0.22)"/>

  <!-- ── REAR WINDOW ── -->
  <path d="M320 42 L378 62 L382 114 L300 114 L288 33 Q305 37 320 42 Z" fill="url(#glassGrad)"/>
  <!-- rear glass glare -->
  <path d="M322 48 L372 66 L368 72 L318 54 Z" fill="rgba(255,255,255,0.15)"/>

  <!-- ── A-PILLAR ── -->
  <path d="M178 46 L164 114" stroke="#7088B8" stroke-width="3" stroke-linecap="round"/>
  <!-- B-PILLAR -->
  <path d="M240 38 L242 114" stroke="#7088B8" stroke-width="2.5" stroke-linecap="round"/>
  <!-- C-PILLAR -->
  <path d="M298 34 L300 114" stroke="#7088B8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- ── DOOR HANDLES ── -->
  <rect x="188" y="108" width="28" height="6" rx="3" fill="#A0B4D0" stroke="#8AA0C0" stroke-width="0.8"/>
  <rect x="265" y="108" width="28" height="6" rx="3" fill="#A0B4D0" stroke="#8AA0C0" stroke-width="0.8"/>

  <!-- ── MIRROR (driver side) ── -->
  <path d="M84 84 L68 80 L66 92 L84 94 Z" fill="#B0C0D8" stroke="#96AACA" stroke-width="0.8"/>

  <!-- ── FRONT END ── -->
  <path d="M68 138 Q54 140 48 148 L46 162 Q48 172 58 174 L80 174 L80 162 L68 162 Z" fill="#9AAED0"/>
  <!-- front grille -->
  <rect x="50" y="148" width="24" height="18" rx="3" fill="#1A2840"/>
  <line x1="50" y1="153" x2="74" y2="153" stroke="#2A3850" stroke-width="1"/>
  <line x1="50" y1="158" x2="74" y2="158" stroke="#2A3850" stroke-width="1"/>
  <line x1="50" y1="163" x2="74" y2="163" stroke="#2A3850" stroke-width="1"/>
  <!-- front headlight -->
  <path d="M56 136 L80 138 L80 148 L54 146 Z" fill="#F0F4FF" stroke="#C0CCDE" stroke-width="0.8"/>
  <path d="M58 138 L78 140 L78 146 L56 144 Z" fill="#FFE87A" opacity="0.8"/>
  <!-- daytime running light -->
  <path d="M56 132 L80 134 L80 137 L56 135 Z" fill="${ORANGE}" opacity="0.9"/>

  <!-- ── REAR END ── -->
  <path d="M414 138 Q426 140 430 148 L432 162 Q430 172 420 174 L400 174 L400 162 L414 162 Z" fill="#8898C0"/>
  <!-- rear light -->
  <rect x="406" y="132" width="22" height="22" rx="3" fill="#CC2020"/>
  <rect x="406" y="132" width="22" height="10" rx="3" fill="#FF5050" opacity="0.7"/>
  <line x1="406" y1="142" x2="428" y2="142" stroke="#AA1818" stroke-width="1"/>
  <!-- rear reflector -->
  <rect x="408" y="155" width="18" height="5" rx="2" fill="#FFA040" opacity="0.8"/>

  <!-- ── WHEELS ── -->
  <!-- Rear wheel -->
  <circle cx="126" cy="174" r="36" fill="url(#wheelGrad)"/>
  <circle cx="126" cy="174" r="27" fill="#1E2A3E"/>
  <circle cx="126" cy="174" r="18" fill="#263044"/>
  <!-- rear spokes -->
  <g stroke="#7890B0" stroke-width="3" stroke-linecap="round">
    <line x1="126" y1="156" x2="126" y2="163"/>
    <line x1="126" y1="185" x2="126" y2="192"/>
    <line x1="108" y1="174" x2="115" y2="174"/>
    <line x1="137" y1="174" x2="144" y2="174"/>
    <line x1="113" y1="161" x2="118" y2="166"/>
    <line x1="134" y1="182" x2="139" y2="187"/>
    <line x1="139" y1="161" x2="134" y2="166"/>
    <line x1="118" y1="182" x2="113" y2="187"/>
  </g>
  <circle cx="126" cy="174" r="7" fill="#8090B0"/>
  <circle cx="126" cy="174" r="3.5" fill="#C0CCD8"/>
  <circle cx="126" cy="174" r="36" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.6"/>
  <!-- wheel arch -->
  <path d="M90 174 Q126 142 162 174" fill="none" stroke="#8898C0" stroke-width="5" stroke-linecap="round"/>

  <!-- Front wheel -->
  <circle cx="356" cy="174" r="36" fill="url(#wheelGrad)"/>
  <circle cx="356" cy="174" r="27" fill="#1E2A3E"/>
  <circle cx="356" cy="174" r="18" fill="#263044"/>
  <g stroke="#7890B0" stroke-width="3" stroke-linecap="round">
    <line x1="356" y1="156" x2="356" y2="163"/>
    <line x1="356" y1="185" x2="356" y2="192"/>
    <line x1="338" y1="174" x2="345" y2="174"/>
    <line x1="367" y1="174" x2="374" y2="174"/>
    <line x1="343" y1="161" x2="348" y2="166"/>
    <line x1="364" y1="182" x2="369" y2="187"/>
    <line x1="369" y1="161" x2="364" y2="166"/>
    <line x1="348" y1="182" x2="343" y2="187"/>
  </g>
  <circle cx="356" cy="174" r="7" fill="#8090B0"/>
  <circle cx="356" cy="174" r="3.5" fill="#C0CCD8"/>
  <circle cx="356" cy="174" r="36" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.6"/>
  <path d="M320 174 Q356 142 392 174" fill="none" stroke="#8898C0" stroke-width="5" stroke-linecap="round"/>
</svg>`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>Preventivo ${rif} — Nolosubito</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    color: ${DARK};
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page { size: A4; margin: 0; }

  .page {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    page-break-after: always;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  /* ── HEADER ── */
  .header {
    background: ${NAVY};
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-logo { display: flex; align-items: center; }
  .header-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.25); }
  .header-tagline {
    font-size: 9px; letter-spacing: .12em; text-transform: uppercase;
    color: rgba(255,255,255,.65); font-weight: 600;
  }
  .header-right { text-align: right; }
  .header-right .offer-label {
    font-size: 8px; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.55); font-weight: 600; margin-bottom: 2px;
  }
  .header-right .offer-num {
    font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -.01em;
    line-height: 1;
  }
  .header-right .offer-date { font-size: 9px; color: rgba(255,255,255,.6); margin-top: 3px; }
  .header-right .offer-valid {
    display: inline-block; margin-top: 4px;
    background: ${ORANGE}; color: #fff;
    padding: 3px 10px; border-radius: 999px;
    font-size: 8px; font-weight: 700; letter-spacing: .03em;
  }

  /* ── TITLE BAND ── */
  .title-band {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #E8ECF4;
  }
  .eyebrow {
    font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase;
    color: ${NAVY}; font-weight: 700; margin-bottom: 8px;
  }
  .title-band h1 {
    font-size: 26px; font-weight: 900; letter-spacing: -.03em;
    line-height: 1.1; color: ${DARK}; margin-bottom: 8px;
  }
  .title-band h1 span { color: ${NAVY}; }
  .title-band p {
    font-size: 10.5px; line-height: 1.6; color: #4B5563;
    max-width: 520px;
  }
  .title-band p strong { color: ${DARK}; font-weight: 700; }

  /* ── CLIENTE / CONSULENTE ── */
  .info-strip {
    display: grid; grid-template-columns: 1fr 1px 1fr 1px 1fr;
    background: #F6F8FC;
    border-bottom: 1px solid #E8ECF4;
    padding: 0;
  }
  .info-cell { padding: 12px 20px; }
  .info-sep { background: #E8ECF4; }
  .info-cell .ic-label {
    font-size: 8px; letter-spacing: .08em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700; margin-bottom: 4px;
  }
  .info-cell .ic-name { font-size: 12px; font-weight: 700; color: ${DARK}; }
  .info-cell .ic-sub { font-size: 9.5px; color: #6B7280; margin-top: 2px; }

  /* ── VEHICLE HERO ── */
  .vehicle-hero {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #E8ECF4;
  }
  .vh-left {
    padding: 20px 24px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .vh-label {
    font-size: 8px; letter-spacing: .1em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700; margin-bottom: 8px;
  }
  .vh-model {
    font-size: 22px; font-weight: 900; color: ${DARK};
    letter-spacing: -.02em; line-height: 1.1; margin-bottom: 4px;
  }
  .vh-version { font-size: 12px; color: #4B5563; margin-bottom: 14px; font-weight: 500; }
  .vh-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .vh-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 11px; border-radius: 999px;
    font-size: 9.5px; font-weight: 600;
    background: #EEF2FB; color: ${NAVY};
    border: 1px solid #D4DCEF;
  }
  .vh-chip.hot {
    background: ${ORANGE}; color: #fff; border-color: transparent;
  }
  .vh-right {
    background: #F0F3FA;
    display: flex; align-items: center; justify-content: center;
    padding: 16px 12px;
    min-height: 160px;
  }

  /* ── CANONE HERO ── */
  .canone-hero {
    background: linear-gradient(105deg, ${NAVY} 0%, #1C2878 55%, #12205E 100%);
    padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ch-left { flex: 1; }
  .ch-label {
    font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.6); font-weight: 700; margin-bottom: 6px;
  }
  .ch-amount { display: flex; align-items: baseline; gap: 4px; line-height: 1; }
  .ch-cur { font-size: 20px; font-weight: 700; color: ${ORANGE}; }
  .ch-num { font-size: 48px; font-weight: 900; color: #fff; letter-spacing: -.04em; }
  .ch-per { font-size: 14px; font-weight: 600; color: rgba(255,255,255,.6); }
  .ch-sub { font-size: 10px; color: rgba(255,255,255,.55); margin-top: 6px; }
  .ch-divider { width: 1px; height: 60px; background: rgba(255,255,255,.2); margin: 0 24px; }
  .ch-right { }
  .ch-ant-label { font-size: 9px; color: rgba(255,255,255,.55); margin-bottom: 4px; }
  .ch-ant-val {
    font-size: 22px; font-weight: 800; color: ${ORANGE};
    letter-spacing: -.02em; line-height: 1;
  }
  .ch-ant-net { font-size: 9px; color: rgba(255,255,255,.45); margin-top: 2px; }

  /* ── CANONE TABLE ── */
  .ctable-wrap { padding: 16px 24px 0; }
  .ctable-title {
    font-size: 9px; letter-spacing: .08em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700; margin-bottom: 8px;
  }
  table.ct {
    width: 100%; border-collapse: collapse;
    font-size: 10.5px;
  }
  table.ct thead tr {
    background: ${NAVY}; color: #fff;
  }
  table.ct thead th {
    padding: 8px 12px; font-weight: 700; font-size: 9px;
    letter-spacing: .06em; text-transform: uppercase;
  }
  table.ct thead th:not(:first-child) { text-align: right; }
  table.ct tbody tr:nth-child(odd) { background: #F6F8FC; }
  table.ct tbody tr:nth-child(even) { background: #fff; }
  table.ct tbody tr.total-row { background: #EEF2FB; }
  table.ct tbody td { padding: 8px 12px; }
  table.ct tbody td:not(:first-child) { text-align: right; font-weight: 500; }
  table.ct tbody tr.total-row td {
    font-weight: 800; color: ${NAVY}; font-size: 11px;
    border-top: 2px solid #D4DCEF;
  }

  /* ── SERVIZI ── */
  .svcs-wrap { padding: 14px 24px 0; flex: 1; }
  .svcs-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
  }
  .svcs-header h3 {
    font-size: 9px; letter-spacing: .08em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700; white-space: nowrap;
  }
  .svcs-rule { flex: 1; height: 1px; background: #E8ECF4; }
  .svcs-badge {
    background: #EEF2FB; color: ${NAVY};
    font-size: 8.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
  }
  .svcs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
  .service {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 6px 0; border-bottom: 1px solid #F0F2F8;
  }
  .check { flex-shrink: 0; margin-top: 1px; }
  .sname { display: block; font-size: 10.5px; font-weight: 600; color: ${DARK}; }
  .smeta { display: block; font-size: 9px; color: #9CA3AF; margin-top: 1px; }
  .note-box {
    font-size: 10px; color: #4B5563;
    padding: 10px 14px; background: #F6F8FC;
    border-left: 3px solid ${NAVY};
    border-radius: 0 6px 6px 0; margin-bottom: 10px;
    line-height: 1.5; font-style: italic;
  }

  /* ── FOOTER ── */
  .foot {
    margin-top: auto;
    padding: 10px 24px;
    background: ${NAVY};
    display: flex; justify-content: space-between; align-items: center;
  }
  .foot-left { font-size: 8.5px; color: rgba(255,255,255,.7); }
  .foot-left strong { color: #fff; }
  .foot-right { font-size: 8.5px; color: rgba(255,255,255,.5); }

  /* ── PAGINA 2 ── */
  .p2-content { padding: 24px 24px 0; flex: 1; }
  .section-title {
    font-size: 9px; letter-spacing: .08em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700; margin-bottom: 14px;
    padding-bottom: 8px; border-bottom: 1px solid #E8ECF4;
  }
  .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; margin-bottom: 24px; }
  .spec-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #F0F2F8; font-size: 11px;
  }
  .spec-row .sk { color: #6B7280; }
  .spec-row .sv { font-weight: 700; color: ${DARK}; text-align: right; }

  .why-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 24px; }
  .why-card {
    border: 1px solid #E8ECF4; border-radius: 10px; padding: 14px 12px;
    background: #FAFBFD;
  }
  .why-icon { font-size: 20px; margin-bottom: 8px; }
  .why-card h4 { font-size: 10px; font-weight: 700; color: ${DARK}; margin-bottom: 4px; }
  .why-card p { font-size: 9px; color: #6B7280; line-height: 1.5; }

  .cta-band {
    background: linear-gradient(105deg, ${ORANGE} 0%, #E05500 100%);
    border-radius: 12px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
  }
  .cta-band .cta-title { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 3px; }
  .cta-band .cta-sub { font-size: 9.5px; color: rgba(255,255,255,.8); }
  .cta-btn {
    background: #fff; color: ${ORANGE};
    padding: 9px 18px; border-radius: 999px;
    font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
    text-transform: uppercase; text-decoration: none;
    white-space: nowrap; display: inline-block;
  }

  .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 24px; }
  .sign-block { border-top: 2px solid ${DARK}; padding-top: 6px; }
  .sign-label {
    font-size: 8px; letter-spacing: .12em; text-transform: uppercase;
    color: #9CA3AF; font-weight: 700;
  }
  .sign-name { font-size: 10.5px; color: #4B5563; margin-top: 3px; }

  .legal {
    font-size: 8px; line-height: 1.6; color: #9CA3AF;
    padding-bottom: 10px;
  }
  .legal h5 {
    font-size: 8px; letter-spacing: .06em; text-transform: uppercase;
    color: ${NAVY}; font-weight: 700; margin: 10px 0 4px;
  }
  .legal p { margin-bottom: 3px; }
  .nref { color: ${NAVY}; font-weight: 700; }

  @media print {
    body { background: #fff; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>

<!-- ══════════════════ PAGINA 1 ══════════════════ -->
<div class="page">

  <!-- Header navy full-bleed -->
  <div class="header">
    <div class="header-left">
      <div class="header-logo">${logoContent}</div>
      <div class="header-divider"></div>
      <div class="header-tagline">Noleggio a Lungo Termine</div>
    </div>
    <div class="header-right">
      <div class="offer-label">Offerta N.</div>
      <div class="offer-num">${rif}</div>
      <div class="offer-date">Emessa il ${oggi}</div>
      <div class="offer-valid">Valida fino al ${scadenza}</div>
    </div>
  </div>

  <!-- Titolo + intro -->
  <div class="title-band">
    <div class="eyebrow">Proposta personalizzata</div>
    <h1>Proposta di noleggio<br><span>a lungo termine</span></h1>
    <p>Gentile <strong>${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<span class="nref">(1)</span>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
  </div>

  <!-- Info strip -->
  <div class="info-strip">
    <div class="info-cell">
      <div class="ic-label">Cliente</div>
      <div class="ic-name">${clienteNome || 'Cliente'}</div>
    </div>
    <div class="info-sep"></div>
    <div class="info-cell">
      <div class="ic-label">Consulente di vendita</div>
      <div class="ic-name">Nolosubito S.r.l.</div>
      <div class="ic-sub">+39 06 400 49490 · info@nolosubito.it</div>
    </div>
    <div class="info-sep"></div>
    <div class="info-cell">
      <div class="ic-label">Validità offerta</div>
      <div class="ic-name">${scadenza}</div>
      <div class="ic-sub">Emessa il ${oggi}</div>
    </div>
  </div>

  <!-- Veicolo hero -->
  <div class="vehicle-hero">
    <div class="vh-left">
      <div class="vh-label">Veicolo proposto</div>
      <div class="vh-model">${prev.veicolo_marca} ${prev.veicolo_modello}</div>
      <div class="vh-version">${prev.veicolo_versione || prev.alimentazione || ''}</div>
      <div class="vh-chips">
        <span class="vh-chip hot">✓ Pronta consegna</span>
        ${prev.alimentazione ? `<span class="vh-chip">${prev.alimentazione}</span>` : ''}
        <span class="vh-chip">${prev.durata_mesi} mesi</span>
        <span class="vh-chip">${fmtN(prev.km_annui)} km/anno</span>
      </div>
    </div>
    <div class="vh-right">
      ${vehicleImgB64
        ? `<img src="${vehicleImgB64}" alt="${prev.veicolo_marca} ${prev.veicolo_modello}" style="width:100%;height:100%;object-fit:contain;display:block;"/>`
        : carSvg}
    </div>
  </div>

  <!-- Canone hero -->
  <div class="canone-hero">
    <div class="ch-left">
      <div class="ch-label">Canone mensile · IVA inclusa</div>
      <div class="ch-amount">
        <span class="ch-cur">€</span>
        <span class="ch-num">${fmt(canone)}</span>
        <span class="ch-per">/mese</span>
      </div>
      <div class="ch-sub">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno · ${fmtN(kmTotali)} km totali</div>
    </div>
    <div class="ch-divider"></div>
    <div class="ch-right">
      <div class="ch-ant-label">Anticipo</div>
      <div class="ch-ant-val">€ ${fmt(anticipo)}</div>
      <div class="ch-ant-net">IVA esclusa: € ${fmt(anticipoNetto)}</div>
    </div>
  </div>

  <!-- Tabella composizione canone -->
  <div class="ctable-wrap">
    <div class="ctable-title">Composizione del canone mensile</div>
    <table class="ct">
      <thead>
        <tr>
          <th style="text-align:left;">Voce</th>
          <th>IVA esclusa</th>
          <th>IVA inclusa (22%)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Quota Canone Veicolo</td><td>€ ${fmt(qVN)}</td><td>€ ${fmt(qVL)}</td></tr>
        <tr><td>Quota Canone Servizi</td><td>€ ${fmt(qSN)}</td><td>€ ${fmt(qSL)}</td></tr>
        <tr><td>Anticipo</td><td>€ ${fmt(anticipoNetto)}</td><td>€ ${fmt(anticipo)}</td></tr>
        <tr class="total-row"><td>Canone Mensile Totale</td><td>€ ${fmt(canoneNetto)}</td><td>€ ${fmt(canone)}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Servizi inclusi -->
  <div class="svcs-wrap">
    <div class="svcs-header">
      <h3>Servizi inclusi nel canone</h3>
      <span class="svcs-rule"></span>
      <span class="svcs-badge">${SERVIZI.length} servizi</span>
    </div>
    ${noteExtra}
    <div class="svcs-grid">${serviziHTML}</div>
  </div>

  <!-- Footer -->
  <div class="foot">
    <div class="foot-left"><strong>Nolosubito S.r.l.</strong> · info@nolosubito.it · nolosubito.it · +39 06 400 49490</div>
    <div class="foot-right">Pagina 1 di 2</div>
  </div>

</div>

<!-- ══════════════════ PAGINA 2 ══════════════════ -->
<div class="page">

  <!-- Header identico -->
  <div class="header">
    <div class="header-left">
      <div class="header-logo">${logoContent}</div>
      <div class="header-divider"></div>
      <div class="header-tagline">Noleggio a Lungo Termine</div>
    </div>
    <div class="header-right">
      <div class="offer-label">Offerta N.</div>
      <div class="offer-num">${rif}</div>
      <div class="offer-date">Emessa il ${oggi}</div>
    </div>
  </div>

  <div class="p2-content">

    <!-- Dettagli veicolo -->
    <div class="section-title">Caratteristiche del veicolo — ${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</div>
    <div class="specs-grid">
      <div>
        ${[
          ['Marca', prev.veicolo_marca || '—'],
          ['Modello', prev.veicolo_modello || '—'],
          ...(prev.veicolo_versione ? [['Versione', prev.veicolo_versione]] : []),
          ...(prev.alimentazione ? [['Alimentazione', prev.alimentazione]] : []),
          ['Durata contratto', `${prev.durata_mesi} mesi`],
        ].map(([k,v]) => `<div class="spec-row"><span class="sk">${k}</span><span class="sv">${v}</span></div>`).join('')}
      </div>
      <div>
        ${[
          ['Km annui', `${fmtN(prev.km_annui)} km`],
          ['Km totali', `${fmtN(kmTotali)} km`],
          ['Anticipo', `€ ${fmt(anticipo)}`],
          ['Canone IVA esclusa', `€ ${fmt(canoneNetto)}/mese`],
          ['Canone IVA inclusa', `€ ${fmt(canone)}/mese`],
        ].map(([k,v]) => `<div class="spec-row"><span class="sk">${k}</span><span class="sv">${v}</span></div>`).join('')}
      </div>
    </div>

    <!-- Perché Nolosubito -->
    <div class="section-title">Perché scegliere Nolosubito</div>
    <div class="why-grid">
      <div class="why-card">
        <div class="why-icon">🛡️</div>
        <h4>Canone tutto incluso</h4>
        <p>Un solo importo fisso al mese, costi pianificabili senza sorprese.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">⏱️</div>
        <h4>15+ anni di esperienza</h4>
        <p>Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">✅</div>
        <h4>Burocrazia zero</h4>
        <p>Immatricolazione, bollo, assicurazione: gestiamo tutto noi.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">💬</div>
        <h4>Customer Care H24</h4>
        <p>Assistenza stradale e consulenti dedicati per tutta la durata.</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-band">
      <div>
        <div class="cta-title">Accettando l'offerta, attiviamo subito la pratica.</div>
        <div class="cta-sub">Pronta consegna · Procedura digitale · Risposta in 24h</div>
      </div>
      <a class="cta-btn" href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}">Accetta offerta →</a>
    </div>

    <!-- Firma -->
    <div class="sign-grid">
      <div class="sign-block">
        <div class="sign-label">Per il Cliente</div>
        <div class="sign-name">${clienteNome || 'Cliente'} · firma per accettazione</div>
      </div>
      <div class="sign-block">
        <div class="sign-label">Per Nolosubito S.r.l.</div>
        <div class="sign-name">Il consulente di vendita</div>
      </div>
    </div>

    <!-- Legal -->
    <div class="legal">
      <h5>Note e condizioni</h5>
      <p><span class="nref">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.</p>
      <p><span class="nref">(2)</span> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
      <p>R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
      <h5>Informativa Privacy</h5>
      <p>Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Per esercitare i Suoi diritti: info@nolosubito.it.</p>
    </div>

  </div>

  <!-- Footer -->
  <div class="foot">
    <div class="foot-left"><strong>Nolosubito S.r.l.</strong> · Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</div>
    <div class="foot-right">Pagina 2 di 2 · Ed. 1 — ${mesAnno}</div>
  </div>

</div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=750');
  if (!win) {
    alert('Abilita i popup per generare il PDF');
    return;
  }
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 2000);
  };
}
