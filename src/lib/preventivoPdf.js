/**
 * Genera il PDF preventivo Nolosubito con pdfmake.
 * Layout nativo PDF — nessuna conversione HTML/canvas.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFonts      = await import('pdfmake/build/vfs_fonts');
  const pdfMake       = pdfMakeModule.default ?? pdfMakeModule;

  // Collega i font virtuali
  if (pdfFonts.default?.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
  } else if (pdfFonts.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }

  // ── Colori brand Nolosubito ──────────────────────────────────────────────
  const NAVY    = '#2D2E82';
  const ELECTRIC= '#71BAED';
  const ORANGE  = '#F96209';
  const DARK    = '#1e2250';
  const MUTED   = '#6b7280';
  const LIGHT   = '#f8f9fc';
  const BORDER  = '#e5e7eb';
  const WHITE   = '#ffffff';
  const GREEN   = '#15803d';
  const LIGHTBLUE = '#e8eef8';

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt  = (n) => n != null
    ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000)
    .toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesAnno  = new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' });

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);

  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  // ── Servizi standard NLT ─────────────────────────────────────────────────
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

  // Suddivide servizi in 3 colonne
  const col1 = SERVIZI.slice(0, 4);
  const col2 = SERVIZI.slice(4, 8);
  const col3 = SERVIZI.slice(8, 12);

  const servizioItem = ([nome, meta]) => ({
    margin: [0, 0, 0, 5],
    stack: [
      { text: `✓  ${nome}`, style: 'serviceTitle' },
      { text: `    ${meta}`, style: 'serviceMeta' },
    ],
  });

  // ── Helper: riga separatrice ──────────────────────────────────────────────
  const hr = (color = BORDER, marginV = 6) => ({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: color }],
    margin: [0, marginV, 0, marginV],
  });

  // ── Helper: label uppercase ───────────────────────────────────────────────
  const label = (text, color = MUTED) => ({
    text, fontSize: 7, color, bold: true,
    characterSpacing: 1.2,
    margin: [0, 0, 0, 2],
  });

  // ── Helper: riga dato ─────────────────────────────────────────────────────
  const dataRow = (k, v, last = false) => ({
    columns: [
      { text: k, style: 'specKey', width: '50%' },
      { text: v, style: 'specVal', width: '50%', alignment: 'right' },
    ],
    margin: [0, 0, 0, last ? 0 : 1],
    ...(last ? {} : { canvas: [{ type: 'line', x1: 0, y1: 14, x2: 235, y2: 14, lineWidth: 0.3, lineColor: BORDER }] }),
  });

  // ── HEADER (usato su entrambe le pagine) ──────────────────────────────────
  const makeHeader = (page1 = true) => [
    // Barra superiore bicolore
    {
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 386, h: 8, color: NAVY },
        { type: 'rect', x: 386, y: 0, w: 129, h: 8, color: ORANGE },
      ],
      margin: [0, 0, 0, 0],
    },
    // Header row
    {
      columns: [
        // Logo testuale col colore brand
        {
          stack: [
            {
              text: [
                { text: 'nolo', color: NAVY, bold: true, fontSize: 18 },
                { text: 'subito', color: ORANGE, bold: true, fontSize: 18 },
              ],
            },
            { text: 'NOLEGGIO A LUNGO TERMINE', fontSize: 6.5, color: MUTED, characterSpacing: 1.2, margin: [0, 1, 0, 0] },
          ],
          width: '*',
        },
        // Numero offerta
        {
          stack: [
            { text: 'OFFERTA N.', fontSize: 7, color: MUTED, bold: true, characterSpacing: 1.2 },
            { text: rif, fontSize: 14, bold: true, color: DARK, font: 'Courier', margin: [0, 1, 0, 1] },
            { text: `Emessa il ${oggi}`, fontSize: 9, color: MUTED },
            ...(page1 ? [{
              text: `● Valida fino al ${scadenza}`,
              fontSize: 8.5,
              bold: true,
              color: '#7A5400',
              background: '#FFF4D6',
              margin: [0, 3, 0, 0],
            }] : []),
          ],
          alignment: 'right',
          width: 'auto',
        },
      ],
      margin: [0, 10, 0, 10],
    },
    hr(BORDER, 0),
  ];

  // ── PAGINA 1 ──────────────────────────────────────────────────────────────

  // Sezione titolo
  const titleBlock = [
    {
      text: 'PROPOSTA PERSONALIZZATA',
      fontSize: 7.5, bold: true, color: NAVY,
      characterSpacing: 1.5,
      background: LIGHTBLUE,
      margin: [0, 10, 0, 8],
    },
    {
      text: [
        { text: 'Proposta di noleggio ', bold: true, color: NAVY },
        { text: 'a lungo termine\ndi veicolo in locazione', bold: true, color: DARK },
      ],
      fontSize: 22, lineHeight: 1.1, margin: [0, 0, 0, 8],
    },
    {
      text: [
        { text: 'Gentile ' },
        { text: clienteNome || 'Cliente', bold: true, color: NAVY },
        { text: ', abbiamo il piacere di trasmetterle l\'offerta a Lei dedicata' },
        { text: '(1)', sup: true, color: NAVY, bold: true },
        { text: '. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.' },
      ],
      fontSize: 10.5, color: DARK, lineHeight: 1.6, margin: [0, 0, 0, 12],
    },
  ];

  // Card cliente + consulente
  const cardsBlock = {
    columns: [
      // Cliente
      {
        stack: [
          label('CLIENTE'),
          { text: clienteNome || 'Cliente', fontSize: 14, bold: true, color: DARK, margin: [0, 2, 0, 0] },
        ],
        width: '48%',
        margin: [0, 8, 6, 8],
      },
      { width: 1, canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 60, lineWidth: 0.5, lineColor: BORDER }] },
      // Consulente
      {
        stack: [
          label('CONSULENTE DI VENDITA'),
          { text: 'Nolosubito S.r.l.', fontSize: 13, bold: true, color: DARK, margin: [0, 2, 0, 4] },
          { text: '+39 06 400 49490', fontSize: 9.5, color: MUTED, margin: [0, 0, 0, 1] },
          { text: 'info@nolosubito.it', fontSize: 9.5, color: MUTED, margin: [0, 0, 0, 1] },
          { text: 'nolosubito.it', fontSize: 9.5, color: MUTED },
        ],
        width: '*',
        margin: [10, 8, 0, 8],
      },
    ],
  };

  // Box veicolo
  const vehicleBlock = {
    margin: [0, 0, 0, 10],
    table: {
      widths: ['*'],
      body: [[{
        fillColor: NAVY,
        margin: [14, 12, 14, 14],
        stack: [
          { text: 'VEICOLO PROPOSTO', fontSize: 7, color: '#ffffff88', bold: true, characterSpacing: 1.5, margin: [0, 0, 0, 4] },
          { text: `${prev.veicolo_marca} ${prev.veicolo_modello}`, fontSize: 17, bold: true, color: WHITE, margin: [0, 0, 0, 2] },
          { text: prev.veicolo_versione || prev.alimentazione || '', fontSize: 10, color: '#ffffff88', margin: [0, 0, 0, 8] },
          {
            columns: [
              { text: `✓ Pronta consegna`, fontSize: 8, bold: true, color: '#3A2700', background: ORANGE, margin: [0, 0, 6, 0] },
              ...(prev.alimentazione ? [{ text: prev.alimentazione, fontSize: 8, color: WHITE, background: '#ffffff20', margin: [0, 0, 6, 0] }] : []),
              { text: `${prev.durata_mesi} mesi`, fontSize: 8, color: WHITE, background: '#ffffff20', margin: [0, 0, 6, 0] },
              { text: `${fmtN(prev.km_annui)} km/anno`, fontSize: 8, color: WHITE, background: '#ffffff20' },
            ],
            columnGap: 6,
          },
        ],
      }]],
    },
    layout: 'noBorders',
  };

  // Tabella canone
  const canoneTable = {
    margin: [0, 0, 0, 10],
    columns: [
      // Tabella IVA
      {
        width: '60%',
        table: {
          widths: ['*', 70, 70],
          headerRows: 1,
          body: [
            [
              { text: 'Composizione del canone', style: 'tableHeader', fillColor: LIGHT },
              { text: 'IVA esclusa', style: 'tableHeader', fillColor: LIGHT, alignment: 'right' },
              { text: 'IVA inclusa', style: 'tableHeader', fillColor: LIGHT, alignment: 'right' },
            ],
            [
              { text: 'Quota Canone Veicolo', style: 'tableCell' },
              { text: `€ ${fmt(qVN)}`, style: 'tableCellR' },
              { text: `€ ${fmt(qVL)}`, style: 'tableCellR' },
            ],
            [
              { text: 'Quota Canone Servizi', style: 'tableCell' },
              { text: `€ ${fmt(qSN)}`, style: 'tableCellR' },
              { text: `€ ${fmt(qSL)}`, style: 'tableCellR' },
            ],
            [
              { text: 'Anticipo', style: 'tableCell' },
              { text: `€ ${fmt(anticipoNetto)}`, style: 'tableCellR' },
              { text: `€ ${fmt(anticipo)}`, style: 'tableCellR' },
            ],
            [
              { text: 'Canone Mensile Totale', style: 'tableTotalCell' },
              { text: `€ ${fmt(canoneNetto)}`, style: 'tableTotalR', fillColor: LIGHTBLUE },
              { text: `€ ${fmt(canone)}`, style: 'tableTotalR', fillColor: LIGHTBLUE },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => BORDER,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      // Hero canone
      {
        width: '*',
        margin: [10, 0, 0, 0],
        table: {
          widths: ['*'],
          body: [[{
            fillColor: NAVY,
            margin: [14, 14, 14, 14],
            stack: [
              { text: 'CANONE MENSILE · IVA INCLUSA', fontSize: 7, color: '#ffffff88', bold: true, characterSpacing: 1.2, margin: [0, 0, 0, 4] },
              {
                text: [
                  { text: '€ ', fontSize: 16, bold: true, color: ORANGE },
                  { text: fmt(canone), fontSize: 28, bold: true, color: WHITE },
                  { text: ' /mese', fontSize: 11, color: '#ffffff88' },
                ],
              },
              { text: `Per ${prev.durata_mesi} mesi · ${fmtN(prev.km_annui)} km/anno · ${fmtN(kmTotali)} km totali`, fontSize: 8.5, color: '#ffffff88', margin: [0, 4, 0, 10] },
              hr('#ffffff30', 0),
              {
                columns: [
                  { text: 'Anticipo', fontSize: 9, color: '#ffffffbb', width: '*' },
                  { text: `€ ${fmt(anticipo)}`, fontSize: 10, bold: true, color: ORANGE, alignment: 'right', width: 'auto' },
                ],
                margin: [0, 6, 0, 0],
              },
            ],
          }]],
        },
        layout: 'noBorders',
      },
    ],
  };

  // Servizi
  const serviziBlock = [
    {
      columns: [
        { text: 'SERVIZI INCLUSI NEL CANONE', style: 'sectionTitle', width: '*' },
        { text: '12 servizi', fontSize: 8, bold: true, color: NAVY, background: LIGHTBLUE, width: 'auto', margin: [0, 0, 0, 0] },
      ],
      margin: [0, 0, 0, 8],
    },
    ...(prev.note_cliente?.trim() ? [{
      text: prev.note_cliente.trim(),
      fontSize: 9.5, color: MUTED, background: LIGHT,
      margin: [0, 0, 0, 8],
      italics: true,
    }] : []),
    {
      columns: [
        { stack: col1.map(servizioItem), width: '33%' },
        { stack: col2.map(servizioItem), width: '33%' },
        { stack: col3.map(servizioItem), width: '*' },
      ],
      columnGap: 10,
    },
  ];

  // Footer pag 1
  const footer1 = {
    columns: [
      { text: '● Nolosubito S.r.l. · info@nolosubito.it · nolosubito.it · +39 06 400 49490', fontSize: 8, color: MUTED, width: '*' },
      { text: 'Pagina 1 di 2', fontSize: 8, color: MUTED, alignment: 'right', width: 'auto' },
    ],
    margin: [0, 8, 0, 0],
  };

  // ── PAGINA 2 ──────────────────────────────────────────────────────────────

  const page2Title = [
    { text: 'DETTAGLI TECNICI', fontSize: 7.5, bold: true, color: NAVY, characterSpacing: 1.5, background: LIGHTBLUE, margin: [0, 10, 0, 8] },
    {
      text: [
        { text: 'Caratteristiche del veicolo\n', bold: true, color: NAVY, fontSize: 20 },
        { text: `${prev.veicolo_marca} ${prev.veicolo_modello}${prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}`, bold: true, color: DARK, fontSize: 16 },
      ],
      lineHeight: 1.2, margin: [0, 0, 0, 14],
    },
  ];

  const specsRows = [
    ['Marca', prev.veicolo_marca || '—'],
    ['Modello', prev.veicolo_modello || '—'],
    ...(prev.veicolo_versione ? [['Versione', prev.veicolo_versione]] : []),
    ...(prev.alimentazione ? [['Alimentazione', prev.alimentazione]] : []),
    ['Durata contratto', `${prev.durata_mesi} mesi`],
    ['Km annui', `${fmtN(prev.km_annui)} km`],
  ];

  const specsRows2 = [
    ['Km totali', `${fmtN(kmTotali)} km`],
    ['Anticipo', `€ ${fmt(anticipo)}`],
    ['Canone IVA esclusa', `€ ${fmt(canoneNetto)}/mese`],
    ['Canone IVA inclusa', `€ ${fmt(canone)}/mese`],
  ];

  const makeSpecTable = (rows) => ({
    table: {
      widths: ['*', '*'],
      body: rows.map(([k, v], i) => [
        { text: k, fontSize: 10.5, color: MUTED, margin: [0, 5, 0, 5], border: [false, false, false, i < rows.length - 1] },
        { text: v, fontSize: 10.5, bold: true, color: DARK, alignment: 'right', margin: [0, 5, 0, 5], border: [false, false, false, i < rows.length - 1] },
      ]),
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.4,
      vLineWidth: () => 0,
      hLineColor: () => BORDER,
    },
  });

  const specsBlock = {
    columns: [
      { stack: [makeSpecTable(specsRows)], width: '48%' },
      { width: 10 },
      { stack: [makeSpecTable(specsRows2)], width: '*' },
    ],
    margin: [0, 0, 0, 16],
  };

  const whyBlock = [
    { text: 'PERCHÉ SCEGLIERE NOLOSUBITO', style: 'sectionTitle', margin: [0, 0, 0, 10] },
    {
      columns: [
        {
          stack: [
            { text: '🛡', fontSize: 16, margin: [0, 0, 0, 4] },
            { text: 'Canone tutto incluso', fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 2] },
            { text: 'Un solo importo fisso al mese, costi pianificabili senza sorprese.', fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
          ],
          width: '25%',
        },
        {
          stack: [
            { text: '⏱', fontSize: 16, margin: [0, 0, 0, 4] },
            { text: '15+ anni di esperienza', fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 2] },
            { text: 'Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.', fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
          ],
          width: '25%',
        },
        {
          stack: [
            { text: '✅', fontSize: 16, margin: [0, 0, 0, 4] },
            { text: 'Burocrazia zero', fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 2] },
            { text: 'Immatricolazione, bollo, assicurazione: gestiamo tutto noi.', fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
          ],
          width: '25%',
        },
        {
          stack: [
            { text: '💬', fontSize: 16, margin: [0, 0, 0, 4] },
            { text: 'Customer Care H24', fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 2] },
            { text: 'Assistenza stradale e consulenti dedicati per tutta la durata.', fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
          ],
          width: '*',
        },
      ],
      columnGap: 14,
      margin: [0, 0, 0, 16],
    },
  ];

  const ctaBlock = {
    table: {
      widths: ['*', 'auto'],
      body: [[
        {
          fillColor: ORANGE,
          margin: [14, 12, 10, 12],
          stack: [
            { text: 'Accettando l\'offerta, attiviamo subito la pratica.', fontSize: 13, bold: true, color: '#3A2700' },
            { text: 'Pronta consegna · Procedura digitale · Risposta in 24h', fontSize: 9.5, color: '#5A3A00', margin: [0, 3, 0, 0] },
          ],
        },
        {
          fillColor: ORANGE,
          margin: [0, 12, 14, 12],
          alignment: 'right',
          stack: [{
            text: 'ACCETTA OFFERTA →',
            fontSize: 9.5, bold: true, color: WHITE,
            background: NAVY,
            margin: [8, 6, 8, 6],
          }],
        },
      ]],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 16],
  };

  const signBlock = {
    columns: [
      {
        stack: [
          hr(DARK, 0),
          { text: 'PER IL CLIENTE', fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 1.2, margin: [0, 4, 0, 2] },
          { text: `${clienteNome || 'Cliente'} · firma per accettazione`, fontSize: 9.5, color: DARK },
        ],
        width: '48%',
      },
      { width: 14 },
      {
        stack: [
          hr(DARK, 0),
          { text: 'PER NOLOSUBITO S.R.L.', fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 1.2, margin: [0, 4, 0, 2] },
          { text: 'Il consulente di vendita', fontSize: 9.5, color: DARK },
        ],
        width: '*',
      },
    ],
    margin: [0, 0, 0, 16],
  };

  const legalBlock = [
    { text: 'NOTE E CONDIZIONI', fontSize: 8, bold: true, color: NAVY, characterSpacing: 1.2, margin: [0, 0, 0, 4] },
    {
      text: [
        { text: '(1) ', bold: true, color: NAVY },
        { text: 'Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell\'IVA. L\'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.' },
      ],
      fontSize: 7.5, color: MUTED, lineHeight: 1.5, margin: [0, 0, 0, 3],
    },
    {
      text: [
        { text: '(2) ', bold: true, color: NAVY },
        { text: 'Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all\'offerta.' },
      ],
      fontSize: 7.5, color: MUTED, lineHeight: 1.5, margin: [0, 0, 0, 3],
    },
    {
      text: 'R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici (tagliandi). Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.',
      fontSize: 7.5, color: MUTED, lineHeight: 1.5, margin: [0, 0, 0, 8],
    },
    { text: 'INFORMATIVA PRIVACY', fontSize: 8, bold: true, color: NAVY, characterSpacing: 1.2, margin: [0, 0, 0, 4] },
    {
      text: 'Il titolare del trattamento dei dati personali è Nolosubito S.r.l., con sede legale in Via degli Archivi di Stato 15, Roma. I dati sono trattati per fornirLe il preventivo richiesto, sulla base dell\'art. 6, par. 1, lett. b) GDPR. Per esercitare i Suoi diritti può scrivere a info@nolosubito.it.',
      fontSize: 7.5, color: MUTED, lineHeight: 1.5,
    },
  ];

  const footer2 = {
    columns: [
      { text: '● Nolosubito S.r.l. · Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490', fontSize: 7.5, color: MUTED, width: '*' },
      { text: `Pagina 2 di 2 · Ed. 1 — ${mesAnno}`, fontSize: 7.5, color: MUTED, alignment: 'right', width: 'auto' },
    ],
    margin: [0, 8, 0, 0],
  };

  // ── Documento ─────────────────────────────────────────────────────────────
  const docDef = {
    pageSize: 'A4',
    pageMargins: [40, 20, 40, 20],

    content: [
      // ── Pagina 1
      ...makeHeader(true),
      ...titleBlock,
      hr(BORDER, 0),
      cardsBlock,
      hr(BORDER, 0),
      vehicleBlock,
      canoneTable,
      ...serviziBlock,
      footer1,

      // ── Pagina 2
      { text: '', pageBreak: 'before' },
      ...makeHeader(false),
      ...page2Title,
      specsBlock,
      hr(BORDER, 4),
      ...whyBlock,
      ctaBlock,
      signBlock,
      hr(BORDER, 4),
      ...legalBlock,
      footer2,
    ],

    styles: {
      tableHeader: {
        fontSize: 8, bold: true, color: MUTED,
        characterSpacing: 0.8,
      },
      tableCell:  { fontSize: 11, color: DARK },
      tableCellR: { fontSize: 11, color: DARK, alignment: 'right' },
      tableTotalCell: { fontSize: 11, bold: true, color: NAVY, fillColor: LIGHTBLUE },
      tableTotalR:    { fontSize: 11, bold: true, color: NAVY, alignment: 'right' },
      sectionTitle: {
        fontSize: 10.5, bold: true, color: NAVY,
        characterSpacing: 0.8,
      },
      serviceTitle: { fontSize: 9.5, bold: true, color: DARK },
      serviceMeta:  { fontSize: 8.5, color: MUTED, margin: [0, 1, 0, 0] },
      specKey: { fontSize: 10.5, color: MUTED },
      specVal: { fontSize: 10.5, bold: true, color: DARK },
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: DARK,
      lineHeight: 1.3,
    },
  };

  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_').replace(/_+/g, '_');

  pdfMake.createPdf(docDef).download(fileName);
}
