import WorkWithUs from "@/views/WorkWithUs";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/careers",
  title: "Diventa Partner: Lavora con Nolosubito nel Noleggio a Lungo Termine",
  description: "Programma partner per agenzie, consulenti, broker e agenti di commercio: mandati con le migliori società di noleggio a lungo termine, formazione e strumenti digitali.",
});

export default function Page() {
  return <WorkWithUs />;
}
