/**
 * Genera il PDF preventivo Nolosubito.
 * Usa window.print() — rendering nativo del browser, qualità perfetta.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';
  const val  = (v) => v?.toString().trim() || 'A definire';

  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesAnno  = new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' });

  const logoB64 = await fetch('/logo-blu.svg')
    .then(r => r.ok ? r.blob() : null)
    .then(b => b ? new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }) : null)
    .catch(() => null);

  const logoContent = logoB64
    ? `<img src="${logoB64}" alt="Nolosubito" style="height:28px;width:auto;display:block;filter:brightness(0) invert(1);"/>`
    : `<span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em;">nolosubito</span>`;

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);

  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  const NAVY   = '#2D2E82';
  const ORANGE = '#F96209';
  const DARK   = '#111827';

  const SERVIZI = [
    ['R.C.A. Responsabilità Civile',  'Massimale max 25 milioni'],
    ['Copertura Danni Kasko',          'Penale 500 € per sinistro'],
    ['Incendio e Furto',               'Penale 10% sul valore'],
    ['Manutenzione Ordinaria',         'Tagliandi periodici programmati'],
    ['Manutenzione Straordinaria',     'Riparazioni per usura'],
    ['Tassa di Possesso',              'Bollo auto gestito da broker'],
    ['Immatricolazione',               'Messa su strada inclusa'],
    ['Cambio Pneumatici',              'Stagionali (estivi/invernali)'],
    ['Assistenza Stradale H24',        "Soccorso 365 giorni l'anno"],
    ['Consegna del Veicolo',           'Presso sede o domicilio'],
    ['Gestione Multe',                 'Rinotifica al conducente'],
    ['Customer Care Dedicato',         'Numero verde + e-mail'],
  ];

  const checkSvg = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink:0;margin-top:1px"><circle cx="6.5" cy="6.5" r="6.5" fill="#16A34A"/><path d="M3.5 6.5l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const serviziHTML = SERVIZI.map(([n, m]) => `
    <div style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:1px solid #F1F3F9;">
      ${checkSvg}
      <div>
        <span style="display:block;font-size:9.5px;font-weight:600;color:${DARK};">${n}</span>
        <span style="display:block;font-size:8.5px;color:#9CA3AF;margin-top:1px;">${m}</span>
      </div>
    </div>`).join('');

  const chipsVeicolo = [
    { label: '✓ Pronta consegna', hot: true },
    ...(prev.alimentazione ? [{ label: prev.alimentazione }] : []),
    ...(prev.veicolo_versione?.toLowerCase().includes('cv') || prev.veicolo_versione?.toLowerCase().includes('kw') ? [] : []),
    { label: `${prev.durata_mesi} mesi` },
    { label: `${fmtN(prev.km_annui)} km/anno` },
    ...(prev.cambio ? [{ label: prev.cambio }] : []),
  ].map(c => c.hot
    ? `<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:8.5px;font-weight:700;background:${ORANGE};color:#fff;">${c.label}</span>`
    : `<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:8.5px;font-weight:600;border:1px solid rgba(255,255,255,.35);color:rgba(255,255,255,.9);">${c.label}</span>`
  ).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<div style="font-size:9px;color:#6B7280;padding:8px 12px;background:#F8F9FC;border-left:3px solid ${NAVY};border-radius:0 4px 4px 0;margin-bottom:10px;font-style:italic;line-height:1.5;">${prev.note_cliente.trim()}</div>` : '';

  // Campi tecnici (page 2)
  const specsLeft = [
    ['Marca',         prev.veicolo_marca   || '—'],
    ['Modello',       prev.veicolo_modello || '—'],
    ['Versione',      prev.veicolo_versione || '—'],
    ['Alimentazione', prev.alimentazione   || '—'],
    ['Cambio',        prev.cambio          || '—'],
    ['Carrozzeria',   prev.carrozzeria      || '—'],
    ['Potenza',       prev.potenza         || '—'],
  ];
  const specsRight = [
    ['Colore esterno',    prev.colore_esterno  || 'A definire'],
    ['Interni',           prev.interni          || 'A definire'],
    ['Emissioni CO₂',     prev.emissioni_co2   || '—'],
    ['Classe ambientale', prev.classe_ambientale || '—'],
    ['Durata contratto',  `${prev.durata_mesi} mesi`],
    ['Km annui',          `${fmtN(prev.km_annui)} km`],
    ['Km totali',         `${fmtN(kmTotali)} km`],
  ];

  const specRow = ([k, v]) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid #F1F3F9;font-size:9.5px;">
      <span style="color:#6B7280;">${k}</span>
      <span style="font-weight:600;color:${DARK};text-align:right;max-width:55%;">${v}</span>
    </div>`;

  const listing   = Number(prev.valore_listing || prev.valore_veicolo || 0);
  const optional  = Number(prev.valore_optional || 0);
  const accessori = Number(prev.valore_accessori || 0);
  const totVeicolo = listing + optional + accessori;

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
    background: #E4E7F2;
    color: ${DARK};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }

  .page {
    width: 210mm;
    min-height: 297mm;
    background: #E4E7F2;
    padding: 9mm 11mm;
    page-break-after: always;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  .card {
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(30,40,100,0.13);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .hdr {
    background: ${NAVY};
    display: grid;
    grid-template-columns: 1fr auto;
    min-height: 48px;
  }
  .hdr-left {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px;
  }
  .hdr-sep { width: 1px; background: rgba(255,255,255,.25); height: 28px; }
  .hdr-tag { font-size: 7.5px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.6); font-weight: 600; }
  .hdr-right {
    display: flex; flex-direction: column; align-items: flex-end; justify-content: center;
    padding: 8px 14px;
    border-left: 3px solid ${ORANGE};
  }
  .hdr-right .lbl { font-size: 7px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.55); font-weight: 600; }
  .hdr-right .num { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -.01em; line-height: 1.1; }
  .hdr-right .dt  { font-size: 8px; color: rgba(255,255,255,.6); margin-top: 1px; }
  .hdr-right .valid {
    display: inline-block; margin-top: 4px;
    background: ${ORANGE}; color: #fff;
    padding: 2px 8px; border-radius: 999px;
    font-size: 7.5px; font-weight: 700;
  }

  /* ── BODY ── */
  .body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; }

  .eyebrow {
    display: inline-block;
    font-size: 7.5px; letter-spacing: .1em; text-transform: uppercase;
    color: ${NAVY}; font-weight: 700;
    background: #EAECF8; padding: 3px 8px; border-radius: 3px;
    margin-bottom: 8px;
  }
  .title h1 {
    font-size: 21px; font-weight: 900; letter-spacing: -.02em;
    line-height: 1.15; color: ${DARK}; margin-bottom: 6px;
  }
  .title h1 strong { color: ${NAVY}; }
  .title p { font-size: 9.5px; line-height: 1.6; color: #4B5563; margin-bottom: 12px; }
  .title p strong { color: ${DARK}; font-weight: 700; }

  /* ── CLIENT CARDS ── */
  .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .client-card { border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px 12px; }
  .cc-label { font-size: 7px; letter-spacing: .1em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  .cc-name  { font-size: 12px; font-weight: 700; color: ${DARK}; margin-bottom: 4px; }
  .cc-row   { font-size: 9px; color: #6B7280; margin-top: 2px; display: flex; align-items: center; gap: 5px; }

  /* ── VEHICLE ── */
  .vehicle {
    background: linear-gradient(120deg, #1A1F6E 0%, #2D2E82 45%, #1A3A7A 100%);
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 12px;
  }
  .v-label { font-size: 7px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.55); font-weight: 700; margin-bottom: 5px; }
  .v-name  { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -.02em; line-height: 1.1; margin-bottom: 2px; }
  .v-ver   { font-size: 9.5px; color: rgba(255,255,255,.7); margin-bottom: 10px; }
  .v-chips { display: flex; flex-wrap: wrap; gap: 5px; }

  /* ── CANONE SECTION ── */
  .canone-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 10px; margin-bottom: 12px; }

  .ct-label { font-size: 7.5px; letter-spacing: .08em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; margin-bottom: 6px; }
  .ct table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .ct table thead tr { background: ${NAVY}; }
  .ct table thead th { padding: 6px 8px; font-size: 7.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #fff; }
  .ct table thead th:not(:first-child) { text-align: right; }
  .ct table tbody tr:nth-child(odd) { background: #F8F9FC; }
  .ct table tbody td { padding: 6px 8px; }
  .ct table tbody td:not(:first-child) { text-align: right; font-weight: 500; }
  .ct table tbody tr.tot { background: #EAECF8; }
  .ct table tbody tr.tot td { font-weight: 800; color: ${NAVY}; font-size: 9.5px; border-top: 1.5px solid #D0D4EF; }

  .cbox { border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; }
  .cbox-hdr { background: ${NAVY}; padding: 7px 10px; font-size: 7px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #fff; }
  .cbox-body { padding: 10px; }
  .cbox-price { display: flex; align-items: baseline; gap: 2px; line-height: 1; margin-bottom: 4px; }
  .cbox-cur  { font-size: 14px; font-weight: 700; color: ${ORANGE}; }
  .cbox-num  { font-size: 32px; font-weight: 900; color: ${ORANGE}; letter-spacing: -.03em; }
  .cbox-per  { font-size: 10px; font-weight: 600; color: #9CA3AF; }
  .cbox-sub  { font-size: 8px; color: #9CA3AF; line-height: 1.4; margin-bottom: 8px; }
  .cbox-ant  { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #E5E7EB; }
  .cbox-ant-l { font-size: 8.5px; color: #6B7280; }
  .cbox-ant-v { font-size: 12px; font-weight: 800; color: ${NAVY}; }

  /* ── SERVICES ── */
  .svcs-hdr  { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .svcs-hdr h3 { font-size: 7.5px; letter-spacing: .08em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; white-space: nowrap; }
  .svcs-rule { flex: 1; height: 1px; background: #E5E7EB; }
  .svcs-badge { background: #EAECF8; color: ${NAVY}; font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 3px; }
  .svcs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 14px; }

  /* ── FOOTER ── */
  .foot {
    padding: 8px 16px;
    background: ${NAVY};
    display: flex; justify-content: space-between; align-items: center;
    margin-top: auto;
  }
  .foot span { font-size: 8px; color: rgba(255,255,255,.65); }
  .foot strong { color: #fff; }
  .foot .dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${ORANGE}; margin-right: 5px; vertical-align: middle; }

  /* ── PAGE 2 ── */
  .p2body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; }
  .sec-title { font-size: 7.5px; letter-spacing: .09em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; padding-bottom: 7px; border-bottom: 1px solid #E5E7EB; margin-bottom: 12px; }
  .specs-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; margin-bottom: 16px; }
  .valore-grid { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 16px; align-items: stretch; }
  .vbox { border: 1px solid #E5E7EB; border-radius: 5px; padding: 8px 10px; }
  .vbox .vl { font-size: 7px; letter-spacing: .08em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; margin-bottom: 4px; }
  .vbox .vv { font-size: 14px; font-weight: 800; color: ${DARK}; }
  .vbox-tot { background: ${NAVY}; border-radius: 5px; padding: 8px 12px; display: flex; flex-direction: column; justify-content: center; }
  .vbox-tot .vl { font-size: 7px; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.6); font-weight: 700; margin-bottom: 4px; }
  .vbox-tot .vv { font-size: 14px; font-weight: 800; color: #fff; }
  .why-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 14px; }
  .why-card { border: 1px solid #E5E7EB; border-radius: 7px; padding: 10px 9px; background: #FAFBFD; }
  .why-ic { font-size: 18px; margin-bottom: 5px; }
  .why-card h4 { font-size: 9px; font-weight: 700; color: ${DARK}; margin-bottom: 3px; }
  .why-card p  { font-size: 8px; color: #6B7280; line-height: 1.45; }
  .cta {
    background: linear-gradient(105deg, ${ORANGE} 0%, #D94E00 100%);
    border-radius: 8px; padding: 13px 16px;
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .cta-t { font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .cta-s { font-size: 8.5px; color: rgba(255,255,255,.8); }
  .cta-btn {
    background: ${NAVY}; color: #fff;
    padding: 8px 14px; border-radius: 999px;
    font-size: 8.5px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; text-decoration: none; white-space: nowrap;
  }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 14px; }
  .sign-bl { border-top: 1.5px solid ${DARK}; padding-top: 5px; }
  .sign-lbl { font-size: 7.5px; letter-spacing: .12em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; }
  .sign-nm  { font-size: 9.5px; color: #4B5563; margin-top: 2px; }
  .legal    { font-size: 7.5px; line-height: 1.55; color: #9CA3AF; }
  .legal h5 { font-size: 7.5px; letter-spacing: .07em; text-transform: uppercase; color: ${NAVY}; font-weight: 700; margin: 8px 0 3px; }
  .legal p  { margin-bottom: 3px; }
  .nref { color: ${NAVY}; font-weight: 700; }

  @media print {
    body { background: #E4E7F2; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>

<!-- ══════════ PAGINA 1 ══════════ -->
<div class="page">
<div class="card">

  <div class="hdr">
    <div class="hdr-left">
      ${logoContent}
      <div class="hdr-sep"></div>
      <div class="hdr-tag">Noleggio a Lungo Termine</div>
    </div>
    <div class="hdr-right">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
      <div class="valid">Valida fino al ${scadenza}</div>
    </div>
  </div>

  <div class="body">

    <div class="eyebrow">Proposta personalizzata</div>
    <div class="title">
      <h1>Proposta di noleggio <strong>a lungo termine</strong><br>di veicolo in locazione</h1>
      <p>Gentile <strong>${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<span class="nref">(1)</span>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
    </div>

    <div class="client-grid">
      <div class="client-card">
        <div class="cc-label">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="3.5" r="2.5" stroke="#9CA3AF" stroke-width="1.2"/><path d="M1 10c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round"/></svg>
          Cliente
        </div>
        <div class="cc-name">${clienteNome || 'Cliente'}</div>
        ${prev.cliente_email ? `<div class="cc-row"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x=".5" y="1.5" width="8" height="6" rx="1" stroke="#9CA3AF" stroke-width=".9"/><path d="M.5 2.5l4 2.5 4-2.5" stroke="#9CA3AF" stroke-width=".9"/></svg>${prev.cliente_email}</div>` : ''}
        ${prev.cliente_telefono ? `<div class="cc-row"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1.5A.5.5 0 011.5 1h1.6l.8 2-1 .7a5.5 5.5 0 002.4 2.4l.7-1 2 .8v1.6a.5.5 0 01-.5.5C3.4 8 1 5.6 1 2.5z" stroke="#9CA3AF" stroke-width=".9"/></svg>+39 ${prev.cliente_telefono}</div>` : ''}
      </div>
      <div class="client-card">
        <div class="cc-label">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="3.5" r="2.5" stroke="#9CA3AF" stroke-width="1.2"/><path d="M1 10c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round"/></svg>
          Consulente di vendita
        </div>
        <div class="cc-name">Nolosubito S.r.l.</div>
        <div class="cc-row"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1.5A.5.5 0 011.5 1h1.6l.8 2-1 .7a5.5 5.5 0 002.4 2.4l.7-1 2 .8v1.6a.5.5 0 01-.5.5C3.4 8 1 5.6 1 2.5z" stroke="#9CA3AF" stroke-width=".9"/></svg>+39 06 400 49490</div>
        <div class="cc-row"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x=".5" y="1.5" width="8" height="6" rx="1" stroke="#9CA3AF" stroke-width=".9"/><path d="M.5 2.5l4 2.5 4-2.5" stroke="#9CA3AF" stroke-width=".9"/></svg>info@nolosubito.it</div>
        <div class="cc-row"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4.5" cy="4.5" r="4" stroke="#9CA3AF" stroke-width=".9"/><path d="M1.5 4.5h6M4.5 1c-1 1.5-1.5 2.3-1.5 3.5S3.5 7 4.5 8M4.5 1c1 1.5 1.5 2.3 1.5 3.5S5.5 7 4.5 8" stroke="#9CA3AF" stroke-width=".9"/></svg>nolosubito.it</div>
      </div>
    </div>

    <div class="vehicle">
      <div class="v-label">Veicolo proposto</div>
      <div class="v-name">${prev.veicolo_marca} ${prev.veicolo_modello}</div>
      <div class="v-ver">${[prev.veicolo_versione, prev.alimentazione].filter(Boolean).join(' · ')}</div>
      <div class="v-chips">${chipsVeicolo}</div>
    </div>

    <div class="canone-row">
      <div class="ct">
        <div class="ct-label">Composizione del canone</div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Voce</th>
              <th>IVA esclusa</th>
              <th>IVA inclusa</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Quota Canone Veicolo</td><td style="text-align:right;">€ ${fmt(qVN)}</td><td style="text-align:right;">€ ${fmt(qVL)}</td></tr>
            <tr><td>Quota Canone Servizi</td><td style="text-align:right;">€ ${fmt(qSN)}</td><td style="text-align:right;">€ ${fmt(qSL)}</td></tr>
            <tr><td>Anticipo</td><td style="text-align:right;">€ ${fmt(anticipoNetto)}</td><td style="text-align:right;">€ ${fmt(anticipo)}</td></tr>
            <tr class="tot"><td>Canone Mensile Totale</td><td style="text-align:right;">€ ${fmt(canoneNetto)}</td><td style="text-align:right;">€ ${fmt(canone)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="cbox">
        <div class="cbox-hdr">Canone mensile · IVA inclusa</div>
        <div class="cbox-body">
          <div class="cbox-price">
            <span class="cbox-cur">€</span>
            <span class="cbox-num">${fmt(canone)}</span>
            <span class="cbox-per">/mese</span>
          </div>
          <div class="cbox-sub">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno<br>${fmtN(kmTotali)} km totali</div>
          <div class="cbox-ant">
            <span class="cbox-ant-l">Anticipo</span>
            <span class="cbox-ant-v">€ ${fmt(anticipo)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="svcs-hdr">
      <h3>Servizi inclusi nel canone</h3>
      <span class="svcs-rule"></span>
      <span class="svcs-badge">${SERVIZI.length} servizi</span>
    </div>
    ${noteExtra}
    <div class="svcs-grid">${serviziHTML}</div>

  </div>

  <div class="foot">
    <span><span class="dot"></span><strong>Nolosubito S.r.l.</strong> · info@nolosubito.it · nolosubito.it · +39 06 400 49490</span>
    <span>Pagina 1 di 2</span>
  </div>

</div>
</div>

<!-- ══════════ PAGINA 2 ══════════ -->
<div class="page">
<div class="card">

  <div class="hdr">
    <div class="hdr-left">
      ${logoContent}
      <div class="hdr-sep"></div>
      <div class="hdr-tag">Noleggio a Lungo Termine</div>
    </div>
    <div class="hdr-right">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
    </div>
  </div>

  <div class="p2body">

    <div class="eyebrow">Dettagli tecnici</div>
    <div class="title" style="margin-bottom:12px;">
      <h1 style="font-size:17px;">Caratteristiche del veicolo<br><span style="color:${NAVY};font-size:15px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</span></h1>
    </div>

    <div class="sec-title">Dati tecnici veicolo</div>
    <div class="specs-2col" style="margin-bottom:16px;">
      <div>${specsLeft.map(specRow).join('')}</div>
      <div>${specsRight.map(specRow).join('')}</div>
    </div>

    <div class="sec-title">Valore del veicolo</div>
    <div class="valore-grid">
      <div class="vbox"><div class="vl">Listing</div><div class="vv">€ ${fmt(listing)}</div></div>
      <div class="vbox"><div class="vl">Optional</div><div class="vv">€ ${fmt(optional)}</div></div>
      <div class="vbox"><div class="vl">Accessori</div><div class="vv">€ ${fmt(accessori)}</div></div>
      <div class="vbox-tot"><div class="vl">Totale veicolo</div><div class="vv">€ ${fmt(totVeicolo)}</div></div>
    </div>

    <div class="sec-title">Perché scegliere Nolosubito</div>
    <div class="why-grid">
      <div class="why-card"><div class="why-ic">🛡️</div><h4>Canone tutto incluso</h4><p>Un solo importo fisso al mese, costi pianificabili senza sorprese.</p></div>
      <div class="why-card"><div class="why-ic">⏱️</div><h4>15+ anni di esperienza</h4><p>Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.</p></div>
      <div class="why-card"><div class="why-ic">✅</div><h4>Burocrazia zero</h4><p>Immatricolazione, bollo, assicurazione: gestiamo tutto noi.</p></div>
      <div class="why-card"><div class="why-ic">💬</div><h4>Customer Care H24</h4><p>Assistenza stradale e consulenti dedicati per tutta la durata.</p></div>
    </div>

    <div class="cta">
      <div>
        <div class="cta-t">Accettando l'offerta, attiviamo subito la pratica.</div>
        <div class="cta-s">Pronta consegna · Procedura digitale · Risposta in 24h</div>
      </div>
      <a class="cta-btn" href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}">Accetta offerta →</a>
    </div>

    <div class="sign-grid">
      <div class="sign-bl">
        <div class="sign-lbl">Per il Cliente</div>
        <div class="sign-nm">${clienteNome || 'Cliente'} · firma per accettazione</div>
      </div>
      <div class="sign-bl">
        <div class="sign-lbl">Per Nolosubito S.r.l.</div>
        <div class="sign-nm">Il consulente di vendita</div>
      </div>
    </div>

    <div class="legal">
      <h5>Note e condizioni</h5>
      <p><span class="nref">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge. Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta. R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave, uccisione, incendio, furto, altri eventi inclusi nella polizza.</p>
      <h5>Informativa Privacy</h5>
      <p>Il titolare del trattamento è Nolosubito S.r.l., con sede in Via degli Archivi di Stato 15, Roma. I dati sono trattati per fornirLe il preventivo richiesto, ai sensi dell'art. 6, par. 1, lett. b) GDPR, nonché per finalità gestionali e analitiche interne, sulla base dei medesimi. I dati personali non saranno comunicati a terzi. I dati non trattati mediante modalità esclusivamente automatizzate. Il titolare garantirà entro 30 giorni dalla compilazione del presente modulo. Per esercitare i Suoi diritti, così come previsto dal Regolamento UE 2016/679, può inviare una comunicazione al titolare del trattamento al numero verde, nella forma e modalità disposta al Garante, ai Garanti per la protezione dei dati personali.</p>
    </div>

  </div>

  <div class="foot">
    <span><span class="dot"></span><strong>Nolosubito S.r.l.</strong> · Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</span>
    <span>Pagina 2 di 2 · Ed. 1 — ${mesAnno}</span>
  </div>

</div>
</div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=750');
  if (!win) { alert('Abilita i popup per generare il PDF'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => { win.focus(); win.print(); }, 2000);
}
