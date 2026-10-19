import ListingPage, { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/moto",
  title: "Noleggio Moto e Scooter a Lungo Termine | Nolosubito",
  description: "Scooter, naked, touring e sportive in noleggio a lungo termine. Assicurazione, manutenzione e soccorso stradale inclusi nel canone.",
});

export default function Page() {
  return <ListingPage view="moto" queryKey={["offers-moto"]} segments={"Moto"} />;
}
