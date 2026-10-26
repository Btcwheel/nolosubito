import NewsList from "./news-list";
import { createServerSupabase } from "@/lib/supabaseServer";
import { fetchPostList } from "@/lib/serverPosts";
import { listingMetadata } from "../_components/listing-page";

// ISR: rigenerata al massimo ogni 5 minuti. Se Supabase non risponde resta la versione precedente.
export const revalidate = 300;

export const metadata = listingMetadata({
  path: "/news",
  title: "News e Approfondimenti sul Noleggio a Lungo Termine | Nolosubito",
  description: "Notizie dal mondo auto, guide e approfondimenti su noleggio a lungo termine, fiscalità, mobilità elettrica e novità dei modelli. Il blog di Nolosubito.",
});

export default async function Page() {
  const posts = await fetchPostList(createServerSupabase());
  return <NewsList posts={posts} />;
}
