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
