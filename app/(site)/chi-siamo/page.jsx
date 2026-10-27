import ChiSiamo from "@/views/ChiSiamo";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/chi-siamo",
  title: "Chi siamo | Nolosubito, partner del noleggio a lungo termine",
  description: "Nolosubito supporta privati e imprese nel noleggio a lungo termine e nella mobilità aziendale. Siamo anche Clickar Point per l'usato da flotte. Sede a Napoli, presenti in tutta Italia.",
});

export default function Page() {
  return <ChiSiamo />;
}
