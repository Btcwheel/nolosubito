import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalPath } from './canonicalPath';

const ORIGIN = 'https://nolosubito.it';

export { canonicalPath };

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
