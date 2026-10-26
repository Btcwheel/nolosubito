import TerminiCondizioni from "@/views/TerminiCondizioni";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/termini",
  title: "Termini e Condizioni | Nolosubito",
  description: "Termini e condizioni di utilizzo del sito e dei servizi di Nolosubito S.r.l.",
});

export default function Page() {
  return <TerminiCondizioni />;
}
