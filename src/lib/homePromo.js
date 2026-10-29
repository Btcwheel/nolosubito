// Regole condivise di home e hero: promo a tempo e segmento cliente scelto dal toggle (Privati | P.IVA).

export const MOTO_CATEGORIES = ["Moto", "Scooter", "Moto e Scooter"];

// Promo valida adesso: data di scadenza futura e interruttore del CMS acceso.
export const isPromoLive = (v, now = Date.now()) =>
  !!v.promo_expires_at && v.promo_active !== false && new Date(v.promo_expires_at).getTime() > now;

// Il CMS indica a chi è rivolta la promo: "Privati", "P.IVA" o vuoto (entrambi).
export const promoMatchesSegment = (v, segment) => !v.promo_segment || v.promo_segment === segment;

// Stessa regola del catalogo in home: le moto non seguono il toggle, il resto si filtra per segmento.
export const matchesSegment = (v, segment) => {
  const cat = v.category?.trim();
  if (MOTO_CATEGORIES.includes(cat)) return false;
  if (!Array.isArray(v.segments)) return segment === "P.IVA";
  return v.segments.includes(segment);
};
