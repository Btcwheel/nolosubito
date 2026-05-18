/**
 * Genera il PDF preventivo Nolosubito — 2 pagine A4, html2canvas.
 * Nessuna immagine esterna: tutto inline per rendering garantito.
 */

// Carica un'immagine locale come base64 (nessun CORS)
async function localBase64(path) {
  try {
    const res  = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((res2, rej) => {
      const r = new FileReader();
      r.onload  = () => res2(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

// SVG auto flat-color (nessun gradiente, compatibile html2canvas)
function carIllustration(brand = '') {
  // Colore carrozzeria per brand
  const colors = {
    'alfa romeo': '#8B0000', 'audi': '#444', 'bmw': '#1C69D4',
    'citroen': '#8B0000', 'fiat': '#1C3F6E', 'ford': '#003176',
    'hyundai': '#002C5F', 'kia': '#BB162B', 'mercedes': '#222',
    'nissan': '#C3002F', 'peugeot': '#005DA4', 'renault': '#FFCC00',
    'seat': '#E2001A', 'skoda': '#4BA82E', 'toyota': '#EB0A1E',
    'volkswagen': '#001E50', 'volvo': '#003057',
  };
  const bodyColor  = colors[(brand || '').toLowerCase()] || '#2D5FA0';
  const darkColor  = '#1A1A2E';
  const glassColor = '#7BB8D4';
  const lightColor = '#FFE57A';
  const rimColor   = '#C0C0C0';

  return `<svg viewBox="0 0 420 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:200px;display:block;">
    <!-- Ombra -->
    <ellipse cx="210" cy="168" rx="175" ry="7" fill="#00000022"/>
    <!-- Scocca principale -->
    <path d="M38 118 C44 85,90 60,145 52 L185 40 C220 33,265 36,298 52 L332 68 C354 76,368 90,370 112 L370 134 C370 141,366 146,358 146 L50 146 C42 146,38 141,38 134 Z" fill="${bodyColor}"/>
    <!-- Parabrezza anteriore -->
    <path d="M260 56 C280 50,320 58,338 78 L338 100 L258 100 Z" fill="${glassColor}" opacity=".8"/>
    <!-- Lunotto posteriore -->
    <path d="M148 54 L185 40 C210 34,248 36,258 56 L258 100 L148 100 Z" fill="${glassColor}" opacity=".75"/>
    <!-- Montante B -->
    <rect x="256" y="44" width="4" height="56" fill="${darkColor}" opacity=".5"/>
    <!-- Linea laterale -->
    <path d="M60 120 L355 120" stroke="#ffffff30" stroke-width="1.5"/>
    <!-- Maniglie porte -->
    <rect x="200" y="108" width="20" height="5" rx="2.5" fill="#ffffff55"/>
    <rect x="280" y="108" width="20" height="5" rx="2.5" fill="#ffffff55"/>
    <!-- Faro anteriore -->
    <ellipse cx="355" cy="100" rx="12" ry="6" fill="${lightColor}"/>
    <ellipse cx="355" cy="100" rx="8" ry="4" fill="#FFF5C0"/>
    <!-- Fanale posteriore -->
    <rect x="42" y="94" width="12" height="9" rx="2" fill="#CC2200" opacity=".9"/>
    <!-- Pneumatico anteriore -->
    <circle cx="300" cy="146" r="28" fill="${darkColor}"/>
    <circle cx="300" cy="146" r="18" fill="#2A2A2A"/>
    <circle cx="300" cy="146" r="8"  fill="#444"/>
    <circle cx="300" cy="146" r="28" fill="none" stroke="${rimColor}" stroke-width="2.5"/>
    <!-- Pneumatico posteriore -->
    <circle cx="118" cy="146" r="28" fill="${darkColor}"/>
    <circle cx="118" cy="146" r="18" fill="#2A2A2A"/>
    <circle cx="118" cy="146" r="8"  fill="#444"/>
    <circle cx="118" cy="146" r="28" fill="none" stroke="${rimColor}" stroke-width="2.5"/>
  </svg>`;
}

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

  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  // Logo locale
  const logoB64 = await localBase64('/logo-bianco.png');
  const logoImg = logoB64
    ? `<img src="${logoB64}" alt="Nolosubito" style="height:32px;width:auto;display:block;"/>`
    : `<span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em;font-family:sans-serif;">nolo<span style="color:#FFB100;">subito</span></span>`;

  // Illustrazione auto
  const carSVG = carIllustration(prev.veicolo_marca);

  // Servizi
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
  const serviziHTML = SERVIZI.map(([n, m]) => `
    <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 2px;border-bottom:1px solid #EDF0F6;">
      <span style="flex-shrink:0;width:15px;height:15px;border-radius:4px;background:#E8F4EE;color:#15815A;display:grid;place-items:center;margin-top:1px;">${chk}</span>
      <div style="font-size:10.5px;line-height:1.3;"><strong style="font-weight:600;color:#0E1A2E;display:block;">${n}</strong><span style="color:#5E6B82;font-size:9.5px;">${m}</span></div>
    </div>`).join('');

  const noteExtra = prev.note_cliente?.trim()
    ? `<p style="margin:0 0 10px;font-size:11px;color:#5E6B82;padding:10px 14px;background:#F4F6FB;border-radius:8px;line-height:1.5;">${prev.note_cliente.trim()}</p>`
    : '';

  const PW = 794, PH = 1123;

  const headerHTML = (showValid = true) => `
    <div style="height:12px;background:linear-gradient(90deg,#0B2E5C 65%,#FFB100 65%);flex-shrink:0;"></div>
    <div style="padding:16px 40px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E2E7F0;flex-shrink:0;background:#fff;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:10px;background:#0B2E5C;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${logoImg}
        </div>
        <span style="font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:#8693AB;font-weight:600;">Noleggio a Lungo Termine</span>
      </div>
      <div style="text-align:right;">
        <div style="font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#8693AB;font-weight:600;">Offerta N.</div>
        <div style="font-family:monospace;font-size:15px;color:#0E1A2E;font-weight:600;margin:2px 0;">${rif}</div>
        <div style="font-size:10px;color:#5E6B82;">Emessa il ${oggi}</div>
        ${showValid ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#FFF4D6;color:#7A5400;padding:3px 9px;border-radius:999px;font-size:9px;font-weight:700;margin-top:3px;"><span style="width:5px;height:5px;border-radius:50%;background:#FFB100;display:inline-block;"></span>Valida fino al ${scadenza}</span>` : ''}
      </div>
    </div>`;

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;font-family:Manrope,sans-serif;-webkit-font-smoothing:antialiased;color:#0E1A2E;}.page{width:${PW}px;height:${PH}px;background:#fff;overflow:hidden;display:flex;flex-direction:column;}</style>
</head><body>

<!-- ══ PAGINA 1 ══ -->
<div class="page">
  ${headerHTML(true)}

  <!-- Title -->
  <div style="padding:18px 40px 12px;background:#fff;flex-shrink:0;">
    <span style="display:inline-block;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#0B2E5C;font-weight:700;padding:4px 9px;background:#E8EEF8;border-radius:5px;margin-bottom:9px;">Proposta personalizzata</span>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:#0B2E5C;margin:0 0 9px;">Proposta di noleggio <span style="color:#0E1A2E;font-weight:700;">a lungo termine</span><br>di veicolo in locazione</h1>
    <p style="font-size:12px;line-height:1.6;color:#1F2B42;max-width:660px;">Gentile <strong style="color:#0B2E5C;font-weight:700;">${clienteNome || 'Cliente'}</strong>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata<sup style="color:#0B2E5C;font-weight:700;font-size:9px;">(1)</sup>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.</p>
  </div>

  <!-- Cards cliente + consulente -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 40px 12px;flex-shrink:0;">
    <div style="border:1px solid #E2E7F0;border-radius:12px;padding:13px 15px;">
      <div style="font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#5E6B82;font-weight:700;margin-bottom:7px;">Cliente</div>
      <div style="font-size:16px;font-weight:700;color:#0E1A2E;">${clienteNome || 'Cliente'}</div>
    </div>
    <div style="border:1px solid #E2E7F0;border-radius:12px;padding:13px 15px;">
      <div style="font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#5E6B82;font-weight:700;margin-bottom:7px;">Consulente di vendita</div>
      <div style="font-size:15px;font-weight:700;color:#0E1A2E;margin-bottom:5px;">Nolosubito S.r.l.</div>
      <div style="font-size:10.5px;color:#1F2B42;margin-top:2px;">📞 +39 06 400 49490</div>
      <div style="font-size:10.5px;color:#1F2B42;margin-top:2px;">✉ info@nolosubito.it</div>
      <div style="font-size:10.5px;color:#1F2B42;margin-top:2px;">🌐 nolosubito.it</div>
    </div>
  </div>

  <!-- Veicolo: navy + illustrazione SVG -->
  <div style="margin:0 40px 12px;border-radius:12px;overflow:hidden;display:grid;grid-template-columns:1.15fr 1fr;flex-shrink:0;border:1px solid #E2E7F0;">
    <!-- Info su sfondo navy -->
    <div style="padding:18px 22px;background:#0B2E5C;color:#fff;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:#FFB10020;"></div>
      <div style="font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#ffffff99;font-weight:600;margin-bottom:5px;">Veicolo proposto</div>
      <h2 style="font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin:0 0 3px;position:relative;">${prev.veicolo_marca} ${prev.veicolo_modello}</h2>
      <div style="font-size:11px;color:#ffffff99;margin-bottom:12px;">${prev.veicolo_versione || prev.alimentazione || ''}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        <span style="display:inline-flex;align-items:center;gap:3px;background:#FFB100;color:#3A2700;border:none;padding:4px 9px;border-radius:999px;font-size:9px;font-weight:700;">✓ Pronta consegna</span>
        ${prev.alimentazione ? `<span style="display:inline-flex;align-items:center;gap:3px;background:#ffffff18;border:1px solid #ffffff25;padding:4px 9px;border-radius:999px;font-size:9px;font-weight:600;color:#fff;">${prev.alimentazione}</span>` : ''}
        <span style="display:inline-flex;align-items:center;gap:3px;background:#ffffff18;border:1px solid #ffffff25;padding:4px 9px;border-radius:999px;font-size:9px;font-weight:600;color:#fff;">${prev.durata_mesi} mesi</span>
        <span style="display:inline-flex;align-items:center;gap:3px;background:#ffffff18;border:1px solid #ffffff25;padding:4px 9px;border-radius:999px;font-size:9px;font-weight:600;color:#fff;">${fmtN(prev.km_annui)} km/anno</span>
      </div>
    </div>
    <!-- Illustrazione SVG auto (colori flat, nessun gradiente) -->
    <div style="background:#EEF1F8;display:flex;align-items:center;justify-content:center;padding:16px;">
      ${carSVG}
    </div>
  </div>

  <!-- Canone -->
  <div style="padding:0 40px 12px;display:grid;grid-template-columns:1.55fr 1fr;gap:12px;flex-shrink:0;">
    <div style="border:1px solid #E2E7F0;border-radius:12px;overflow:hidden;">
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:9px 15px;background:#F4F6FB;border-bottom:1px solid #E2E7F0;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:700;">
        <div>Composizione del canone</div><div style="text-align:right;">IVA esclusa</div><div style="text-align:right;">IVA inclusa</div>
      </div>
      ${[
        ['Quota Canone Veicolo', fmt(qVN), fmt(qVL)],
        ['Quota Canone Servizi', fmt(qSN), fmt(qSL)],
        ['Anticipo',             fmt(anticipoNetto), fmt(anticipo)],
      ].map(([l,a,b], i) => `
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:9px 15px;border-bottom:1px solid #EDF0F6;font-size:11.5px;background:${i%2?'#F9FAFB':'#fff'};">
        <div style="color:#1F2B42;">${l}</div>
        <div style="text-align:right;color:#0E1A2E;font-weight:500;">€ ${a}</div>
        <div style="text-align:right;color:#0E1A2E;font-weight:500;">€ ${b}</div>
      </div>`).join('')}
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:9px 15px;background:#E8EEF8;font-size:11.5px;font-weight:700;">
        <div style="color:#0B2E5C;">Canone Mensile Totale</div>
        <div style="text-align:right;color:#0B2E5C;">€ ${fmt(canoneNetto)}</div>
        <div style="text-align:right;color:#0B2E5C;">€ ${fmt(canone)}</div>
      </div>
    </div>
    <div style="background:#0B2E5C;border-radius:12px;padding:16px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-20px;bottom:-20px;width:120px;height:120px;border-radius:50%;background:#FFB10018;"></div>
      <div style="font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#ffffff99;font-weight:700;margin-bottom:4px;">Canone mensile · IVA inclusa</div>
      <div style="display:flex;align-items:baseline;gap:2px;line-height:1;">
        <span style="font-size:19px;font-weight:700;color:#FFB100;">€</span>
        <span style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-.03em;">${fmt(canone)}</span>
        <span style="font-size:12px;font-weight:600;color:#ffffff99;margin-left:2px;">/mese</span>
      </div>
      <div style="margin-top:5px;font-size:10px;color:#ffffff99;line-height:1.4;">Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno<br>${fmtN(kmTotali)} km totali</div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #ffffff30;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;">
        <span style="color:#ffffff99;">Anticipo</span>
        <span style="color:#FFB100;font-weight:700;font-size:12px;background:#FFB10020;padding:2px 8px;border-radius:999px;">€ ${fmt(anticipo)}</span>
      </div>
    </div>
  </div>

  <!-- Servizi -->
  <div style="padding:0 40px 10px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0B2E5C;margin:0;">Servizi inclusi nel canone</h3>
      <span style="background:#E8EEF8;color:#0B2E5C;font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;">${SERVIZI.length} servizi</span>
      <span style="flex:1;height:1px;background:#E2E7F0;"></span>
    </div>
    ${noteExtra}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px;">${serviziHTML}</div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;padding:9px 40px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#5E6B82;background:#FAFBFD;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:5px;height:5px;border-radius:50%;background:#FFB100;display:inline-block;"></span>
      <strong style="color:#0E1A2E;">Nolosubito S.r.l.</strong>
      <span>· info@nolosubito.it · nolosubito.it · +39 06 400 49490</span>
    </div>
    <div>Pagina 1 di 2</div>
  </div>
</div>

<!-- ══ PAGINA 2 ══ -->
<div class="page">
  ${headerHTML(false)}

  <div style="padding:18px 40px 14px;flex-shrink:0;">
    <span style="display:inline-block;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#0B2E5C;font-weight:700;padding:4px 9px;background:#E8EEF8;border-radius:5px;margin-bottom:9px;">Dettagli tecnici</span>
    <h1 style="font-size:22px;font-weight:800;letter-spacing:-.025em;line-height:1.15;color:#0B2E5C;margin:0;">Caratteristiche del veicolo<br><span style="color:#0E1A2E;font-weight:700;font-size:19px;">${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}</span></h1>
  </div>

  <div style="padding:0 40px 18px;display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;flex-shrink:0;">
    <div>
      ${[
        ['Marca', prev.veicolo_marca || '—'],
        ['Modello', prev.veicolo_modello || '—'],
        prev.veicolo_versione ? ['Versione', prev.veicolo_versione] : null,
        prev.alimentazione ? ['Alimentazione', prev.alimentazione] : null,
        ['Durata contratto', `${prev.durata_mesi} mesi`],
        ['Km annui', `${fmtN(prev.km_annui)} km`],
      ].filter(Boolean).map(([k,v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EDF0F6;font-size:12px;">
          <span style="color:#5E6B82;">${k}</span><span style="color:#0E1A2E;font-weight:600;text-align:right;max-width:55%;">${v}</span>
        </div>`).join('')}
    </div>
    <div>
      ${[
        ['Km totali', `${fmtN(kmTotali)} km`],
        ['Anticipo', `€ ${fmt(anticipo)}`],
        ['Canone IVA esclusa', `€ ${fmt(canoneNetto)}/mese`],
        ['Canone IVA inclusa', `€ ${fmt(canone)}/mese`],
      ].map(([k,v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EDF0F6;font-size:12px;">
          <span style="color:#5E6B82;">${k}</span><span style="color:#0E1A2E;font-weight:600;text-align:right;">${v}</span>
        </div>`).join('')}
    </div>
  </div>

  <div style="padding:0 40px 16px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0B2E5C;margin:0;">Perché scegliere Nolosubito</h3>
      <span style="flex:1;height:1px;background:#E2E7F0;"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${[
        ['🛡', 'Canone tutto incluso', 'Un solo importo fisso al mese, costi pianificabili senza sorprese.'],
        ['⏱', '15+ anni di esperienza', 'Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.'],
        ['✅', 'Burocrazia zero', 'Immatricolazione, bollo, assicurazione: gestiamo tutto noi.'],
        ['💬', 'Customer Care H24', 'Assistenza stradale e consulenti dedicati per tutta la durata.'],
      ].map(([ic, t, d]) => `
        <div style="border:1px solid #E2E7F0;border-radius:10px;padding:12px;background:#fff;">
          <div style="width:28px;height:28px;border-radius:7px;background:#E8EEF8;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:14px;">${ic}</div>
          <h4 style="font-size:11px;margin:0 0 3px;color:#0E1A2E;font-weight:700;">${t}</h4>
          <p style="font-size:9.5px;line-height:1.45;color:#5E6B82;margin:0;">${d}</p>
        </div>`).join('')}
    </div>
  </div>

  <div style="margin:0 40px 16px;background:linear-gradient(135deg,#FFB100 0%,#FF8A00 100%);border-radius:12px;padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-shrink:0;">
    <div>
      <div style="font-weight:800;font-size:13px;color:#3A2700;">Accettando l'offerta, attiviamo subito la pratica.</div>
      <div style="font-size:10px;color:#5A3A00;margin-top:2px;">Pronta consegna · Procedura digitale · Risposta in 24h</div>
    </div>
    <a href="mailto:info@nolosubito.it?subject=Accettazione%20offerta%20${rif}" style="background:#0B2E5C;color:#fff;padding:8px 15px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;">
      Accetta offerta →
    </a>
  </div>

  <div style="padding:0 40px 18px;display:grid;grid-template-columns:1fr 1fr;gap:50px;flex-shrink:0;">
    <div style="border-top:1.5px solid #0E1A2E;padding-top:5px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:600;">
      Per il Cliente
      <span style="display:block;font-size:10px;color:#1F2B42;text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;">${clienteNome || 'Cliente'} · firma per accettazione</span>
    </div>
    <div style="border-top:1.5px solid #0E1A2E;padding-top:5px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#5E6B82;font-weight:600;">
      Per Nolosubito S.r.l.
      <span style="display:block;font-size:10px;color:#1F2B42;text-transform:none;letter-spacing:0;font-weight:500;margin-top:2px;">Il consulente di vendita</span>
    </div>
  </div>

  <div style="padding:0 40px 14px;font-size:9px;line-height:1.55;color:#5E6B82;flex-shrink:0;">
    <h4 style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#0B2E5C;margin:0 0 5px;font-weight:700;">Note e condizioni</h4>
    <p style="margin:0 0 4px;"><strong style="color:#0B2E5C;">(1)</strong> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%.</p>
    <p style="margin:0 0 4px;"><strong style="color:#0B2E5C;">(2)</strong> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.</p>
    <p style="margin:0 0 10px;">R.C.A.: Responsabilità Civile Auto. Manutenzione ordinaria: tagliandi periodici. Copertura Danni: per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.</p>
    <h4 style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#0B2E5C;margin:0 0 5px;font-weight:700;">Informativa Privacy</h4>
    <p style="margin:0;">Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Diritti: info@nolosubito.it.</p>
  </div>

  <div style="margin-top:auto;padding:9px 40px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#5E6B82;background:#FAFBFD;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:6px;">
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
  wrap.style.cssText = `position:fixed;top:-${PH * 2 + 200}px;left:0;width:${PW}px;z-index:-999;background:#fff;`;
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 400));

  const pages = wrap.querySelectorAll('.page');
  const doc   = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: PW,
      height: PH,
      windowWidth: PW,
      imageTimeout: 0,
      logging: false,
    });
    if (i > 0) doc.addPage();
    doc.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
  }

  document.body.removeChild(wrap);

  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_').replace(/_+/g, '_');
  doc.save(fileName);
}
