import { computeNetMonthlyRent } from "@/lib/vehiclePricing";
import { canonicalPath } from "@/lib/canonicalPath";

const DOMAIN = "https://nolosubito.it";

const FUEL_IT = { Electric: "elettrica", Hybrid: "ibrida", Diesel: "diesel", Petrol: "benzina" };

// Nel DB marca e modello sono in maiuscolo ("ALFA ROMEO", "GIULIA"): per titolo e descrizione si usa la forma normale.
// Le sigle corte (BMW, DS, GLC) e le parole con cifre (C3, 500e, XC60) restano come sono.
const LOWER = new Set(["co", "di", "e", "da"]);
export function displayName(value) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/\d/.test(word) || /^[^a-zA-Z]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (LOWER.has(lower)) return word === "CO" ? "Co" : word.length <= 3 ? word : lower;
      if (word.length <= 3) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function vehicleUrl(vehicle) {
  return `${DOMAIN}${canonicalPath(`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`)}`;
}

// Titolo e descrizione composti dai dati del veicolo. I campi seo_title/seo_description del DB non si usano:
// sono generati da un modello fisso e in alcune righe nominano un altro modello.
export function buildVehicleMeta(vehicle) {
  const name = `${displayName(vehicle.make)} ${displayName(vehicle.model)}`;
  const fuel = FUEL_IT[vehicle.fuel_type];
  const traits = [vehicle.category, fuel].filter(Boolean).join(", ");
  const version = vehicle.version ? ` ${vehicle.version.trim()}` : "";
  const full = `Noleggio lungo termine ${name}${version}${traits ? ` (${traits})` : ""}: canone mensile con assicurazione, manutenzione e soccorso stradale inclusi. Richiedi il preventivo.`;
  const short = `Noleggio lungo termine ${name}${traits ? ` (${traits})` : ""}: canone mensile con assicurazione, manutenzione e soccorso stradale inclusi. Richiedi il preventivo.`;
  return {
    name,
    title: `Noleggio lungo termine ${name} | Nolosubito`,
    description: full.length <= 175 ? full : short,
  };
}

// "<" escapato per non poter chiudere il tag <script> dal contenuto.
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

export function buildVehicleJsonLd(vehicle, configs, meta) {
  const url = vehicleUrl(vehicle);
  const offers = configs
    .filter((c) => c.is_active !== false)
    .map((c) => ({ config: c, price: computeNetMonthlyRent(c.monthly_rent, c.advance_payment, c.duration_months) }))
    .filter(({ price }) => price != null && Number.isFinite(Number(price)))
    .map(({ config, price }) => ({
      "@type": "Offer",
      priceCurrency: "EUR",
      price: Number(price),
      url,
      description: `${config.duration_months} mesi, ${Number(config.annual_km).toLocaleString("it-IT")} km/anno`,
    }));

  const car = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: meta.name,
    url,
    description: meta.description,
    brand: { "@type": "Brand", name: displayName(vehicle.make) },
    model: displayName(vehicle.model),
    ...(vehicle.vehicle_image && { image: vehicle.vehicle_image }),
    ...(vehicle.fuel_type && { fuelType: vehicle.fuel_type }),
    ...(vehicle.transmission && { vehicleTransmission: vehicle.transmission }),
    ...(offers.length && { offers }),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${DOMAIN}/` },
      { "@type": "ListItem", position: 2, name: "Offerte Noleggio", item: `${DOMAIN}/offers` },
      { "@type": "ListItem", position: 3, name: meta.name, item: url },
    ],
  };

  return [car, breadcrumbs];
}
