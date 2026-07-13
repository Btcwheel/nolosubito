// Una promo è visibile sul sito solo se è stata attivata manualmente dal CMS
// (promo_active) E la data di scadenza non è ancora passata. Le due condizioni
// sono indipendenti: promo_active permette di nascondere/riattivare una promo
// senza toccare sconto/data/servizi già configurati.
export function isPromoLive(offer) {
  return !!(
    offer?.promo_active !== false &&
    offer?.promo_expires_at &&
    new Date(offer.promo_expires_at) > new Date()
  );
}
