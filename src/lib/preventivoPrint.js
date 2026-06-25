/**
 * Helper per stampare il preventivo via route /print/preventivo/:id
 * (template HTML + Handlebars-lite, vedi src/pages/PrintPreventivo.jsx)
 * Leggero: nessuna dipendenza da @react-pdf/renderer.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  if (!prev?.id) throw new Error('ID preventivo mancante');

  const url = `/print/preventivo/${prev.id}?print=true`;
  const features = 'width=900,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
  const win = window.open(url, '_blank', features);

  if (!win) {
    // Popup bloccato: fallback a navigazione diretta
    window.location.href = url;
  }
}
