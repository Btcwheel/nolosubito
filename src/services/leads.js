import { supabase } from '@/lib/supabase';

export const leadsService = {
  async create(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, status: 'Nuovo', source: 'chat' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async list() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteAll() {
    const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },
};
