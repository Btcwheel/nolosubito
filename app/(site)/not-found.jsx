import NotFoundPage from "@/components/layout/NotFoundPage";

export const metadata = { title: "Pagina non trovata | Nolosubito" };

// 404 delle pagine pubbliche (news e schede veicolo inesistenti): sta dentro Navbar e Footer.
export default function NotFound() {
  return <NotFoundPage />;
}
