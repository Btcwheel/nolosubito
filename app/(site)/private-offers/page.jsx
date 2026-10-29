import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/private-offers",
  title: "Noleggio Lungo Termine per Privati | Nolosubito",
  description: "Noleggio a lungo termine per privati con canone mensile tutto incluso: assicurazione, manutenzione e soccorso stradale compresi. Scopri le offerte.",
});

export default function Page() {
  return <ListingPage view="private" queryKey={["offers-privati"]} segments={"Privati"} />;
}
