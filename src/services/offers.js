import { supabase } from '@/lib/supabase';

const BUCKET = 'vehicle-images';

// Carica un file immagine su Supabase Storage e restituisce la URL pubblica
async function uploadVehicleImage(file, make, model) {
  const ext  = file.name.split('.').pop();
  const path = `${make}-${model}-${Date.now()}.${ext}`.toLowerCase().replace(/\s+/g, '-');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

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

  uploadVehicleImage,

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
    if (config.id) {
      // Modifica esistente — aggiorna per id, non per conflict key
      const { id, ...updates } = config;
      const { data, error } = await supabase
        .from('offer_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Nuova config — insert con upsert per evitare duplicati
      const { data, error } = await supabase
        .from('offer_configs')
        .upsert(config, { onConflict: 'make,model,duration_months,annual_km,segment' })
        .select();
      if (error) throw error;
      return data?.[0] ?? null;
    }
  },

  async deleteConfig(id) {
    const { error } = await supabase
      .from('offer_configs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Veicoli con prezzo minimo per le pagine listing
  async listWithMinPrice(segment) {
    let configQuery = supabase
      .from('offer_configs')
      .select('make,model,monthly_rent,segment')
      .eq('is_active', true);

    if (segment) configQuery = configQuery.eq('segment', segment);

    const [offersRes, configsRes] = await Promise.all([
      supabase.from('offers').select('*').eq('is_active', true).order('make'),
      configQuery,
    ]);

    if (offersRes.error) throw offersRes.error;
    if (configsRes.error) throw configsRes.error;

    const minPriceMap = {};
    configsRes.data?.forEach(c => {
      const key = `${c.make}|${c.model}`;
      if (!minPriceMap[key] || c.monthly_rent < minPriceMap[key]) {
        minPriceMap[key] = c.monthly_rent;
      }
    });

    // Restituisce solo i veicoli che hanno almeno una config per il segmento richiesto
    return offersRes.data
      ?.filter(o => minPriceMap[`${o.make}|${o.model}`] != null)
      .map(o => ({
        ...o,
        monthly_rent: minPriceMap[`${o.make}|${o.model}`],
      })) ?? [];
  },
};
