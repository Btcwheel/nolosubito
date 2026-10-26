// FAQ del singolo modello composte dai dati del catalogo (canone, durate, km, pronta
// consegna, promo): restano allineate ai prezzi senza passare dal CMS e non
// contengono nulla che non sia già nel database.

const list = (nums, suffix = "") => {
  const items = nums.map(n => `${n.toLocaleString("it-IT")}${suffix}`);
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}` : items[0];
};

const uniqueSorted = (values) =>
  [...new Set(values.map(Number).filter(n => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);

export function buildModelFaqs({ make, model, vehicle, configs = [], price, vatIncluded, segment }) {
  const name = `${make} ${model}`;
  const faqs = [];

  if (price != null) {
    faqs.push({
      id: "gen-price",
      question: `Quanto costa noleggiare ${name} a lungo termine?`,
      answer: `Il canone di ${name} parte da ${price.toLocaleString("it-IT")} € al mese (${vatIncluded ? "IVA inclusa" : "+ IVA 22%"}), con Kasko e manutenzione incluse. L'importo esatto dipende da durata, chilometri annui e anticipo che scegli nel configuratore.`,
    });
  }

  const active = configs.filter(c => c.is_active !== false && (!segment || c.segment === segment));
  const durations = uniqueSorted(active.map(c => c.duration_months));
  const kms = uniqueSorted(active.map(c => c.annual_km));
  const advances = [...new Set(active.map(c => Number(c.advance_payment) || 0))].sort((a, b) => a - b);
  if (durations.length && kms.length) {
    const advanceText = advances.length > 1
      ? ` L'anticipo va da ${advances[0].toLocaleString("it-IT")} € a ${advances[advances.length - 1].toLocaleString("it-IT")} €.`
      : advances[0] === 0 ? " È disponibile senza anticipo." : "";
    faqs.push({
      id: "gen-config",
      question: `Quali durate e chilometraggi posso scegliere per ${name}?`,
      answer: `Per ${name} puoi scegliere durate di ${list(durations)} mesi e percorrenze di ${list(kms)} km l'anno.${advanceText}`,
    });
  }

  if (vehicle?.is_ready_delivery === true) {
    faqs.push({
      id: "gen-ready",
      question: `${name} è disponibile in pronta consegna?`,
      answer: `Sì, ${name} è tra i veicoli in pronta consegna: non devi aspettare i tempi di ordinazione di un veicolo nuovo.`,
    });
  }

  const expires = vehicle?.promo_expires_at ? new Date(vehicle.promo_expires_at) : null;
  if (expires && expires > new Date()) {
    const pct = Number(vehicle.promo_discount_pct);
    faqs.push({
      id: "gen-promo",
      question: `C'è un'offerta in corso su ${name}?`,
      answer: `Sì${pct > 0 ? `, c'è uno sconto del ${pct}% sul canone` : ", c'è una promozione attiva"} fino al ${expires.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.`,
    });
  }

  return faqs;
}
