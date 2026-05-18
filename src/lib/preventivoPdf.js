/**
 * Genera il PDF preventivo Nolosubito con layout professionale.
 * Usato sia dal backoffice (PreventiviSection) che dall'area cliente (MiaPratica).
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210;
  const H = 297;
  const ML = 14; // margin left
  const MR = 14; // margin right
  const CW = W - ML - MR; // content width

  // ── Colori brand ──────────────────────────────────────────────────────────
  const NAVY   = [47, 53, 137];
  const ORANGE = [249, 98, 9];
  const GRAY1  = [245, 246, 250]; // bg chiaro
  const GRAY2  = [107, 114, 128]; // testo secondario
  const DARK   = [30, 34, 80];    // testo principale
  const WHITE  = [255, 255, 255];
  const BORDER = [229, 231, 240]; // bordo leggero

  const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');

  // Logo text
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Nolosubito', ML, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 220);
  doc.text('Noleggio a Lungo Termine', ML, 22);

  // Data e rif
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Data: ${oggi}`, W - MR, 14, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Offerta N. ${rif}`, W - MR, 21, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 220);
  doc.text(`Valida fino al ${scadenza}`, W - MR, 28, { align: 'right' });

  // ── TITOLO ────────────────────────────────────────────────────────────────
  let y = 48;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PROPOSTA DI NOLEGGIO A LUNGO TERMINE', ML, y);

  // Linea separatrice
  y += 4;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);
  y += 6;

  // ── BOXES: CLIENTE + CONSULENTE ───────────────────────────────────────────
  const boxH = 28;
  const boxW = (CW - 4) / 2;

  // Box cliente
  doc.setFillColor(...GRAY1);
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('CLIENTE', ML + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(clienteNome || 'Cliente', ML + 4, y + 14);

  // Box consulente
  const bx2 = ML + boxW + 4;
  doc.setFillColor(...GRAY1);
  doc.roundedRect(bx2, y, boxW, boxH, 2, 2, 'F');
  doc.setDrawColor(...BORDER);
  doc.roundedRect(bx2, y, boxW, boxH, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('CONSULENTE', bx2 + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Nolosubito SRL', bx2 + 4, y + 13);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY2);
  doc.text('+39 06 400 49490', bx2 + 4, y + 19);
  doc.text('info@nolosubito.it', bx2 + 4, y + 24);

  y += boxH + 8;

  // ── SEZIONE: DETTAGLIO OFFERTA ────────────────────────────────────────────
  // Intestazione sezione
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DETTAGLIO OFFERTA', ML + 4, y + 5.5);

  y += 8;

  // Tabella veicolo
  const rowH = 8;
  const rows = [
    ['Marca',    prev.veicolo_marca   || '—'],
    ['Modello',  prev.veicolo_modello || '—'],
    ['Versione', prev.veicolo_versione || (prev.alimentazione || '—')],
    ['Durata',   `${prev.durata_mesi} mesi`],
    ['Km totali', fmtN(prev.km_annui * prev.durata_mesi / 12 * 12) + ' km (' + fmtN(prev.km_annui) + ' km/anno)'],
    ['Anticipo', prev.anticipo > 0 ? `€ ${fmt(prev.anticipo)}` : '€ 0,00'],
  ];

  rows.forEach((row, i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) doc.setFillColor(255, 255, 255); else doc.setFillColor(...GRAY1);
    doc.rect(ML, rowY, CW, rowH, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.rect(ML, rowY, CW, rowH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY2);
    doc.text(row[0], ML + 4, rowY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(row[1], ML + 55, rowY + 5.5);
  });

  y += rows.length * rowH + 6;

  // ── CANONE ────────────────────────────────────────────────────────────────
  const canone = prev.canone_finale ?? prev.canone_mensile;
  // IVA esclusa (dividi per 1.22)
  const canoneNettoNum = canone / 1.22;
  const canoneNetto = fmt(canoneNettoNum);
  const canoneLordo = fmt(canone);

  // Box canone header
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CANONE', ML + 4, y + 5.5);
  doc.text('IVA ESCLUSA', ML + CW * 0.55, y + 5.5, { align: 'center' });
  doc.text('IVA INCLUSA', ML + CW * 0.8, y + 5.5, { align: 'center' });
  y += 8;

  // Righe canone
  const canoneRows = [
    ['Quota Canone Veicolo',  fmt(canoneNettoNum * 0.67), fmt(canone * 0.67)],
    ['Quota Canone Servizi',  fmt(canoneNettoNum * 0.33), fmt(canone * 0.33)],
  ];

  canoneRows.forEach((row, i) => {
    if (i % 2 === 0) doc.setFillColor(255, 255, 255); else doc.setFillColor(...GRAY1);
    doc.rect(ML, y, CW, rowH, 'F');
    doc.setDrawColor(...BORDER);
    doc.rect(ML, y, CW, rowH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY2);
    doc.text(row[0], ML + 4, y + 5.5);
    doc.setTextColor(...DARK);
    doc.text(`€ ${row[1]}`, W - MR - CW * 0.42, y + 5.5, { align: 'right' });
    doc.text(`€ ${row[2]}`, W - MR, y + 5.5, { align: 'right' });
    y += rowH;
  });

  // Riga totale
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, rowH + 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('Canone Totale', ML + 4, y + 6);
  doc.text(`€ ${canoneNetto}`, W - MR - CW * 0.42, y + 6, { align: 'right' });
  doc.text(`€ ${canoneLordo}`, W - MR, y + 6, { align: 'right' });
  y += rowH + 1;

  // Anticipo
  doc.setFillColor(255, 255, 255);
  doc.rect(ML, y, CW, rowH, 'F');
  doc.setDrawColor(...BORDER);
  doc.rect(ML, y, CW, rowH, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY2);
  doc.text('Anticipo', ML + 4, y + 5.5);
  doc.setTextColor(...DARK);
  doc.text(`€ ${prev.anticipo > 0 ? fmt(prev.anticipo / 1.22) : '0,00'}`, W - MR - CW * 0.42, y + 5.5, { align: 'right' });
  doc.text(`€ ${prev.anticipo > 0 ? fmt(prev.anticipo) : '0,00'}`, W - MR, y + 5.5, { align: 'right' });
  y += rowH + 6;

  // ── CANONE HIGHLIGHT BOX ──────────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.roundedRect(ML, y, CW, 18, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CANONE MENSILE IVA INCLUSA', ML + 6, y + 6);
  doc.setFontSize(20);
  doc.text(`€ ${canoneLordo} / mese`, W - MR, y + 14, { align: 'right' });
  y += 26;

  // ── SERVIZI INCLUSI ───────────────────────────────────────────────────────
  if (prev.note_cliente) {
    doc.setFillColor(...NAVY);
    doc.rect(ML, y, CW, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SERVIZI INCLUSI / NOTE', ML + 4, y + 5.5);
    y += 8;

    doc.setFillColor(...GRAY1);
    doc.rect(ML, y, CW, 0, 'F');

    const noteLines = doc.splitTextToSize(prev.note_cliente, CW - 8);
    const noteH = noteLines.length * 5 + 6;
    doc.setFillColor(...GRAY1);
    doc.rect(ML, y, CW, noteH, 'F');
    doc.setDrawColor(...BORDER);
    doc.rect(ML, y, CW, noteH, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(noteLines, ML + 4, y + 5);
    y += noteH + 6;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = H - 22;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, footerY, W - MR, footerY);

  doc.setFillColor(...NAVY);
  doc.rect(0, footerY + 2, W, H - footerY - 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('Nolosubito', ML, footerY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 190, 220);
  doc.text('info@nolosubito.it  ·  nolosubito.it  ·  +39 06 400 49490', ML, footerY + 16);

  doc.setFontSize(7);
  doc.setTextColor(180, 190, 220);
  const disclaimer = 'Il presente documento non costituisce offerta contrattuale ed è soggetto a successiva valutazione. I canoni sono IVA inclusa al 22%. Offerta valida 15 giorni.';
  doc.text(disclaimer, W - MR, footerY + 10, { align: 'right', maxWidth: 110 });

  // Numero pagina
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('1 / 1', W / 2, footerY + 16, { align: 'center' });

  // ── SALVA ─────────────────────────────────────────────────────────────────
  const fileName = `Nolosubito_${prev.veicolo_marca}_${prev.veicolo_modello}_${rif}.pdf`
    .replace(/\s+/g, '_');
  doc.save(fileName);
}
