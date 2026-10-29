import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import HomeClient from "./home-client";
import { NowProvider } from "@/lib/NowContext";
import { HOME_CATALOG_KEY } from "@/hooks/useHomeCatalog";
import { FAQS_KEY } from "@/hooks/useFaqs";
import { offersService } from "@/services/offers";
import { faqsService } from "@/services/faqs";
import { createServerSupabase } from "@/lib/supabaseServer";

// ISR: la pagina viene rigenerata al massimo ogni 5 minuti. Per aggiornamenti immediati (prezzi, promo,
// FAQ) /api/revalidate la invalida su richiesta.
export const revalidate = 300;

export const metadata = {
  alternates: { canonical: "https://nolosubito.it/" },
};

// Dati che la home non usa (descrizioni, gallerie, SEO) restano fuori dall'HTML: pesano ~60% del catalogo.
const HEAVY_FIELDS = ["description", "gallery_images", "features", "seo_description", "seo_title", "seo_keywords"];

function slimVehicle(vehicle) {
  const slim = { ...vehicle };
  for (const field of HEAVY_FIELDS) delete slim[field];
  return slim;
}

export default async function HomePage() {
  const supabase = createServerSupabase();
  const queryClient = new QueryClient();

  // fetchQuery (non prefetchQuery): se Supabase non risponde la rigenerazione fallisce e resta in
  // cache la versione precedente, invece di pubblicare una home senza veicoli.
  await Promise.all([
    queryClient.fetchQuery({
      queryKey: HOME_CATALOG_KEY,
      queryFn: async () => (await offersService.listWithMinPrice(undefined, supabase)).map(slimVehicle),
    }),
    queryClient.fetchQuery({
      queryKey: FAQS_KEY,
      queryFn: () => faqsService.listPublished(supabase),
    }),
  ]);

  return (
    <NowProvider value={Date.now()}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomeClient />
      </HydrationBoundary>
    </NowProvider>
  );
}
