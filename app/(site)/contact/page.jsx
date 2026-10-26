import Contact from "@/views/Contact";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/contact",
  title: "Contatti e Sedi | Nolosubito",
  description: "Contatta Nolosubito per un preventivo di noleggio a lungo termine: telefono, email, sedi di Napoli, Roma, Pozzuoli, Viterbo e Avellino, orari e modulo di richiesta.",
});

export default function Page() {
  return <Contact />;
}
