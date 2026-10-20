import PrivacyPolicy from "@/views/PrivacyPolicy";
import { listingMetadata } from "../_components/listing-page";

export const metadata = listingMetadata({
  path: "/privacy",
  title: "Privacy Policy | Nolosubito",
  description: "Informativa sul trattamento dei dati personali di Nolosubito S.r.l.",
});

export default function Page() {
  return <PrivacyPolicy />;
}
