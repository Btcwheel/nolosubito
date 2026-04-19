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

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
