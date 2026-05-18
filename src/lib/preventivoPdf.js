/**
 * Genera il PDF preventivo Nolosubito — 2 pagine A4, html2canvas.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const { jsPDF }   = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // ── Logo Nolosubito in base64 ─────────────────────────────────────────────
  const logoBase64 = await fetch('/logo-bianco.png')
    .then(r => r.blob())
    .then(b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }))
    .catch(() => null);

  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" alt="Nolosubito" style="height:36px;width:auto;"/>`
    : `<div style="display:flex;align-items:center;gap:10px;">
        <div class="logo-box"><svg viewBox="0 0 24 24" fill="none" stroke="#FFB100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="#FFB100" stroke="none"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg></div>
        <div><div class="logo-name">nolo<b>subito</b></div><div class="logo-tag">Noleggio a Lungo Termine</div></div>
       </div>`;

  // ── Helpers ───────────────────────────────────────────────────────────────
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
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12); // ← corretto

  const qVeicoloNetto = canoneNetto * 0.67;
  const qServiziNetto = canoneNetto * 0.33;
  const qVeicoloLordo = canone * 0.67;
  const qServiziLordo = canone * 0.33;

  // ── Foto veicolo via Unsplash ─────────────────────────────────────────────
  // Mappa brand → foto Unsplash con sfondo bianco/neutro studio
  const BRAND_PHOTOS = {
    'alfa romeo': 'photo-1669215420652-7dce22a5b7fb',
    'audi':       'photo-1544636331-e26879cd4d9b',
    'bmw':        'photo-1555215695-3004980ad54e',
    'citroen':    'photo-1590362891991-f776e747a588',
    'fiat':       'photo-1658863028041-c0a73e69dab2',
    'ford':       'photo-1575090808046-61e22b6a5437',
    'hyundai':    'photo-1619767886558-efdc259b6e09',
    'kia':        'photo-1606016159991-dfe4f2746ad5',
    'mercedes':   'photo-1618843479313-40f8afb4b4d8',
    'nissan':     'photo-1608231387042-66d1773070a5',
    'opel':       'photo-1549317661-bd32c8ce0db2',
    'peugeot':    'photo-1638017628524-41a80ce0c5c3',
    'renault':    'photo-1636461222813-11c10d27f3b7',
    'seat':       'photo-1609521263047-f8f205293f24',
    'skoda':      'photo-1609521263047-f8f205293f24',
    'toyota':     'photo-1623869675781-80aa31012a5a',
    'volkswagen': 'photo-1617814076367-b759c7d7e738',
    'volvo':      'photo-1544636331-e26879cd4d9b',
  };
  const brandKey  = (prev.veicolo_marca || '').toLowerCase();
  const photoId   = BRAND_PHOTOS[brandKey] || 'photo-1492144534655-ae79c964c9d7';
  const carImgUrl = `https://images.unsplash.com/${photoId}?w=520&h=260&fit=crop&q=80&auto=format`;

  // ── Servizi inclusi ───────────────────────────────────────────────────────
  const SERVIZI = [
    { name: 'R.C.A. Responsabilità Civile',  meta: 'Massimale max 25 milioni' },
    { name: 'Copertura Danni Kasko',          meta: 'Penale 500 € per sinistro' },
    { name: 'Incendio e Furto',               meta: 'Penale 10% sul valore' },
    { name: 'Manutenzione Ordinaria',         meta: 'Tagliandi periodici programmati' },
    { name: 'Manutenzione Straordinaria',     meta: 'Riparazioni per usura' },
    { name: 'Tassa di Possesso',              meta: 'Bollo auto gestito da Nolosubito' },
    { name: 'Immatricolazione',               meta: 'Messa su strada inclusa' },
    { name: 'Cambio Pneumatici',              meta: 'Stagionali (estivi/invernali)' },
    { name: 'Assistenza Stradale H24',        meta: "Soccorso 365 giorni l'anno" },
    { name: 'Consegna del Veicolo',           meta: 'Presso sede o domicilio' },
    { name: 'Gestione Multe',                 meta: 'Rinotifica al conducente' },
    { name: 'Customer Care Dedicato',         meta: 'Numero verde + e-mail' },
  ];

  const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>`;
  const serviziHTML = SERVIZI.map(s =>
    `<div class="service"><span class="check">${checkSVG}</span><div><strong>${s.name}</strong><span class="meta">${s.meta}</span></div></div>`
  ).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<p style="margin:0 0 12px;font-size:11px;color:#5E6B82;padding:10px 14px;background:#F4F6FB;border-radius:8px;line-height:1.5;">${prev.note_cliente.trim()}</p>`
    : '';

  // ── HTML — dimensioni fisse A4: 794×1123px ────────────────────────────────
  // Usiamo 794px = 210mm a 96dpi. Height esatta 1123px per pagina.
  const PAGE_W = 794;
  const PAGE_H = 1123;

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#fff;color:#0E1A2E;font-family:Manrope,sans-serif;-webkit-font-smoothing:antialiased;}
:root{
  --ink:#0E1A2E;--ink2:#1F2B42;--muted:#5E6B82;--muted2:#8693AB;
  --line:#E2E7F0;--line2:#EDF0F6;--bg:#F4F6FB;
  --brand:#0B2E5C;--brand2:#143C76;--brandsoft:#E8EEF8;
  --accent:#FFB100;--accentsoft:#FFF4D6;--green:#15815A;
  --r:12px;
}

/* ── PAGINA ── */
.page{
  width:${PAGE_W}px;
  height:${PAGE_H}px;
  background:#fff;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  position:relative;
}

