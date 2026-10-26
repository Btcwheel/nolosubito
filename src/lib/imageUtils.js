const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Converte un URL pubblico Supabase Storage in un URL della Transform API.
 * Usa resize=contain per NON croppare l'immagine server-side:
 * il veicolo rimane sempre completo, e CSS object-cover + objectPosition
 * gestisce il crop e il centramento visivo nel browser.
 *
 * Esempio: .../object/public/vehicle-images/file.webp
 * Diventa: .../render/image/public/vehicle-images/file.webp?width=X&quality=80&resize=contain
 */
function toTransformUrl(url, opts = {}) {
  const { width, quality = 80 } = opts;
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  const params = new URLSearchParams({
    quality: String(quality),
    resize: 'contain',
  });
  if (width != null) params.set('width', String(width));
  return `${transformUrl}?${params.toString()}`;
}

/**
 * Genera un srcset per le card dei veicoli (max 400px, usato in grid).
 * Utilizza la Supabase Image Transform API per ridimensionare on-the-fly.
 * Ottimizzato per sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
 * che visualizza l'immagine a ~300-400px in layout desktop.
 */
export function getVehicleCardSrcSet(url) {
  if (!url || !url.includes('supabase.co')) return undefined;
  return [
    `${toTransformUrl(url, { width: 300, quality: 70 })} 300w`,
    `${toTransformUrl(url, { width: 450, quality: 72 })} 450w`,
    `${toTransformUrl(url, { width: 600, quality: 75 })} 600w`,
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
export function getOptimizedSrc(url, width = 400) {
  return toTransformUrl(url, { width, quality: 80 });
}
