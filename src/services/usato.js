/**
 * Servizio veicoli usati — AutoScout24
 *
 * INTEGRAZIONE REALE (quando disponibili le credenziali dealer):
 *
 * const AS24_BASE = "https://listing-creation.api.autoscout24.com/public/v1";
 *
 * async function getToken() {
 *   const res = await fetch(`${AS24_BASE}/clients/oauth/token`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       grant_type: "client_credentials",
 *       client_id: import.meta.env.VITE_AS24_CLIENT_ID,
 *       client_secret: import.meta.env.VITE_AS24_CLIENT_SECRET,
 *     }),
 *   });
 *   const data = await res.json();
 *   return data.access_token;
 * }
 *
 * export async function fetchUsato(sellerId) {
 *   const token = await getToken();
 *   // sellerId for Nolosubito: use the dealer slug "nolosubito-srl" or their numeric AS24 ID
 *   // Dealer page: https://www.autoscout24.it/concessionari/nolosubito-srl
 *   const res = await fetch(`${AS24_BASE}/sellers/${sellerId}/listings?status=active`, {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *   const data = await res.json();
 *   return data.listings.map(normalizeAS24Listing);
 * }
 *
 * function normalizeAS24Listing(l) {
 *   return {
 *     id: l.id,
 *     marca: l.vehicle.make,
 *     modello: l.vehicle.model,
 *     anno: l.vehicle.firstRegistration?.year,
 *     km: l.vehicle.mileage?.value,
 *     prezzo: l.prices?.publicPrice?.value,
 *     carburante: l.vehicle.fuel,
 *     cambio: l.vehicle.transmissionType,
 *     potenza_cv: l.vehicle.power?.enginePower,
 *     colore: l.vehicle.color,
 *     immagine: l.images?.[0]?.url,
 *     immagini: l.images?.map(i => i.url) ?? [],
 *     url_as24: `https://www.autoscout24.it/annunci/${l.id}`,
 *     condizione: l.vehicle.condition,
 *     descrizione: l.description,
 *   };
 * }
 */

// ── MOCK DATA (struttura identica all'API reale) ────────────────────────────────
const MOCK_USATO = [
  {
    id: "as24-001",
    marca: "BMW",
    modello: "Serie 3 320d",
    anno: 2021,
    km: 45000,
    prezzo: 29900,
    carburante: "Diesel",
    cambio: "Automatico",
    potenza_cv: 190,
    colore: "Grigio Mineral",
    immagine: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "Ottimo stato, tagliandi BMW certificati, unico proprietario.",
    targa_prova: true,
  },
  {
    id: "as24-002",
    marca: "Volkswagen",
    modello: "Tiguan 2.0 TDI",
    anno: 2022,
    km: 28000,
    prezzo: 34500,
    carburante: "Diesel",
    cambio: "Automatico",
    potenza_cv: 150,
    colore: "Bianco Puro",
    immagine: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "Full optional, tetto panoramico, navigatore pro.",
    targa_prova: false,
  },
  {
    id: "as24-003",
    marca: "Tesla",
    modello: "Model 3 Long Range",
    anno: 2022,
    km: 32000,
    prezzo: 38900,
    carburante: "Elettrico",
    cambio: "Automatico",
    potenza_cv: 352,
    colore: "Rosso Multi-Coat",
    immagine: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "Autonomia 580 km, Autopilot incluso, garanzia Tesla estesa.",
    targa_prova: true,
  },
  {
    id: "as24-004",
    marca: "Audi",
    modello: "A4 Avant 40 TDI",
    anno: 2020,
    km: 62000,
    prezzo: 27500,
    carburante: "Diesel",
    cambio: "Automatico",
    potenza_cv: 204,
    colore: "Nero Mythos",
    immagine: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "S-Line, Matrix LED, Virtual Cockpit, gancio traino.",
    targa_prova: false,
  },
  {
    id: "as24-005",
    marca: "Mercedes-Benz",
    modello: "GLC 220d 4MATIC",
    anno: 2021,
    km: 38000,
    prezzo: 44900,
    carburante: "Diesel",
    cambio: "Automatico",
    potenza_cv: 194,
    colore: "Argento Iridio",
    immagine: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "AMG Line, tetto apribile, Burmester sound system.",
    targa_prova: false,
  },
  {
    id: "as24-006",
    marca: "Toyota",
    modello: "RAV4 Hybrid",
    anno: 2022,
    km: 19000,
    prezzo: 36800,
    carburante: "Ibrido",
    cambio: "Automatico",
    potenza_cv: 222,
    colore: "Blu Lunare",
    immagine: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80&auto=format&fit=crop",
    immagini: [],
    url_as24: "https://www.autoscout24.it/concessionari/nolosubito-srl",
    condizione: "Usato",
    descrizione: "Consumi 5,5L/100km, AWD-i, Toyota Safety Sense completo.",
    targa_prova: true,
  },
];

export const usatoService = {
  async list() {
    // Simula latenza API reale
    await new Promise(r => setTimeout(r, 600));
    return MOCK_USATO;
  },

  async getById(id) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_USATO.find(v => v.id === id) ?? null;
  },
};
