/**
 * Genera il PDF preventivo Nolosubito con layout professionale.
 * Usato sia dal backoffice (PreventiviSection) che dall'area cliente (MiaPratica).
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W  = 210;
  const H  = 297;
  const ML = 14;
  const MR = 14;
  const CW = W - ML - MR; // 182 mm

  // ── Brand colours ─────────────────────────────────────────────────────────
  const NAVY   = [47,  53,  137];
  const ORANGE = [249, 98,  9  ];
  const GRAY1  = [245, 246, 250];
  const GRAY2  = [107, 114, 128];
  const DARK   = [30,  34,  80 ];
  const WHITE  = [255, 255, 255];
  const BORDER = [220, 222, 235];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;

  // ── Fixed column positions ─────────────────────────────────────────────────
  const COL_LABEL = ML + 4;          // etichetta sinistra
  const COL_VALUE = ML + 58;         // valore dettaglio offerta
  const COL_IVA_EX_R = W - MR - 40; // destra colonna IVA esclusa
  const COL_IVA_IN_R = W - MR - 2;  // destra colonna IVA inclusa

  const ROW_H = 8;

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 36, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Nolosubito', ML, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 190, 220);
  doc.text('Noleggio a Lungo Termine', ML, 22);

  // Right side header info
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Data: ${oggi}`, W - MR, 12, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Offerta N. ${rif}`, W - MR, 19, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 190, 220);
  doc.text(`Valida fino al ${scadenza}`, W - MR, 26, { align: 'right' });

  // ══════════════════════════════════════════════════════════════════════════
  // TITOLO
  // ══════════════════════════════════════════════════════════════════════════
  let y = 44;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PROPOSTA DI NOLEGGIO A LUNGO TERMINE', ML, y);

  y += 3;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);
  y += 5;

  // ══════════════════════════════════════════════════════════════════════════
  // BOX CLIENTE + CONSULENTE
  // ══════════════════════════════════════════════════════════════════════════
  const BOX_H = 26;
  const BOX_W = (CW - 4) / 2;

  // Cliente
  doc.setFillColor(...GRAY1);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, BOX_W, BOX_H, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('CLIENTE', COL_LABEL, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  // Tronca il nome se troppo lungo
  const nomeCliente = clienteNome || 'Cliente';
  const nomeFit = doc.splitTextToSize(nomeCliente, BOX_W - 8)[0];
  doc.text(nomeFit, COL_LABEL, y + 14);

  // Consulente
  const BX2 = ML + BOX_W + 4;
  doc.setFillColor(...GRAY1);
  doc.roundedRect(BX2, y, BOX_W, BOX_H, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('CONSULENTE', BX2 + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('Nolosubito SRL', BX2 + 4, y + 13);

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY2);
  doc.text('+39 06 400 49490', BX2 + 4, y + 18);
  doc.text('info@nolosubito.it', BX2 + 4, y + 23);

  y += BOX_H + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // SEZIONE: DETTAGLIO OFFERTA
  // ══════════════════════════════════════════════════════════════════════════
  // Header sezione
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text('DETTAGLIO OFFERTA', COL_LABEL, y + 5);
  y += 7.5;

  // Costruisci le righe dinamicamente
  const kmTotali = Number(prev.km_annui) * Number(prev.durata_mesi);
  const detailRows = [
    ['Marca',         prev.veicolo_marca   || '—'],
    ['Modello',       prev.veicolo_modello || '—'],
  ];
  if (prev.veicolo_versione) {
    detailRows.push(['Versione', prev.veicolo_versione]);
  }
  if (prev.alimentazione) {
    detailRows.push(['Alimentazione', prev.alimentazione]);
  }
  detailRows.push(
    ['Durata',     `${prev.durata_mesi} mesi`],
    ['Km/anno',    `${fmtN(prev.km_annui)} km/anno`],
    ['Km totali',  `${fmtN(kmTotali)} km`],
    ['Anticipo',   prev.anticipo > 0 ? `€ ${fmt(prev.anticipo)}` : '€ 0,00'],
  );

  detailRows.forEach((row, i) => {
    const ry = y + i * ROW_H;
    doc.setFillColor(...(i % 2 === 0 ? WHITE : GRAY1));
    doc.rect(ML, ry, CW, ROW_H, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.15);
    doc.rect(ML, ry, CW, ROW_H, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY2);
    doc.text(row[0], COL_LABEL, ry + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    // Tronca valore se necessario
    const valFit = doc.splitTextToSize(String(row[1]), CW - 60)[0];
    doc.text(valFit, COL_VALUE, ry + 5.5);
  });

  y += detailRows.length * ROW_H + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // SEZIONE: CANONE
  // ══════════════════════════════════════════════════════════════════════════
  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;

  // Percentuali veicolo/servizi (stima standard NLT: ~67% veicolo, ~33% servizi)
  const qVeicoloNetto = canoneNetto * 0.67;
  const qServiziNetto = canoneNetto * 0.33;
  const qVeicoloLordo = canone * 0.67;
  const qServiziLordo = canone * 0.33;

  // Header canone
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text('CANONE', COL_LABEL, y + 5);
  doc.text('IVA ESCLUSA', COL_IVA_EX_R, y + 5, { align: 'right' });
  doc.text('IVA INCLUSA', COL_IVA_IN_R, y + 5, { align: 'right' });
  y += 7.5;

  const canoneRows = [
    ['Quota Canone Veicolo', fmt(qVeicoloNetto), fmt(qVeicoloLordo)],
    ['Quota Canone Servizi', fmt(qServiziNetto), fmt(qServiziLordo)],
  ];

  canoneRows.forEach((row, i) => {
    doc.setFillColor(...(i % 2 === 0 ? WHITE : GRAY1));
    doc.rect(ML, y, CW, ROW_H, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.15);
    doc.rect(ML, y, CW, ROW_H, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY2);
    doc.text(row[0], COL_LABEL, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`€ ${row[1]}`, COL_IVA_EX_R, y + 5.5, { align: 'right' });
    doc.text(`€ ${row[2]}`, COL_IVA_IN_R, y + 5.5, { align: 'right' });
    y += ROW_H;
  });

  // Riga totale (navy)
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, ROW_H + 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('Canone Totale', COL_LABEL, y + 6);
  doc.text(`€ ${fmt(canoneNetto)}`, COL_IVA_EX_R, y + 6, { align: 'right' });
  doc.text(`€ ${fmt(canone)}`, COL_IVA_IN_R, y + 6, { align: 'right' });
  y += ROW_H + 1;

  // Riga anticipo
  doc.setFillColor(...WHITE);
  doc.rect(ML, y, CW, ROW_H, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.rect(ML, y, CW, ROW_H, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY2);
  doc.text('Anticipo', COL_LABEL, y + 5.5);
  doc.setTextColor(...DARK);
  doc.text(`€ ${fmt(anticipoNetto)}`, COL_IVA_EX_R, y + 5.5, { align: 'right' });
  doc.text(`€ ${fmt(anticipo)}`, COL_IVA_IN_R, y + 5.5, { align: 'right' });
  y += ROW_H + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // BOX CANONE HIGHLIGHT (arancione)
  // ══════════════════════════════════════════════════════════════════════════
  const HIGHLIGHT_H = 20;
  doc.setFillColor(...ORANGE);
  doc.roundedRect(ML, y, CW, HIGHLIGHT_H, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 220, 190);
  doc.text('CANONE MENSILE IVA INCLUSA', COL_LABEL, y + 7);

  // Calcola larghezza del testo del canone per evitare overflow
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  const canoneText = `€ ${fmt(canone)} / mese`;
  doc.text(canoneText, W - MR - 4, y + 15, { align: 'right' });

  y += HIGHLIGHT_H + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // NOTE CLIENTE (se presenti)
  // ══════════════════════════════════════════════════════════════════════════
  if (prev.note_cliente && prev.note_cliente.trim()) {
    // Header sezione
    doc.setFillColor(...NAVY);
    doc.rect(ML, y, CW, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text('SERVIZI INCLUSI / NOTE', COL_LABEL, y + 5);
    y += 7.5;

    const noteLines = doc.splitTextToSize(prev.note_cliente.trim(), CW - 8);
    const noteH = noteLines.length * 4.5 + 8;

    doc.setFillColor(...GRAY1);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, noteH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(noteLines, COL_LABEL, y + 5.5, { lineHeightFactor: 1.4 });
    y += noteH + 4;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOTE OPERATIVE (solo per backoffice — incluse se presenti)
  // ══════════════════════════════════════════════════════════════════════════
  // Le note operative non vengono incluse nel PDF cliente

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER (sempre in fondo alla pagina)
  // ══════════════════════════════════════════════════════════════════════════
  const FOOTER_Y = H - 20;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML, FOOTER_Y, W - MR, FOOTER_Y);

  doc.setFillColor(...NAVY);
  doc.rect(0, FOOTER_Y + 1, W, H - FOOTER_Y - 1, 'F');

  // Left: brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('Nolosubito', ML, FOOTER_Y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 220);
  doc.text('info@nolosubito.it  ·  nolosubito.it  ·  +39 06 400 49490', ML, FOOTER_Y + 14.5);

  // Center: pagina
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('1 / 1', W / 2, FOOTER_Y + 14.5, { align: 'center' });

  // Right: disclaimer
  const disclaimer = 'Il presente documento non costituisce offerta contrattuale ed è soggetto a successiva valutazione.\nI canoni sono IVA inclusa al 22%. Offerta valida 15 giorni dalla data di emissione.';
  doc.setFontSize(6.5);
  doc.setTextColor(180, 190, 220);
  doc.text(disclaimer, W - MR, FOOTER_Y + 8, { align: 'right', maxWidth: 95 });

  // ══════════════════════════════════════════════════════════════════════════
  // SALVA
  // ══════════════════════════════════════════════════════════════════════════
  const fileName = `Nolosubito_${(prev.veicolo_marca || '')}_${(prev.veicolo_modello || '')}_${rif}.pdf`
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  doc.save(fileName);
}
