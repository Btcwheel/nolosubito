import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/reuse",
  title: "Re-Use: Usato Certificato in Noleggio Lungo Termine | Nolosubito",
  description: "Veicoli usati selezionati e certificati in noleggio a lungo termine: la qualità del nuovo a condizioni vantaggiose.",
});

export default function Page() {
  return <ListingPage view="reuse" queryKey={["offers-reuse"]} segments={["ReUse", "ReUse-Privati", "ReUse-Business"]} />;
}
