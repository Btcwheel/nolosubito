import SpaClient from "../spa-client";

// Fase 1 della migrazione: tutte le rotte non ancora migrate restano la SPA attuale,
// caricata solo lato client. Una pagina Next.js specifica (es. app/offers/page.jsx)
// ha la precedenza su questo catch-all; cancellandola la rotta torna alla SPA.
export default function Page() {
  return <SpaClient />;
}
