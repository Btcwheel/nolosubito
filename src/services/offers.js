import { supabase } from '@/lib/supabase';

const BUCKET = 'vehicle-images';

// Funzione per comprimere l'immagine lato client in WebP
async function generateWebP(img, maxWidth, fileName, suffix = "") {
  return new Promise((resolve, reject) => {
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
      if (!blob) return reject(new Error("Canvas to Blob failed"));
      const name = fileName.replace(/\.[^/.]+$/, "") + suffix + ".webp";
      resolve(new File([blob], name, { type: 'image/webp', lastModified: Date.now() }));
    }, 'image/webp', 0.8);
  });
}

async function compressImageVariants(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve({ main: file, small: null });
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      try {
        const main = await generateWebP(img, 800, file.name);
        const small = await generateWebP(img, 400, file.name, "-400w");
        resolve({ main, small });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };
  });
}

// Carica un file immagine su Supabase Storage e restituisce la URL pubblica
async function uploadVehicleImage(file, make, model) {
  // Comprimi e converti in WebP varianti (800w e 400w) prima di inviare
  const { main, small } = await compressImageVariants(file);
  
  const ext = main.name.split('.').pop();
  const basePath = `${make}-${model}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
  const mainPath = `${basePath}.${ext}`;

  // Upload main (800w)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(mainPath, main, { upsert: true, contentType: main.type });

  if (uploadError) throw uploadError;

  // Upload small (400w) if exists
  if (small) {
    const smallPath = `${basePath}-400w.${ext}`;
    await supabase.storage.from(BUCKET).upload(smallPath, small, { upsert: true, contentType: small.type });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
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
