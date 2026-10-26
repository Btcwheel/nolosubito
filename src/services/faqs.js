import { supabase } from '@/lib/supabase';

const SELECT = '*, faq_targets(id, target_type, target_value)';

export const faqsService = {
  // Pubbliche: la RLS espone comunque solo le pubblicate ai visitatori.
  async listPublished(client = supabase) {
    const { data, error } = await client
      .from('faqs')
      .select(SELECT)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  // CMS: bozze incluse (la RLS le mostra solo ad admin e cms).
  async listAll() {
    const { data, error } = await supabase
      .from('faqs')
      .select(SELECT)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  // Salva la FAQ e sostituisce le sue regole di assegnazione.
  async save({ id, question, answer, sort_order, is_published }, targets) {
    const row = { question, answer, sort_order, is_published };
    let faqId = id;
    if (faqId) {
      const { error } = await supabase.from('faqs').update(row).eq('id', faqId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('faqs').insert(row).select('id').single();
      if (error) throw error;
      faqId = data.id;
    }

    const { error: delError } = await supabase.from('faq_targets').delete().eq('faq_id', faqId);
    if (delError) throw delError;
    if (targets.length) {
      const { error } = await supabase.from('faq_targets').insert(
        targets.map(t => ({ faq_id: faqId, target_type: t.target_type, target_value: t.target_value ?? null })),
      );
      if (error) throw error;
    }
    return faqId;
  },

  async remove(id) {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
  },
};
