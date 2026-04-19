import { supabase } from '@/lib/supabase';

export const postsService = {
  async list({ onlyPublished = true } = {}) {
    let query = supabase
      .from('posts')
      .select('*')
      .order('published_date', { ascending: false });

    if (onlyPublished) query = query.eq('is_published', true);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error) throw error;
    return data;
  },

  async create(post) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
