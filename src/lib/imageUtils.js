const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Converte un URL pubblico Supabase Storage in un URL della Transform API.
 * Esempio: .../object/public/vehicle-images/file.webp
 * Diventa: .../render/image/public/vehicle-images/file.webp?width=X&quality=80
 */
function toTransformUrl(url, { width, quality = 80 } = {}) {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  const params = new URLSearchParams({ quality: String(quality) });
  if (width) params.set('width', String(width));
  return `${transformUrl}?${params.toString()}`;
}

/**
 * Genera un srcset per le card dei veicoli (max 800px, usato in grid).
 * Utilizza la Supabase Image Transform API per ridimensionare on-the-fly.
 */
export function getVehicleCardSrcSet(url) {
  if (!url || !url.includes('supabase.co')) return undefined;
  return [
    `${toTransformUrl(url, { width: 400 })} 400w`,
    `${toTransformUrl(url, { width: 600 })} 600w`,
    `${toTransformUrl(url, { width: 800 })} 800w`,
  ].join(', ');
}

/**
 * Genera un srcset per le immagini hero della pagina dettaglio (max 1200px).
 */
export function getVehicleDetailSrcSet(url) {
  if (!url || !url.includes('supabase.co')) return undefined;
  return [
    `${toTransformUrl(url, { width: 600 })} 600w`,
    `${toTransformUrl(url, { width: 900 })} 900w`,
    `${toTransformUrl(url, { width: 1200 })} 1200w`,
  ].join(', ');
}

/**
 * Restituisce l'URL ottimizzato per il src principale (fallback per browser senza srcset).
 */
export function getOptimizedSrc(url, width = 800) {
  return toTransformUrl(url, { width, quality: 80 });
}
