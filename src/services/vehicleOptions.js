import { supabase } from '@/lib/supabase';

export const vehicleOptionsService = {
  async list(type) {
    let query = supabase
      .from('vehicle_options')
      .select('*')
      .order('sort_order', { ascending: true });
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(option) {
    const { data, error } = await supabase
      .from('vehicle_options')
      .insert(option)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('vehicle_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('vehicle_options')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