/* ── TOP BAR ── */
.topbar{height:12px;background:linear-gradient(90deg,var(--brand) 65%,var(--accent) 65%);flex-shrink:0;}

/* ── HEADER ── */
.head{padding:20px 40px 18px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid var(--line);flex-shrink:0;}
.logo{display:flex;align-items:center;gap:11px;}
.logo-box{width:40px;height:40px;border-radius:10px;background:var(--brand);display:grid;place-items:center;}
.logo-box svg{width:22px;height:22px;}
.logo-name{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--brand);}
.logo-name b{color:var(--accent);}
.logo-tag{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:1px;}
.meta{text-align:right;}
.meta .lbl{font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted2);font-weight:600;}
.meta .num{font-family:"DM Mono",monospace;font-size:14px;color:var(--ink);font-weight:500;margin:2px 0;}
.meta .dt{font-size:10.5px;color:var(--muted);}
.meta .valid{display:inline-flex;align-items:center;gap:5px;background:var(--accentsoft);color:#7A5400;padding:4px 9px;border-radius:999px;font-size:9.5px;font-weight:700;margin-top:4px;}
.meta .valid::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--accent);}

/* ── TITLE ── */
.titleblock{padding:22px 40px 16px;background:radial-gradient(700px 160px at 100% 0%,rgba(255,177,0,.08),transparent 60%);}
.eyebrow{display:inline-block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--brand);font-weight:700;padding:4px 9px;background:var(--brandsoft);border-radius:5px;margin-bottom:10px;}
h1{font-size:26px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:var(--brand);margin:0 0 10px;}
h1 em{font-style:normal;color:var(--ink);font-weight:700;}
.lede{font-size:12.5px;line-height:1.6;color:var(--ink2);max-width:660px;}
.lede strong{color:var(--brand);font-weight:700;}

/* ── PAIR ── */
.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 40px 14px;flex-shrink:0;}
.card{border:1px solid var(--line);border-radius:var(--r);padding:14px 16px;}
.card .ch{display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;}
.card .ch .ic{width:20px;height:20px;border-radius:5px;background:var(--brandsoft);color:var(--brand);display:grid;place-items:center;}
.card .ch .ic svg{width:12px;height:12px;}
.card .name{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.row{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--muted);margin-top:3px;}
.row svg{width:12px;height:12px;flex-shrink:0;color:var(--brand);}
.row span{color:var(--ink2);}

