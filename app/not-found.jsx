import SiteShell from "@/components/layout/SiteShell";
import SiteProviders from "@/components/providers/SiteProviders";
import NotFoundPage from "@/components/layout/NotFoundPage";

export const metadata = { title: "Pagina non trovata | Nolosubito" };

// 404 degli indirizzi che non corrispondono a nessuna rotta: qui non c'è il layout di (site),
// quindi la cornice del sito va aggiunta a mano.
export default function NotFound() {
  return (
    <SiteProviders>
      <SiteShell>
        <NotFoundPage />
      </SiteShell>
    </SiteProviders>
  );
}
