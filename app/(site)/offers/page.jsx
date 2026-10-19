import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/offers",
  title: "Noleggio Lungo Termine per Aziende e P.IVA | Nolosubito",
  description: "Gamma completa di noleggio a lungo termine per P.IVA e aziende. Assicurazione, manutenzione e soccorso stradale inclusi nel canone mensile. Richiedi un preventivo.",
});

export default function Page() {
  return <ListingPage view="business" queryKey={["offers-business"]} segments={"P.IVA"} />;
}
