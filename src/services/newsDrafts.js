import { supabase } from '@/lib/supabase';
import { marked } from 'marked';

export const newsDraftsService = {
  async listPending() {
    const { data, error } = await supabase
      .from('news_drafts')
      .select('*')
      .eq('status', 'pending')
      .order('ai_generated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async accept(draft) {
    // Converte il contenuto da Markdown (generato AI) a HTML
    const content = await marked.parse(draft.content);

    // Crea il post pubblicato
    const { error: postError } = await supabase.from('posts').insert({
      title:           draft.title,
      slug:            draft.slug,
      summary:         draft.summary,
      content,
      cover_image_url: draft.cover_image_url,
      category:        draft.category,
      gallery_images:  draft.gallery_images || [],
      is_published:    true,
      published_date:  new Date().toISOString(),
    });
    if (postError) throw postError;

    // Aggiorna stato bozza
    const { error } = await supabase
      .from('news_drafts')
      .update({ status: 'accepted' })
      .eq('id', draft.id);
    if (error) throw error;
  },

  async reject(id) {
    const { error } = await supabase
      .from('news_drafts')
      .update({ status: 'rejected' })
      .eq('id', id);
    if (error) throw error;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('news_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
