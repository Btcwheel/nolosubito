/**
 * Genera il PDF preventivo Nolosubito.
 * Usa html2canvas per rendere il design HTML pixel-perfect in PDF.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const { jsPDF }   = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * Number(prev.durata_mesi);

  // Stime quote veicolo/servizi
  const qVeicoloNetto = canoneNetto * 0.67;
  const qServiziNetto = canoneNetto * 0.33;
  const qVeicoloLordo = canone * 0.67;
  const qServiziLordo = canone * 0.33;

  // Servizi inclusi standard NLT
  const SERVIZI = [
    { name: 'R.C.A. Responsabilità Civile',  meta: 'Massimale max 25 milioni' },
    { name: 'Copertura Danni Kasko',          meta: 'Penale 500 € per sinistro' },
    { name: 'Incendio e Furto',               meta: 'Penale 10% sul valore' },
    { name: 'Manutenzione Ordinaria',         meta: 'Tagliandi periodici programmati' },
    { name: 'Manutenzione Straordinaria',     meta: 'Riparazioni per usura' },
    { name: 'Tassa di Possesso',              meta: 'Bollo auto gestito da Nolosubito' },
    { name: 'Immatricolazione',               meta: 'Messa su strada inclusa' },
    { name: 'Cambio Pneumatici',              meta: 'Stagionali (estivi/invernali)' },
    { name: 'Assistenza Stradale H24',        meta: 'Soccorso 365 giorni l\'anno' },
    { name: 'Consegna del Veicolo',           meta: 'Presso sede o domicilio' },
    { name: 'Gestione Multe',                 meta: 'Rinotifica al conducente' },
    { name: 'Customer Care Dedicato',         meta: 'Numero verde + e-mail' },
  ];

  // Aggiungi servizi dalle note_cliente se presenti
  const noteExtra = prev.note_cliente?.trim()
    ? `<p style="margin:8px 0 0;font-size:11px;color:#5E6B82;padding:8px 12px;background:#F4F6FB;border-radius:8px;line-height:1.5;">${prev.note_cliente.trim()}</p>`
    : '';

  const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>`;

  const serviziHTML = SERVIZI.map(s => `
    <div class="service">
      <span class="check">${checkSVG}</span>
      <div><strong>${s.name}</strong><span class="meta">${s.meta}</span></div>
    </div>`).join('');

  const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0E1A2E; --ink-2:#1F2B42; --muted:#5E6B82; --muted-2:#8693AB;
    --line:#E2E7F0; --line-2:#EDF0F6; --bg:#F4F6FB; --bg-2:#FAFBFD;
    --brand:#0B2E5C; --brand-2:#143C76; --brand-soft:#E8EEF8;
    --accent:#FFB100; --accent-soft:#FFF4D6;
    --green:#15815A; --shadow:0 1px 2px rgba(14,26,46,.04),0 8px 24px rgba(14,26,46,.06);
    --radius:14px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;color:var(--ink);font-family:"Manrope",sans-serif;-webkit-font-smoothing:antialiased;}

  .page{width:800px;min-height:1131px;background:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;page-break-after:always;}
  .topbar{height:14px;background:linear-gradient(90deg,var(--brand) 0%,var(--brand) 65%,var(--accent) 65%,var(--accent) 100%);flex-shrink:0;}

  header.doc-head{padding:26px 44px 22px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line);}
  .logo-wrap{display:flex;align-items:center;gap:12px;}
  .logo-mark{width:44px;height:44px;border-radius:12px;background:var(--brand);display:grid;place-items:center;}
  .logo-mark svg{width:26px;height:26px;}
  .logo-text .word{font-weight:800;font-size:22px;letter-spacing:-.02em;color:var(--brand);}
  .logo-text .word b{color:var(--accent);}
  .logo-text .tag{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600;}
  .offer-meta{text-align:right;display:flex;flex-direction:column;gap:6px;}
  .offer-meta .label{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-2);font-weight:600;}
  .offer-meta .number{font-family:"DM Mono",monospace;font-size:15px;color:var(--ink);font-weight:500;}
  .offer-meta .date{font-size:11.5px;color:var(--muted);}
  .offer-meta .valid{margin-top:4px;display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);color:#7A5400;padding:5px 10px;border-radius:999px;font-size:10.5px;font-weight:700;align-self:flex-end;}
  .offer-meta .valid::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);}

  .title-block{padding:32px 44px 24px;background:radial-gradient(900px 200px at 100% 0%,rgba(255,177,0,.07),transparent 60%),linear-gradient(180deg,#fff,#FAFBFD);}
  .eyebrow{display:inline-block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--brand);font-weight:700;padding:5px 10px;background:var(--brand-soft);border-radius:6px;margin-bottom:14px;}
  h1.title{font-size:30px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:var(--brand);margin:0 0 14px;}
  h1.title em{font-style:normal;color:var(--ink);font-weight:700;}
  .lede{font-size:13.5px;line-height:1.65;color:var(--ink-2);max-width:680px;}
  .lede strong{color:var(--brand);font-weight:700;}

  .pair{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:6px 44px 22px;}
  .card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;}
  .card .head{display:flex;align-items:center;justify-content:space-between;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:10px;}
  .card .head .ic{width:22px;height:22px;border-radius:6px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;}
  .card .head .ic svg{width:13px;height:13px;}
  .card .name{font-size:18px;font-weight:700;letter-spacing:-.01em;color:var(--ink);margin-bottom:8px;}
  .card .row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-top:4px;}
  .card .row svg{width:13px;height:13px;flex-shrink:0;color:var(--brand);}
  .card .row span{color:var(--ink-2);}

  .veh-hero{margin:0 44px 22px;background:linear-gradient(135deg,var(--brand) 0%,var(--brand-2) 100%);border-radius:var(--radius);color:#fff;overflow:hidden;position:relative;}
  .veh-hero::after{content:"";position:absolute;right:-80px;top:-80px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(255,177,0,.22),transparent 60%);pointer-events:none;}
  .veh-hero-inner{display:grid;grid-template-columns:1.1fr 1fr;gap:20px;align-items:center;padding:20px 24px;position:relative;z-index:1;}
  .veh-info .brand-tag{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:6px;}
  .veh-info h2{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px;line-height:1.15;}
  .veh-info .sub{font-size:13px;color:rgba(255,255,255,.78);margin-bottom:14px;}
  .chips{display:flex;flex-wrap:wrap;gap:6px;}
  .chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);padding:5px 10px;border-radius:999px;font-size:10.5px;font-weight:600;}
  .chip svg{width:11px;height:11px;opacity:.9;}
  .chip.accent{background:var(--accent);color:#3A2700;border-color:transparent;font-weight:700;}
  .car-illu{position:relative;height:140px;}
  .car-illu svg{position:absolute;right:0;bottom:0;height:140px;width:auto;filter:drop-shadow(0 14px 18px rgba(0,0,0,.3));}

  .canone-wrap{padding:0 44px 22px;display:grid;grid-template-columns:1.55fr 1fr;gap:18px;}
  .canone-table{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;}
  .canone-table .ct-head{display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:12px 18px;background:var(--bg);border-bottom:1px solid var(--line);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;}
  .canone-table .ct-head div:not(:first-child){text-align:right;}
  .canone-table .ct-row{display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:12px 18px;border-bottom:1px solid var(--line-2);font-size:13px;align-items:center;}
  .canone-table .ct-row .lbl{color:var(--ink-2);}
  .canone-table .ct-row .val{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);font-weight:500;}
  .canone-table .ct-row.total{background:var(--brand-soft);font-weight:700;}
  .canone-table .ct-row.total .lbl{color:var(--brand);}
  .canone-table .ct-row.total .val{color:var(--brand);font-weight:700;}
  .canone-table .ct-row:last-child{border-bottom:0;}
  .canone-hero{background:var(--brand);color:#fff;border-radius:var(--radius);padding:20px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;}
  .canone-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 110%,rgba(255,177,0,.22),transparent 50%);}
  .canone-hero .ch-label{position:relative;z-index:1;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px;}
  .canone-hero .ch-amount{position:relative;z-index:1;font-size:38px;font-weight:800;letter-spacing:-.03em;line-height:1;display:flex;align-items:baseline;gap:4px;}
  .canone-hero .ch-amount .cur{font-size:22px;font-weight:700;color:var(--accent);}
  .canone-hero .ch-amount .per{font-size:14px;font-weight:600;color:rgba(255,255,255,.7);margin-left:6px;}
  .canone-hero .ch-sub{position:relative;z-index:1;margin-top:8px;font-size:11.5px;color:rgba(255,255,255,.7);}
  .canone-hero .ch-anticipo{position:relative;z-index:1;margin-top:14px;padding-top:14px;border-top:1px dashed rgba(255,255,255,.2);display:flex;justify-content:space-between;align-items:center;font-size:12px;}
  .canone-hero .ch-anticipo .l{color:rgba(255,255,255,.75);}
  .canone-hero .ch-anticipo .v{color:var(--accent);font-weight:700;font-size:14px;background:rgba(255,177,0,.14);padding:3px 10px;border-radius:999px;}

  .services{padding:0 44px 30px;}
  .section-title{display:flex;align-items:center;gap:10px;margin:0 0 14px;}
  .section-title h3{font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--brand);margin:0;}
  .section-title .rule{flex:1;height:1px;background:var(--line);}
  .section-title .badge{background:var(--brand-soft);color:var(--brand);font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;}
  .services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 18px;}
  .service{display:flex;gap:10px;align-items:flex-start;padding:10px 4px;font-size:12px;line-height:1.35;color:var(--ink-2);border-bottom:1px solid var(--line-2);}
  .service .check{flex-shrink:0;width:18px;height:18px;border-radius:6px;background:#E8F4EE;color:var(--green);display:grid;place-items:center;margin-top:1px;}
  .service .check svg{width:11px;height:11px;}
  .service strong{font-weight:600;color:var(--ink);}
  .service .meta{display:block;color:var(--muted);font-size:10.5px;margin-top:1px;font-weight:500;}

  .doc-foot{margin-top:auto;padding:14px 44px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--muted);background:var(--bg-2);}
  .doc-foot .left{display:flex;align-items:center;gap:8px;}
  .doc-foot .left .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);}

  /* PAGE 2 */
  .specs-grid{padding:0 44px 22px;display:grid;grid-template-columns:1fr 1fr;gap:24px 44px;}
  .spec-table{display:flex;flex-direction:column;}
  .spec-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line-2);font-size:12.5px;}
  .spec-row .k{color:var(--muted);}
  .spec-row .v{color:var(--ink);font-weight:600;text-align:right;max-width:60%;}
  .spec-row:first-child{border-top:1px solid var(--line-2);}
  .listino{padding:0 44px 22px;}
  .listino-inner{background:var(--bg);border-radius:var(--radius);padding:18px 22px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;}
  .listino-inner .item .l{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:4px;}
  .listino-inner .item .v{font-size:16px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;}
  .listino-inner .item.tot{background:var(--brand);color:#fff;border-radius:10px;padding:10px 14px;}
  .listino-inner .item.tot .l{color:rgba(255,255,255,.7);}
  .listino-inner .item.tot .v{color:var(--accent);}
  .why{padding:0 44px 22px;}
  .why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .why-card{border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;}
  .why-card .ic{width:30px;height:30px;border-radius:8px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;margin-bottom:10px;}
  .why-card .ic svg{width:16px;height:16px;}
  .why-card h4{font-size:12.5px;margin:0 0 4px;color:var(--ink);font-weight:700;}
  .why-card p{font-size:11px;line-height:1.45;margin:0;color:var(--muted);}
  .legal{padding:0 44px 22px;font-size:10px;line-height:1.55;color:var(--muted);}
  .legal h4{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);margin:14px 0 6px;font-weight:700;}
  .legal p{margin:0 0 6px;}
  .note-ref{color:var(--brand);font-weight:700;}
  .cta{margin:0 44px 22px;background:linear-gradient(135deg,#FFB100 0%,#FF8A00 100%);border-radius:var(--radius);padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#3A2700;}
  .cta .ct{font-weight:800;font-size:15px;letter-spacing:-.01em;}
  .cta .cs{font-size:11.5px;opacity:.85;margin-top:2px;}
  .cta .btn{background:var(--brand);color:#fff;padding:10px 18px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;text-decoration:none;}
  .cta .btn svg{width:13px;height:13px;}
  .sign{padding:0 44px 24px;display:grid;grid-template-columns:1fr 1fr;gap:60px;}
  .sign-line{border-top:1.5px solid var(--ink);padding-top:6px;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600;}
  .sign-line .name{display:block;font-size:11.5px;color:var(--ink-2);text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;}
</style>
</head>
<body>

<!-- PAGE 1 -->
<article class="page">
  <div class="topbar"></div>
  <header class="doc-head">
    <div class="logo-wrap">
      <div class="logo-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FFB100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="#FFB100" stroke="none"/>
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>
        </svg>
      </div>
      <div class="logo-text">
        <div class="word">nolo<b>subito</b></div>
        <div class="tag">Noleggio a Lungo Termine</div>
      </div>
    </div>
    <div class="offer-meta">
      <div class="label">Offerta N.</div>
      <div class="number">${rif}</div>
      <div class="date">Emessa il ${oggi}</div>
      <span class="valid">Valida fino al ${scadenza}</span>
    </div>
  </header>

  <section class="title-block">
    <span class="eyebrow">Proposta personalizzata</span>
    <h1 class="title">Proposta di noleggio <em>a lungo termine</em><br>di veicolo in locazione</h1>
    <p class="lede">
      Gentile <strong>${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<sup class="note-ref">(1)</sup>.
      La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento.
      Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.
    </p>
  </section>

  <section class="pair">
    <div class="card">
      <div class="head"><span>Cliente</span>
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
      </div>
      <div class="name">${clienteNome || 'Cliente'}</div>
    </div>
    <div class="card">
      <div class="head"><span>Consulente di vendita</span>
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
      </div>
      <div class="name">Nolosubito S.r.l.</div>
      <div class="row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
        <span>+39 06 400 49490</span>
      </div>
      <div class="row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
        <span>info@nolosubito.it</span>
      </div>
      <div class="row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>nolosubito.it</span>
      </div>
    </div>
  </section>

  <section class="veh-hero">
    <div class="veh-hero-inner">
      <div class="veh-info">
        <div class="brand-tag">Veicolo proposto</div>
        <h2>${prev.veicolo_marca} ${prev.veicolo_modello}</h2>
        <div class="sub">${prev.veicolo_versione || prev.alimentazione || ''}</div>
        <div class="chips">
          <span class="chip accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>
            Pronta consegna
          </span>
          ${prev.alimentazione ? `<span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/></svg>${prev.alimentazione}</span>` : ''}
          <span class="chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v4l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>
            ${prev.durata_mesi} mesi
          </span>
          <span class="chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M12 3l9 9-9 9"/></svg>
            ${fmtN(prev.km_annui)} km/anno
          </span>
        </div>
      </div>
      <div class="car-illu">
        <svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5F8FF" stop-opacity=".95"/><stop offset="100%" stop-color="#C8D4E8" stop-opacity=".7"/></linearGradient>
            <linearGradient id="winG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0B2E5C"/><stop offset="100%" stop-color="#1C4889"/></linearGradient>
          </defs>
          <path d="M30 110 C 36 80,80 56,130 50 L 170 38 C 210 32,250 36,280 50 L 310 64 C 330 70,342 82,344 104 L 344 124 C 344 130,340 134,332 134 L 36 134 C 30 134,28 130,28 124 Z" fill="url(#bodyG)" stroke="#fff" stroke-width="1"/>
          <path d="M125 58 C 150 50,200 48,240 56 L 268 70 L 268 84 L 88 84 L 95 78 C 102 70,114 62,125 58 Z" fill="url(#winG)" opacity=".85"/>
          <rect x="178" y="50" width="4" height="34" fill="#0B2E5C" opacity=".6"/>
          <path d="M178 90 L 178 130" stroke="#9FB1CE" stroke-width="1.5" opacity=".6"/>
          <ellipse cx="335" cy="92" rx="9" ry="5" fill="#FFB100"/>
          <ellipse cx="335" cy="92" rx="6" ry="3" fill="#FFF4D6"/>
          <rect x="34" y="86" width="10" height="8" rx="2" fill="#C8412B" opacity=".85"/>
          <path d="M50 110 L 320 110" stroke="#fff" stroke-width="1" opacity=".4"/>
          <g><circle cx="100" cy="134" r="22" fill="#0E1A2E"/><circle cx="100" cy="134" r="14" fill="#1F2B42"/><circle cx="100" cy="134" r="6" fill="#5E6B82"/><circle cx="100" cy="134" r="22" fill="none" stroke="#FFB100" stroke-width="1.5" opacity=".5"/></g>
          <g><circle cx="270" cy="134" r="22" fill="#0E1A2E"/><circle cx="270" cy="134" r="14" fill="#1F2B42"/><circle cx="270" cy="134" r="6" fill="#5E6B82"/><circle cx="270" cy="134" r="22" fill="none" stroke="#FFB100" stroke-width="1.5" opacity=".5"/></g>
          <ellipse cx="185" cy="152" rx="155" ry="5" fill="#000" opacity=".25"/>
        </svg>
      </div>
    </div>
  </section>

  <section class="canone-wrap">
    <div class="canone-table">
      <div class="ct-head">
        <div>Composizione del canone</div><div>IVA esclusa</div><div>IVA inclusa</div>
      </div>
      <div class="ct-row">
        <div class="lbl">Quota Canone Veicolo</div>
        <div class="val">€ ${fmt(qVeicoloNetto)}</div>
        <div class="val">€ ${fmt(qVeicoloLordo)}</div>
      </div>
      <div class="ct-row">
        <div class="lbl">Quota Canone Servizi</div>
        <div class="val">€ ${fmt(qServiziNetto)}</div>
        <div class="val">€ ${fmt(qServiziLordo)}</div>
      </div>
      <div class="ct-row">
        <div class="lbl">Anticipo</div>
        <div class="val">€ ${fmt(anticipoNetto)}</div>
        <div class="val">€ ${fmt(anticipo)}</div>
      </div>
      <div class="ct-row total">
        <div class="lbl">Canone Mensile Totale</div>
        <div class="val">€ ${fmt(canoneNetto)}</div>
        <div class="val">€ ${fmt(canone)}</div>
      </div>
    </div>
    <div class="canone-hero">
      <div class="ch-label">Canone mensile · IVA inclusa</div>
      <div class="ch-amount"><span class="cur">€</span>${fmt(canone)}<span class="per">/mese</span></div>
      <div class="ch-sub">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno · ${fmtN(kmTotali)} km totali</div>
      <div class="ch-anticipo">
        <span class="l">Anticipo</span>
        <span class="v">€ ${fmt(anticipo)}</span>
      </div>
    </div>
  </section>

  <section class="services">
    <div class="section-title">
      <h3>Servizi inclusi nel canone</h3>
      <span class="badge">${SERVIZI.length} servizi</span>
      <span class="rule"></span>
    </div>
    ${noteExtra}
    <div class="services-grid">${serviziHTML}</div>
  </section>

  <footer class="doc-foot">
    <div class="left">
      <span class="dot"></span>
      <strong style="color:var(--ink);font-weight:700;">Nolosubito S.r.l.</strong>
      <span>· info@nolosubito.it · nolosubito.it · +39 06 400 49490</span>
    </div>
    <div class="right">Pagina 1 di 2</div>
  </footer>
</article>

<!-- PAGE 2 -->
<article class="page">
  <div class="topbar"></div>
  <header class="doc-head">
    <div class="logo-wrap">
      <div class="logo-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FFB100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="#FFB100" stroke="none"/>
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>
        </svg>
      </div>
      <div class="logo-text">
        <div class="word">nolo<b>subito</b></div>
        <div class="tag">Noleggio a Lungo Termine</div>
      </div>
    </div>
    <div class="offer-meta">
      <div class="label">Offerta N.</div>
      <div class="number">${rif}</div>
      <div class="date">Emessa il ${oggi}</div>
    </div>
  </header>

  <section class="title-block" style="padding-bottom:18px;">
    <span class="eyebrow">Dettagli tecnici</span>
    <h1 class="title" style="font-size:24px;">Caratteristiche del veicolo<br><em style="font-size:22px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</em></h1>
  </section>

  <section class="specs-grid">
    <div class="spec-table">
      <div class="spec-row"><span class="k">Marca</span><span class="v">${prev.veicolo_marca || '—'}</span></div>
      <div class="spec-row"><span class="k">Modello</span><span class="v">${prev.veicolo_modello || '—'}</span></div>
      ${prev.veicolo_versione ? `<div class="spec-row"><span class="k">Versione</span><span class="v">${prev.veicolo_versione}</span></div>` : ''}
      ${prev.alimentazione ? `<div class="spec-row"><span class="k">Alimentazione</span><span class="v">${prev.alimentazione}</span></div>` : ''}
      <div class="spec-row"><span class="k">Durata contratto</span><span class="v">${prev.durata_mesi} mesi</span></div>
      <div class="spec-row"><span class="k">Km annui</span><span class="v">${fmtN(prev.km_annui)} km</span></div>
    </div>
    <div class="spec-table">
      <div class="spec-row"><span class="k">Km totali</span><span class="v">${fmtN(kmTotali)} km</span></div>
      <div class="spec-row"><span class="k">Anticipo</span><span class="v">€ ${fmt(anticipo)}</span></div>
      <div class="spec-row"><span class="k">Canone IVA esclusa</span><span class="v">€ ${fmt(canoneNetto)}/mese</span></div>
      <div class="spec-row"><span class="k">Canone IVA inclusa</span><span class="v">€ ${fmt(canone)}/mese</span></div>
    </div>
  </section>

  <section class="why">
    <div class="section-title">
      <h3>Perché scegliere Nolosubito</h3>
      <span class="rule"></span>
    </div>
    <div class="why-grid">
      <div class="why-card">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/></svg></div>
        <h4>Canone tutto incluso</h4>
        <p>Un solo importo fisso al mese, costi pianificabili senza sorprese.</p>
      </div>
      <div class="why-card">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <h4>15+ anni di esperienza</h4>
        <p>Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.</p>
      </div>
      <div class="why-card">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/><path d="M9 12l2 2 4-4"/></svg></div>
        <h4>Burocrazia zero</h4>
        <p>Immatricolazione, bollo, assicurazione: gestiamo tutto noi.</p>
      </div>
      <div class="why-card">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
        <h4>Customer Care H24</h4>
        <p>Assistenza stradale e consulenti dedicati per tutta la durata.</p>
      </div>
    </div>
  </section>

  <section class="cta">
    <div>
      <div class="ct">Accettando l'offerta, attiviamo subito la pratica.</div>
      <div class="cs">Pronta consegna · Procedura digitale · Risposta in 24h</div>
    </div>
    <a class="btn" href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}">
      Accetta offerta
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
  </section>

  <section class="sign">
    <div class="sign-line">
      <span>Per il Cliente</span>
      <span class="name">${clienteNome || 'Cliente'} · firma per accettazione</span>
    </div>
    <div class="sign-line">
      <span>Per Nolosubito S.r.l.</span>
      <span class="name">Il consulente di vendita</span>
    </div>
  </section>

  <section class="legal">
    <h4>Note e condizioni</h4>
    <p><span class="note-ref">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.</p>
    <p><span class="note-ref">(2)</span> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
    <p>R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
    <h4>Informativa Privacy</h4>
    <p>Il titolare del trattamento dei dati personali è Nolosubito S.r.l., con sede legale in Via degli Archivi di Stato 15, Roma. I dati sono trattati per fornirLe il preventivo richiesto, sulla base dell'art. 6, par. 1, lett. b) GDPR. Per esercitare i Suoi diritti può scrivere a info@nolosubito.it.</p>
  </section>

  <footer class="doc-foot">
    <div class="left">
      <span class="dot"></span>
      <strong style="color:var(--ink);font-weight:700;">Nolosubito S.r.l.</strong>
      <span>· Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</span>
    </div>
    <div class="right">Pagina 2 di 2 · Ed. 1 — ${new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' })}</div>
  </footer>
</article>

</body></html>`;

  // Inietta HTML in un container nascosto
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-99999px;left:0;width:800px;background:#fff;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Attendi caricamento font
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 300));

  const pages = container.querySelectorAll('.page');
  const doc   = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  document.body.removeChild(container);

  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_').replace(/_+/g, '_');
  doc.save(fileName);
}
