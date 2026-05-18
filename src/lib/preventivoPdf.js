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

  // Carica logo come base64 (stesso origine, nessun CORS)
  const logoB64 = await fetch('/logo-bianco.png')
    .then(r => r.ok ? r.blob() : null)
    .then(b => b ? new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }) : null)
    .catch(() => null);

  const logoContent = logoB64
    ? `<img src="${logoB64}" alt="Nolosubito" style="height:30px;width:auto;display:block;"/>`
    : `<span style="font-size:16px;font-weight:800;color:#fff;letter-spacing:-.01em;">nolosubito</span>`;

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);

  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  const NAVY   = '#2D2E82';
  const ORANGE = '#F96209';

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

  const serviziHTML = SERVIZI.map(([n, m]) => `
    <div class="service">
      <span class="check">✓</span>
      <div>
        <strong>${n}</strong>
        <span class="meta">${m}</span>
      </div>
    </div>`).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<div class="note-box">${prev.note_cliente.trim()}</div>` : '';

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>Preventivo ${rif} - Nolosubito</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
    color: #0E1A2E;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4;
    margin: 0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    background: #fff;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }

  /* ── TOP BAR ── */
  .topbar {
    height: 10px;
    background: linear-gradient(90deg, ${NAVY} 65%, ${ORANGE} 65%);
  }

  /* ── HEADER ── */
  .header {
    padding: 14px 20px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #e5e7eb;
  }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-box {
    width: 38px; height: 38px;
    background: ${NAVY};
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-box img { width: 24px; height: 24px; object-fit: contain; }
  .logo-name { font-size: 18px; font-weight: 800; color: ${NAVY}; }
  .logo-tag { font-size: 7px; letter-spacing: .04em; text-transform: uppercase; color: #8693AB; font-weight: 600; margin-top: 1px; }
  .header-meta { text-align: right; }
  .header-meta .lbl { font-size: 7px; letter-spacing: .05em; text-transform: uppercase; color: #8693AB; font-weight: 600; }
  .header-meta .num { font-size: 14px; font-weight: 700; color: #0E1A2E; margin: 2px 0; }
  .header-meta .dt { font-size: 9px; color: #6b7280; }
  .header-meta .valid {
    display: inline-block;
    background: #FFF4D6; color: #7A5400;
    padding: 3px 8px; border-radius: 999px;
    font-size: 8.5px; font-weight: 700; margin-top: 3px;
  }

  /* ── TITLE ── */
  .titleblock { padding: 14px 20px 10px; }
  .eyebrow {
    display: inline-block;
    font-size: 8px; letter-spacing: .06em; text-transform: uppercase;
    color: ${NAVY}; font-weight: 700;
    padding: 3px 7px; background: #E8EEF8; border-radius: 4px;
    margin-bottom: 7px;
  }
  .titleblock h1 {
    font-size: 24px; font-weight: 800; letter-spacing: -.02em;
    line-height: 1.15; color: ${NAVY}; margin-bottom: 7px;
  }
  .titleblock h1 em { font-style: normal; color: #1e2250; font-weight: 700; }
  .titleblock p { font-size: 11px; line-height: 1.6; color: #374151; }
  .titleblock p strong { color: ${NAVY}; font-weight: 700; }

  /* ── PAIR ── */
  .pair {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; padding: 0 20px 10px;
  }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 14px; }
  .card .ch {
    font-size: 7.5px; letter-spacing: .05em; text-transform: uppercase;
    color: #6b7280; font-weight: 700; margin-bottom: 5px;
  }
  .card .name { font-size: 13px; font-weight: 700; color: #0E1A2E; margin-bottom: 4px; }
  .card .row { font-size: 9.5px; color: #374151; margin-top: 2px; }

  /* ── VEHICLE ── */
  .vehicle {
    margin: 0 20px 10px;
    border-radius: 10px; overflow: hidden;
    display: grid; grid-template-columns: 1.1fr 1fr;
    border: 1px solid #e5e7eb;
  }
  .vehicle-info {
    padding: 14px 16px;
    background: linear-gradient(135deg, ${NAVY} 0%, #143C76 100%);
    color: #fff;
  }
  .vehicle-info .btag {
    font-size: 8px; letter-spacing: .06em; text-transform: uppercase;
    color: rgba(255,255,255,.6); font-weight: 600; margin-bottom: 4px;
  }
  .vehicle-info h2 { font-size: 15px; font-weight: 800; line-height: 1.2; margin-bottom: 3px; }
  .vehicle-info .sub { font-size: 10px; color: rgba(255,255,255,.75); margin-bottom: 10px; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px; border-radius: 999px;
    font-size: 8px; font-weight: 600;
    border: 1px solid rgba(255,255,255,.2);
    background: rgba(255,255,255,.12); color: #fff;
  }
  .chip.acc { background: ${ORANGE}; color: #3A2700; border-color: transparent; font-weight: 700; }
  .vehicle-right {
    background: #EEF1F8;
    display: flex; align-items: center; justify-content: center;
    padding: 10px;
  }
  .vehicle-right svg { width: 100%; height: 160px; }

  /* ── CANONE ── */
  .canone-wrap {
    padding: 0 20px 10px;
    display: grid; grid-template-columns: 1.55fr 1fr; gap: 10px;
  }
  .ctable { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .ct-head {
    display: grid; grid-template-columns: 1.6fr 1fr 1fr;
    padding: 8px 12px;
    background: #F4F6FB; border-bottom: 1px solid #e5e7eb;
    font-size: 7.5px; letter-spacing: .04em; text-transform: uppercase;
    color: #6b7280; font-weight: 700;
  }
  .ct-head div:not(:first-child) { text-align: right; }
  .ct-row {
    display: grid; grid-template-columns: 1.6fr 1fr 1fr;
    padding: 8px 12px; border-bottom: 1px solid #f3f4f6;
    font-size: 10px;
  }
  .ct-row .lb { color: #374151; }
  .ct-row .vl { text-align: right; font-weight: 500; }
  .ct-row.tot { background: #E8EEF8; font-weight: 700; }
  .ct-row.tot .lb { color: ${NAVY}; }
  .ct-row.tot .vl { color: ${NAVY}; }
  .chero {
    background: ${NAVY}; border-radius: 10px;
    padding: 14px; display: flex; flex-direction: column; justify-content: center;
    color: #fff;
  }
  .chero .chl {
    font-size: 7px; letter-spacing: .05em; text-transform: uppercase;
    color: rgba(255,255,255,.7); font-weight: 700; margin-bottom: 4px;
  }
  .chero .cha { display: flex; align-items: baseline; gap: 2px; line-height: 1; }
  .chero .cur { font-size: 16px; font-weight: 700; color: ${ORANGE}; }
  .chero .amount { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.03em; }
  .chero .per { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7); margin-left: 2px; }
  .chero .sub { font-size: 8.5px; color: rgba(255,255,255,.7); margin-top: 5px; line-height: 1.4; }
  .chero .ant {
    margin-top: 10px; padding-top: 10px;
    border-top: 1px dashed rgba(255,255,255,.25);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 9px;
  }
  .chero .ant .al { color: rgba(255,255,255,.75); }
  .chero .ant .av {
    color: ${ORANGE}; font-weight: 700; font-size: 11px;
    background: rgba(249,98,9,.15); padding: 2px 7px; border-radius: 999px;
  }

  /* ── SERVIZI ── */
  .svcs { padding: 0 20px 10px; }
  .stitle {
    display: flex; align-items: center; gap: 7px; margin-bottom: 8px;
  }
  .stitle h3 {
    font-size: 9.5px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: ${NAVY};
  }
  .stitle .rule { flex: 1; height: 1px; background: #e5e7eb; }
  .stitle .badge {
    background: #E8EEF8; color: ${NAVY};
    font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  }
  .note-box {
    font-size: 9.5px; color: #6b7280;
    padding: 8px 12px; background: #F4F6FB;
    border-radius: 7px; margin-bottom: 8px; line-height: 1.5;
    font-style: italic;
  }
  .sgrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0 12px; }
  .service {
    display: flex; gap: 6px; align-items: flex-start;
    padding: 5px 0; border-bottom: 1px solid #f3f4f6;
    font-size: 9px; line-height: 1.3;
  }
  .service .check {
    width: 14px; height: 14px; border-radius: 4px;
    background: #E8F4EE; color: #15803d;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 8px; font-weight: 700;
  }
  .service strong { display: block; font-weight: 600; color: #0E1A2E; font-size: 10px; }
  .service .meta { display: block; color: #6b7280; font-size: 9px; }

  /* ── FOOTER ── */
  .foot {
    padding: 8px 20px;
    border-top: 1px solid #e5e7eb;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8px; color: #6b7280;
    background: #FAFBFD;
    margin-top: auto;
  }
  .foot .dot { width: 5px; height: 5px; border-radius: 50%; background: ${ORANGE}; display: inline-block; margin-right: 5px; }

  /* ── PAG 2 ── */
  .specs { padding: 0 20px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 30px; }
  .spec-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 10px;
  }
  .spec-row .k { color: #6b7280; }
  .spec-row .v { font-weight: 600; color: #0E1A2E; text-align: right; max-width: 55%; }
  .why { padding: 0 20px 14px; }
  .why-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .why-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
  .why-card .ic { font-size: 16px; margin-bottom: 6px; }
  .why-card h4 { font-size: 9.5px; font-weight: 700; color: #0E1A2E; margin-bottom: 3px; }
  .why-card p { font-size: 8.5px; color: #6b7280; line-height: 1.4; }
  .cta {
    margin: 0 20px 14px;
    background: linear-gradient(135deg, ${ORANGE} 0%, #E05500 100%);
    border-radius: 10px; padding: 13px 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cta .ct { font-weight: 800; font-size: 12px; color: #3A2700; }
  .cta .cs { font-size: 9px; color: #5A3A00; margin-top: 2px; }
  .cta .btn {
    background: ${NAVY}; color: #fff;
    padding: 7px 14px; border-radius: 999px;
    font-size: 9px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; text-decoration: none;
    white-space: nowrap;
  }
  .sign { padding: 0 20px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sign-line { border-top: 1.5px solid #0E1A2E; padding-top: 4px; }
  .sign-line .slbl { font-size: 7.5px; letter-spacing: .14em; text-transform: uppercase; color: #6b7280; font-weight: 600; }
  .sign-line .snm { font-size: 9.5px; color: #374151; margin-top: 2px; }
  .legal { padding: 0 20px 10px; font-size: 7.5px; line-height: 1.55; color: #6b7280; }
  .legal h4 { font-size: 8px; letter-spacing: .04em; text-transform: uppercase; color: ${NAVY}; font-weight: 700; margin: 10px 0 4px; }
  .legal p { margin-bottom: 4px; }
  .nref { color: ${NAVY}; font-weight: 700; }

  hr.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 20px 10px; }

  @media print {
    body { background: #fff; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- ══ PAGINA 1 ══ -->
<div class="page">
  <div class="topbar"></div>

  <div class="header">
    <div class="logo">
      <div class="logo-box">${logoContent}</div>
      <div>
        <div class="logo-name">nolosubito</div>
        <div class="logo-tag">Noleggio a Lungo Termine</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
      <div class="valid">● Valida fino al ${scadenza}</div>
    </div>
  </div>

  <div class="titleblock">
    <div class="eyebrow">Proposta personalizzata</div>
    <h1>Proposta di noleggio <em>a lungo termine</em><br>di veicolo in locazione</h1>
    <p>Gentile <strong>${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<span class="nref">(1)</span>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
  </div>

  <div class="pair">
    <div class="card">
      <div class="ch">Cliente</div>
      <div class="name">${clienteNome || 'Cliente'}</div>
    </div>
    <div class="card">
      <div class="ch">Consulente di vendita</div>
      <div class="name">Nolosubito S.r.l.</div>
      <div class="row">+39 06 400 49490</div>
      <div class="row">info@nolosubito.it · nolosubito.it</div>
    </div>
  </div>

  <div class="vehicle">
    <div class="vehicle-info">
      <div class="btag">Veicolo proposto</div>
      <h2>${prev.veicolo_marca} ${prev.veicolo_modello}</h2>
      <div class="sub">${prev.veicolo_versione || prev.alimentazione || ''}</div>
      <div class="chips">
        <span class="chip acc">✓ Pronta consegna</span>
        ${prev.alimentazione ? `<span class="chip">${prev.alimentazione}</span>` : ''}
        <span class="chip">${prev.durata_mesi} mesi</span>
        <span class="chip">${fmtN(prev.km_annui)} km/anno</span>
      </div>
    </div>
    <div class="vehicle-right">
      <svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg">
        <rect width="360" height="160" fill="#EEF1F8"/>
        <path d="M38 110 C44 82,88 58,138 52 L175 40 C212 33,252 36,282 52 L312 66 C332 74,344 88,345 108 L345 128 C345 134,341 138,333 138 L52 138 C44 138,40 134,40 128 Z" fill="#C8D4E8" stroke="#9FB1CE" stroke-width="1"/>
        <path d="M128 60 C152 52,200 50,240 58 L268 72 L268 86 L90 86 L97 80 C104 72,116 64,128 60 Z" fill="${NAVY}" opacity=".85"/>
        <rect x="179" y="52" width="3" height="34" fill="${NAVY}" opacity=".5"/>
        <ellipse cx="336" cy="96" rx="10" ry="5" fill="#FFE57A"/>
        <ellipse cx="336" cy="96" rx="6" ry="3" fill="#FFF9E6"/>
        <rect x="44" y="90" width="10" height="8" rx="2" fill="#C8412B" opacity=".8"/>
        <circle cx="106" cy="138" r="22" fill="#1F2B42"/>
        <circle cx="106" cy="138" r="13" fill="#2D3D5A"/>
        <circle cx="106" cy="138" r="5"  fill="#5E6B82"/>
        <circle cx="106" cy="138" r="22" fill="none" stroke="${ORANGE}" stroke-width="1.5" opacity=".6"/>
        <circle cx="272" cy="138" r="22" fill="#1F2B42"/>
        <circle cx="272" cy="138" r="13" fill="#2D3D5A"/>
        <circle cx="272" cy="138" r="5"  fill="#5E6B82"/>
        <circle cx="272" cy="138" r="22" fill="none" stroke="${ORANGE}" stroke-width="1.5" opacity=".6"/>
        <ellipse cx="190" cy="152" rx="148" ry="5" fill="#00000018"/>
      </svg>
    </div>
  </div>

  <div class="canone-wrap">
    <div class="ctable">
      <div class="ct-head">
        <div>Composizione del canone</div><div>IVA esclusa</div><div>IVA inclusa</div>
      </div>
      <div class="ct-row"><div class="lb">Quota Canone Veicolo</div><div class="vl">€ ${fmt(qVN)}</div><div class="vl">€ ${fmt(qVL)}</div></div>
      <div class="ct-row"><div class="lb">Quota Canone Servizi</div><div class="vl">€ ${fmt(qSN)}</div><div class="vl">€ ${fmt(qSL)}</div></div>
      <div class="ct-row"><div class="lb">Anticipo</div><div class="vl">€ ${fmt(anticipoNetto)}</div><div class="vl">€ ${fmt(anticipo)}</div></div>
      <div class="ct-row tot"><div class="lb">Canone Mensile Totale</div><div class="vl">€ ${fmt(canoneNetto)}</div><div class="vl">€ ${fmt(canone)}</div></div>
    </div>
    <div class="chero">
      <div class="chl">Canone mensile · IVA inclusa</div>
      <div class="cha">
        <span class="cur">€</span>
        <span class="amount">${fmt(canone)}</span>
        <span class="per">/mese</span>
      </div>
      <div class="sub">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno<br>${fmtN(kmTotali)} km totali</div>
      <div class="ant">
        <span class="al">Anticipo</span>
        <span class="av">€ ${fmt(anticipo)}</span>
      </div>
    </div>
  </div>

  <div class="svcs">
    <div class="stitle">
      <h3>Servizi inclusi nel canone</h3>
      <span class="badge">${SERVIZI.length} servizi</span>
      <span class="rule"></span>
    </div>
    ${noteExtra}
    <div class="sgrid">${serviziHTML}</div>
  </div>

  <div class="foot">
    <div><span class="dot"></span><strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong> · info@nolosubito.it · nolosubito.it · +39 06 400 49490</div>
    <div>Pagina 1 di 2</div>
  </div>
</div>

<!-- ══ PAGINA 2 ══ -->
<div class="page">
  <div class="topbar"></div>

  <div class="header">
    <div class="logo">
      <div class="logo-box">${logoContent}</div>
      <div>
        <div class="logo-name">nolosubito</div>
        <div class="logo-tag">Noleggio a Lungo Termine</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
    </div>
  </div>

  <div class="titleblock" style="padding-bottom:10px;">
    <div class="eyebrow">Dettagli tecnici</div>
    <h1 style="font-size:18px;">Caratteristiche del veicolo<br><em style="font-size:16px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</em></h1>
  </div>

  <div class="specs">
    <div>
      ${[
        ['Marca', prev.veicolo_marca || '—'],
        ['Modello', prev.veicolo_modello || '—'],
        ...(prev.veicolo_versione ? [['Versione', prev.veicolo_versione]] : []),
        ...(prev.alimentazione ? [['Alimentazione', prev.alimentazione]] : []),
        ['Durata contratto', `${prev.durata_mesi} mesi`],
        ['Km annui', `${fmtN(prev.km_annui)} km`],
      ].map(([k,v]) => `<div class="spec-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
    </div>
    <div>
      ${[
        ['Km totali', `${fmtN(kmTotali)} km`],
        ['Anticipo', `€ ${fmt(anticipo)}`],
        ['Canone IVA esclusa', `€ ${fmt(canoneNetto)}/mese`],
        ['Canone IVA inclusa', `€ ${fmt(canone)}/mese`],
      ].map(([k,v]) => `<div class="spec-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
    </div>
  </div>

  <hr class="divider"/>

  <div class="why">
    <div class="stitle" style="margin-bottom:10px;">
      <h3>Perché scegliere Nolosubito</h3>
      <span class="rule"></span>
    </div>
    <div class="why-grid">
      <div class="why-card"><div class="ic">🛡</div><h4>Canone tutto incluso</h4><p>Un solo importo fisso al mese, costi pianificabili senza sorprese.</p></div>
      <div class="why-card"><div class="ic">⏱</div><h4>15+ anni di esperienza</h4><p>Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.</p></div>
      <div class="why-card"><div class="ic">✅</div><h4>Burocrazia zero</h4><p>Immatricolazione, bollo, assicurazione: gestiamo tutto noi.</p></div>
      <div class="why-card"><div class="ic">💬</div><h4>Customer Care H24</h4><p>Assistenza stradale e consulenti dedicati per tutta la durata.</p></div>
    </div>
  </div>

  <div class="cta">
    <div>
      <div class="ct">Accettando l'offerta, attiviamo subito la pratica.</div>
      <div class="cs">Pronta consegna · Procedura digitale · Risposta in 24h</div>
    </div>
    <a class="btn" href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}">Accetta offerta →</a>
  </div>

  <div class="sign">
    <div class="sign-line">
      <div class="slbl">Per il Cliente</div>
      <div class="snm">${clienteNome || 'Cliente'} · firma per accettazione</div>
    </div>
    <div class="sign-line">
      <div class="slbl">Per Nolosubito S.r.l.</div>
      <div class="snm">Il consulente di vendita</div>
    </div>
  </div>

  <hr class="divider"/>

  <div class="legal">
    <h4>Note e condizioni</h4>
    <p><span class="nref">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.</p>
    <p><span class="nref">(2)</span> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
    <p>R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
    <h4>Informativa Privacy</h4>
    <p>Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Per esercitare i Suoi diritti: info@nolosubito.it.</p>
  </div>

  <div class="foot">
    <div><span class="dot"></span><strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong> · Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</div>
    <div>Pagina 2 di 2 · Ed. 1 — ${mesAnno}</div>
  </div>
</div>

</body>
</html>`;

  // Apri finestra di stampa
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Abilita i popup per generare il PDF');
    return;
  }
  win.document.write(html);
  win.document.close();

  // Attendi font e poi stampa
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 1200);
  };
}
