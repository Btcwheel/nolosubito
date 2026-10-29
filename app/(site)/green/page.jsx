import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/green",
  title: "Noleggio Auto Elettriche e Ibride a Lungo Termine | Nolosubito",
  description: "Veicoli elettrici e ibridi per aziende lungimiranti: costi ridotti, zero emissioni, massimi benefici fiscali. Noleggio a lungo termine a canone fisso.",
});

// Stesso criterio di src/views, applicato sul server.
const isIncluded = (v) => v.fuel_type === "Electric" || v.fuel_type === "Hybrid";

export default function Page() {
  return <ListingPage view="green" queryKey={["offers-green"]} segments={undefined} filter={isIncluded} />;
}
