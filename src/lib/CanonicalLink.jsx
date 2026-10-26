import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ORIGIN = 'https://nolosubito.it';

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

// index.html ha il canonical della home: senza questo aggiornamento ogni pagina lo dichiarerebbe a Google
export default function CanonicalLink() {
  const { pathname } = useLocation();

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', `${ORIGIN}${canonicalPath(pathname)}`);
  }, [pathname]);

  return null;
}
