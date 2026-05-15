import { supabase } from '@/lib/supabase';

const BUCKET = 'vehicle-images';

// Funzione per comprimere l'immagine lato client in WebP
async function compressImageToWebP(file, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/webp') {
      return resolve(file);
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob failed"));
          return;
        }
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        resolve(webpFile);
      }, 'image/webp', 0.8);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };
  });
}

// Carica un file immagine su Supabase Storage e restituisce la URL pubblica
async function uploadVehicleImage(file, make, model) {
  // Comprimi e converti in WebP prima di inviare
  const optimizedFile = await compressImageToWebP(file);
  
  const ext  = optimizedFile.name.split('.').pop();
  const path = `${make}-${model}-${Date.now()}.${ext}`.toLowerCase().replace(/\s+/g, '-');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimizedFile, { upsert: true, contentType: optimizedFile.type });

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

  // Veicoli con prezzo per le pagine listing.
  // Usa il canone "vetrina" (is_featured) se disponibile per il segmento; fallback al minimo.
  async listWithMinPrice(segment) {
    let configQuery = supabase
      .from('offer_configs')
      .select('make,model,monthly_rent,segment,is_featured')
      .eq('is_active', true)
      .limit(5000);

    if (segment) configQuery = configQuery.eq('segment', segment);

    const [offersRes, configsRes] = await Promise.all([
      supabase.from('offers').select('*').eq('is_active', true).order('make'),
      configQuery,
    ]);

    if (offersRes.error) throw offersRes.error;
    if (configsRes.error) throw configsRes.error;

    // Mappa: key → { featured: rent | null, min: rent }
    const priceMap = {};
    configsRes.data?.forEach(c => {
      const key = `${c.make}|${c.model}`;
      if (!priceMap[key]) priceMap[key] = { featured: null, min: null };
      const rent = Number(c.monthly_rent);
      if (c.is_featured) priceMap[key].featured = rent;
      if (priceMap[key].min === null || rent < priceMap[key].min) priceMap[key].min = rent;
    });

    return offersRes.data
      ?.filter(o => {
        const hasSegmentFlag = !segment || (Array.isArray(o.segments) && o.segments.includes(segment));
        const hasConfig = priceMap[`${o.make}|${o.model}`] != null;
        return hasSegmentFlag || hasConfig;
      })
      .map(o => {
        const p = priceMap[`${o.make}|${o.model}`];
        return {
          ...o,
          monthly_rent: p ? (p.featured ?? p.min) : null,
        };
      }) ?? [];
  },
};