/* ── VEHICLE ── */
.veh{margin:0 40px 14px;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:grid;grid-template-columns:1.1fr 1fr;flex-shrink:0;}
.veh-left{padding:18px 20px;background:linear-gradient(135deg,var(--brand) 0%,var(--brand2) 100%);color:#fff;position:relative;}
.veh-left::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,177,0,.2),transparent 60%);}
.veh-left .btag{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:600;margin-bottom:5px;}
.veh-left h2{font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin:0 0 3px;position:relative;z-index:1;}
.veh-left .sub{font-size:11.5px;color:rgba(255,255,255,.75);margin-bottom:12px;}
.chips{display:flex;flex-wrap:wrap;gap:5px;}
.chip{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);padding:4px 9px;border-radius:999px;font-size:9.5px;font-weight:600;}
.chip svg{width:10px;height:10px;}
.chip.acc{background:var(--accent);color:#3A2700;border-color:transparent;font-weight:700;}
/* Foto auto — sfondo bianco, no navy */
.veh-right{background:#F8F9FC;display:flex;align-items:center;justify-content:center;padding:10px;}
.veh-right img{width:100%;height:220px;object-fit:cover;border-radius:8px;}

/* ── CANONE ── */
.canone-wrap{padding:0 40px 14px;display:grid;grid-template-columns:1.55fr 1fr;gap:14px;flex-shrink:0;}
.ctable{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;}
.ct-head{display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--line);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;}
.ct-head div:not(:first-child){text-align:right;}
.ct-row{display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:10px 16px;border-bottom:1px solid var(--line2);font-size:12px;align-items:center;}
.ct-row .lb{color:var(--ink2);}
.ct-row .vl{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);font-weight:500;}
.ct-row.tot{background:var(--brandsoft);font-weight:700;}
.ct-row.tot .lb{color:var(--brand);}
.ct-row.tot .vl{color:var(--brand);font-weight:700;}
.ct-row:last-child{border-bottom:0;}
.chero{background:var(--brand);color:#fff;border-radius:var(--r);padding:18px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;}
.chero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 110%,rgba(255,177,0,.22),transparent 50%);}
.chero .chl{position:relative;z-index:1;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:5px;}
.chero .cha{position:relative;z-index:1;font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1;display:flex;align-items:baseline;gap:3px;}
.chero .cha .cur{font-size:20px;font-weight:700;color:var(--accent);}
.chero .cha .per{font-size:13px;font-weight:600;color:rgba(255,255,255,.7);margin-left:4px;}
.chero .chs{position:relative;z-index:1;margin-top:6px;font-size:10.5px;color:rgba(255,255,255,.7);line-height:1.4;}
.chero .chant{position:relative;z-index:1;margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.2);display:flex;justify-content:space-between;align-items:center;font-size:11px;}
.chero .chant .al{color:rgba(255,255,255,.75);}
.chero .chant .av{color:var(--accent);font-weight:700;font-size:13px;background:rgba(255,177,0,.14);padding:2px 9px;border-radius:999px;}

