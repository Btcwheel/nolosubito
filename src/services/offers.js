import { supabase } from '@/lib/supabase';

export const offersService = {
  // Catalogo veicoli
  async list() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByMakeModel(make, model) {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('make', make)
      .eq('model', model)
      .single();
    if (error) throw error;
    return data;
  },

  async create(offer) {
    const { data, error } = await supabase
      .from('offers')
      .insert(offer)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Configurazioni prezzi QuoteBox
  async getConfigs(make, model) {
    const { data, error } = await supabase
      .from('offer_configs')
      .select('*')
      .eq('make', make)
      .eq('model', model);
    if (error) throw error;
    return data;
  },

  async getAllConfigs() {
    const { data, error } = await supabase
      .from('offer_configs')
      .select('*')
      .order('make');
    if (error) throw error;
    return data;
  },

  async upsertConfig(config) {
    const { data, error } = await supabase
      .from('offer_configs')
      .upsert(config, { onConflict: 'make,model,duration_months,annual_km,segment' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteConfig(id) {
    const { error } = await supabase
      .from('offer_configs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
