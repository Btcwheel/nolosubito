import FleetSolutions from "@/views/FleetSolutions";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/fleet",
  title: "Gestione Flotte Aziendali in Noleggio a Lungo Termine | Nolosubito",
  description: "Noleggio a lungo termine per flotte aziendali: da 5 a 500+ veicoli, un solo partner e una sola fattura, con assicurazione, manutenzione e assistenza incluse. Richiedi una consulenza.",
});

export default function Page() {
  return <FleetSolutions />;
}
