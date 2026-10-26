// Letture dei post per le pagine news renderizzate sul server. Il client Supabase arriva dal chiamante.
const LIST_FIELDS = "id,slug,title,summary,cover_image_url,category,published_date";

export async function fetchPostList(client) {
  const { data, error } = await client
    .from("posts")
    .select(LIST_FIELDS)
    .eq("is_published", true)
    .order("published_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// null se l'articolo non esiste o non è pubblicato (→ 404); gli errori di rete vengono rilanciati
// così la rigenerazione fallisce e resta la versione precedente.
export async function fetchPostBySlug(client, slug) {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
