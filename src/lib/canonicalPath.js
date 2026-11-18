const slug = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '-');

// Percorso canonico: stesso formato della sitemap (slug minuscolo per i veicoli, senza slash finale)
export function canonicalPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const vehicle = path.match(/^\/vehicle\/([^/]+)\/([^/]+)$/);
  if (vehicle) {
    return `/vehicle/${encodeURIComponent(slug(decodeURIComponent(vehicle[1])))}/${encodeURIComponent(slug(decodeURIComponent(vehicle[2])))}`;
  }
  return path;
}

// Le pagine veicolo non leggono parametri: quelli in più sono vecchi filtri WooCommerce (yith_wcan, filter_*, product_cat…).
// Restano solo quelli di tracciamento, per non perdere l'attribuzione delle campagne.
const TRACKING = /^(utm_.+|gclid|gbraid|wbraid|fbclid|msclkid)$/i;
export function canonicalSearch(searchParams) {
  const kept = new URLSearchParams([...searchParams].filter(([k]) => TRACKING.test(k)));
  const s = kept.toString();
  return s ? `?${s}` : '';
}
