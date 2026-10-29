import Usato from "@/views/Usato";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/usato",
  title: "Usato Garantito | Nolosubito",
  description: "Auto usate garantite e pronte alla consegna, selezionate da Nolosubito e pubblicate sul catalogo AutoScout24.",
});

export default function Page() {
  return <Usato />;
}
