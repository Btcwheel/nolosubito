import CookiePolicy from "@/views/CookiePolicy";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/cookie-policy",
  title: "Cookie Policy | Nolosubito",
  description: "Informativa sull’uso dei cookie sul sito Nolosubito e come gestire le preferenze.",
});

export default function Page() {
  return <CookiePolicy />;
}