/* ── SERVICES ── */
.svcs{padding:0 40px 14px;}
.stitle{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.stitle h3{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--brand);margin:0;}
.stitle .rule{flex:1;height:1px;background:var(--line);}
.stitle .badge{background:var(--brandsoft);color:var(--brand);font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px;}
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 16px;}
.service{display:flex;gap:8px;align-items:flex-start;padding:7px 2px;font-size:11px;line-height:1.3;color:var(--ink2);border-bottom:1px solid var(--line2);}
.service .check{flex-shrink:0;width:16px;height:16px;border-radius:5px;background:#E8F4EE;color:var(--green);display:grid;place-items:center;margin-top:1px;}
.service .check svg{width:10px;height:10px;}
.service strong{font-weight:600;color:var(--ink);}
.service .meta{display:block;color:var(--muted);font-size:9.5px;margin-top:1px;}

/* ── FOOTER ── */
.foot{margin-top:auto;padding:11px 40px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:var(--muted);background:#FAFBFD;flex-shrink:0;}
.foot .fl{display:flex;align-items:center;gap:7px;}
.foot .dot{width:5px;height:5px;border-radius:50%;background:var(--accent);}

/* ── PAGE 2 ── */
.sgrid2{padding:0 40px 16px;display:grid;grid-template-columns:1fr 1fr;gap:20px 40px;}
.sptable{display:flex;flex-direction:column;}
.sprow{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line2);font-size:11.5px;}
.sprow .k{color:var(--muted);}
.sprow .v{color:var(--ink);font-weight:600;text-align:right;max-width:58%;}
.sprow:first-child{border-top:1px solid var(--line2);}
.why{padding:0 40px 16px;}
.wgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.wcard{border:1px solid var(--line);border-radius:10px;padding:12px;}
.wcard .ic{width:28px;height:28px;border-radius:7px;background:var(--brandsoft);color:var(--brand);display:grid;place-items:center;margin-bottom:8px;}
.wcard .ic svg{width:15px;height:15px;}
.wcard h4{font-size:11.5px;margin:0 0 3px;color:var(--ink);font-weight:700;}
.wcard p{font-size:10px;line-height:1.45;color:var(--muted);}
.legal{padding:0 40px 16px;font-size:9.5px;line-height:1.55;color:var(--muted);}
.legal h4{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);margin:12px 0 5px;font-weight:700;}
.legal p{margin:0 0 5px;}
.nref{color:var(--brand);font-weight:700;}
.cta{margin:0 40px 16px;background:linear-gradient(135deg,#FFB100 0%,#FF8A00 100%);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;color:#3A2700;}
.cta .ct{font-weight:800;font-size:14px;}
.cta .cs{font-size:10.5px;opacity:.85;margin-top:2px;}
.cta .btn{background:var(--brand);color:#fff;padding:9px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;gap:7px;}
.cta .btn svg{width:12px;height:12px;}
.sign{padding:0 40px 20px;display:grid;grid-template-columns:1fr 1fr;gap:50px;}
.sline{border-top:1.5px solid var(--ink);padding-top:5px;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600;}
.sline .nm{display:block;font-size:10.5px;color:var(--ink2);text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;}
</style></head><body>

<!-- PAGE 1 -->
<div class="page">
  <div class="topbar"></div>
  <header class="head">
    <div class="logo">${logoHTML}</div>
    <div class="meta">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
      <span class="valid">Valida fino al ${scadenza}</span>
    </div>
  </header>

  <section class="titleblock">
    <span class="eyebrow">Proposta personalizzata</span>
    <h1>Proposta di noleggio <em>a lungo termine</em><br>di veicolo in locazione</h1>
    <p class="lede">Gentile <strong>${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<span class="nref">(1)</span>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
  </section>

  <section class="pair">
    <div class="card">
      <div class="ch"><span>Cliente</span>
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
      </div>
      <div class="name">${clienteNome || 'Cliente'}</div>
    </div>
    <div class="card">
      <div class="ch"><span>Consulente di vendita</span>
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
      </div>
      <div class="name">Nolosubito S.r.l.</div>
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg><span>+39 06 400 49490</span></div>
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span>info@nolosubito.it</span></div>
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>nolosubito.it</span></div>
    </div>
  </section>

  <!-- VEICOLO: sinistra navy, destra foto su sfondo chiaro -->
  <section class="veh">
    <div class="veh-left">
      <div class="btag">Veicolo proposto</div>
      <h2>${prev.veicolo_marca} ${prev.veicolo_modello}</h2>
      <div class="sub">${prev.veicolo_versione || prev.alimentazione || ''}</div>
      <div class="chips">
        <span class="chip acc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>Pronta consegna</span>
        ${prev.alimentazione ? `<span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/></svg>${prev.alimentazione}</span>` : ''}
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v4l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>${prev.durata_mesi} mesi</span>
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M12 3l9 9-9 9"/></svg>${fmtN(prev.km_annui)} km/anno</span>
      </div>
    </div>
    <!-- Foto reale, sfondo neutro -->
    <div class="veh-right">
      <img src="${carImgUrl}" alt="${prev.veicolo_marca} ${prev.veicolo_modello}" crossorigin="anonymous"/>
    </div>
  </section>

  <section class="canone-wrap">
    <div class="ctable">
      <div class="ct-head"><div>Composizione del canone</div><div>IVA esclusa</div><div>IVA inclusa</div></div>
      <div class="ct-row"><div class="lb">Quota Canone Veicolo</div><div class="vl">€ ${fmt(qVeicoloNetto)}</div><div class="vl">€ ${fmt(qVeicoloLordo)}</div></div>
      <div class="ct-row"><div class="lb">Quota Canone Servizi</div><div class="vl">€ ${fmt(qServiziNetto)}</div><div class="vl">€ ${fmt(qServiziLordo)}</div></div>
      <div class="ct-row"><div class="lb">Anticipo</div><div class="vl">€ ${fmt(anticipoNetto)}</div><div class="vl">€ ${fmt(anticipo)}</div></div>
      <div class="ct-row tot"><div class="lb">Canone Mensile Totale</div><div class="vl">€ ${fmt(canoneNetto)}</div><div class="vl">€ ${fmt(canone)}</div></div>
    </div>
    <div class="chero">
      <div class="chl">Canone mensile · IVA inclusa</div>
      <div class="cha"><span class="cur">€</span>${fmt(canone)}<span class="per">/mese</span></div>
      <div class="chs">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno<br>${fmtN(kmTotali)} km totali</div>
      <div class="chant"><span class="al">Anticipo</span><span class="av">€ ${fmt(anticipo)}</span></div>
    </div>
  </section>

  <section class="svcs">
    <div class="stitle">
      <h3>Servizi inclusi nel canone</h3>
      <span class="badge">${SERVIZI.length} servizi</span>
      <span class="rule"></span>
    </div>
    ${noteExtra}
    <div class="sgrid">${serviziHTML}</div>
  </section>

  <footer class="foot">
    <div class="fl"><span class="dot"></span><strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong><span>· info@nolosubito.it · nolosubito.it · +39 06 400 49490</span></div>
    <div>Pagina 1 di 2</div>
  </footer>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="topbar"></div>
  <header class="head">
    <div class="logo">${logoHTML}</div>
    <div class="meta">
      <div class="lbl">Offerta N.</div>
      <div class="num">${rif}</div>
      <div class="dt">Emessa il ${oggi}</div>
    </div>
  </header>

  <section class="titleblock" style="padding-bottom:14px;">
    <span class="eyebrow">Dettagli tecnici</span>
    <h1 style="font-size:22px;">Caratteristiche del veicolo<br><em style="font-size:20px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</em></h1>
  </section>

  <section class="sgrid2">
    <div class="sptable">
      <div class="sprow"><span class="k">Marca</span><span class="v">${prev.veicolo_marca || '—'}</span></div>
      <div class="sprow"><span class="k">Modello</span><span class="v">${prev.veicolo_modello || '—'}</span></div>
      ${prev.veicolo_versione ? `<div class="sprow"><span class="k">Versione</span><span class="v">${prev.veicolo_versione}</span></div>` : ''}
      ${prev.alimentazione ? `<div class="sprow"><span class="k">Alimentazione</span><span class="v">${prev.alimentazione}</span></div>` : ''}
      <div class="sprow"><span class="k">Durata contratto</span><span class="v">${prev.durata_mesi} mesi</span></div>
      <div class="sprow"><span class="k">Km annui</span><span class="v">${fmtN(prev.km_annui)} km</span></div>
    </div>
    <div class="sptable">
      <div class="sprow"><span class="k">Km totali</span><span class="v">${fmtN(kmTotali)} km</span></div>
      <div class="sprow"><span class="k">Anticipo</span><span class="v">€ ${fmt(anticipo)}</span></div>
      <div class="sprow"><span class="k">Canone IVA esclusa</span><span class="v">€ ${fmt(canoneNetto)}/mese</span></div>
      <div class="sprow"><span class="k">Canone IVA inclusa</span><span class="v">€ ${fmt(canone)}/mese</span></div>
    </div>
  </section>

  <section class="why">
    <div class="stitle"><h3>Perché scegliere Nolosubito</h3><span class="rule"></span></div>
    <div class="wgrid">
      <div class="wcard"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/></svg></div><h4>Canone tutto incluso</h4><p>Un solo importo fisso al mese, costi pianificabili senza sorprese.</p></div>
      <div class="wcard"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><h4>15+ anni di esperienza</h4><p>Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.</p></div>
      <div class="wcard"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/><path d="M9 12l2 2 4-4"/></svg></div><h4>Burocrazia zero</h4><p>Immatricolazione, bollo, assicurazione: gestiamo tutto noi.</p></div>
      <div class="wcard"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div><h4>Customer Care H24</h4><p>Assistenza stradale e consulenti dedicati per tutta la durata.</p></div>
    </div>
  </section>

  <section class="cta">
    <div><div class="ct">Accettando l'offerta, attiviamo subito la pratica.</div><div class="cs">Pronta consegna · Procedura digitale · Risposta in 24h</div></div>
    <a class="btn" href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}">Accetta offerta <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
  </section>

  <section class="sign">
    <div class="sline"><span>Per il Cliente</span><span class="nm">${clienteNome || 'Cliente'} · firma per accettazione</span></div>
    <div class="sline"><span>Per Nolosubito S.r.l.</span><span class="nm">Il consulente di vendita</span></div>
  </section>

  <section class="legal">
    <h4>Note e condizioni</h4>
    <p><span class="nref">(1)</span> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.</p>
    <p><span class="nref">(2)</span> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
    <p>R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
    <h4>Informativa Privacy</h4>
    <p>Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Per esercitare i Suoi diritti: info@nolosubito.it.</p>
  </section>

  <footer class="foot">
    <div class="fl"><span class="dot"></span><strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong><span>· Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490</span></div>
    <div>Pagina 2 di 2 · Ed. 1 — ${new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' })}</div>
  </footer>
</div>

</body></html>`;

  // ── Render ────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;top:-${PAGE_H * 2 + 100}px;left:0;width:${PAGE_W}px;z-index:-999;`;
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  // Attendi font + immagini
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 600));

  const pages = wrap.querySelectorAll('.page');
  const doc   = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: PAGE_W,
      height: PAGE_H,
      windowWidth: PAGE_W,
    });
    if (i > 0) doc.addPage();
    // Adattiamo esattamente 794px → 210mm e 1123px → 297mm
    doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  }

  document.body.removeChild(wrap);

  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_').replace(/_+/g, '_');
  doc.save(fileName);
}
