import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { ListingView } from "./views";
import { NowProvider } from "@/lib/NowContext";
import { createServerSupabase } from "@/lib/supabaseServer";
import { fetchSlimCatalog } from "@/lib/serverCatalog";

// Pagina elenco renderizzata sul server: carica il catalogo con la stessa queryKey che usa la vista,
// così il browser parte con i dati già presenti e l'HTML contiene le card.
// Se Supabase non risponde la rigenerazione fallisce e resta la versione precedente.
// `filter`: stesso filtro che la vista applica dopo il caricamento; farlo qui evita di mandare al browser l'intero catalogo.
export default async function ListingPage({ view, queryKey, segments, filter }) {
  const queryClient = new QueryClient();
  const supabase = createServerSupabase();

  await queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      const vehicles = await fetchSlimCatalog(supabase, segments);
      return filter ? vehicles.filter(filter) : vehicles;
    },
  });

  return (
    <NowProvider value={Date.now()}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ListingView name={view} />
      </HydrationBoundary>
    </NowProvider>
  );
}

// Metadati comuni: titolo, descrizione e canonical per pagina.
export function listingMetadata({ path, title, description }) {
  const url = `https://nolosubito.it${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "Nolosubito", locale: "it_IT", images: ["https://nolosubito.it/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://nolosubito.it/og-image.png"] },
  };
}
