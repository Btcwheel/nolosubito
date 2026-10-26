import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/commercial",
  title: "Noleggio Veicoli Commerciali a Lungo Termine | Nolosubito",
  description: "Furgoni, van cargo e veicoli commerciali leggeri in noleggio a lungo termine. Manutenzione e assicurazione incluse nel canone mensile.",
});

// Stesso criterio di src/views, applicato sul server.
const isIncluded = (v) => v.category === "Commercial Van";

export default function Page() {
  return <ListingPage view="commercial" queryKey={["offers-commercial"]} segments={undefined} filter={isIncluded} />;
}
