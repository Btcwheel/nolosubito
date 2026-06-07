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
  // Usa RPC get_vehicle_prices() per aggregare featured/min lato DB,
  // evitando il limite di 1000 righe di PostgREST su offer_configs.
  // Accetta:
  //   - string: "P.IVA" | "Privati" | "ReUse" — segmenti di listing mutuamente esclusivi.
  //     Le varianti "ReUse-Privati" / "ReUse-Business" sono etichette del canone (QuoteBox + IVA)
  //     e NON fanno listing nelle pagine Privati/P.IVA: un veicolo ReUse sta SOLO in /reuse.
  //   - array:  lista esplicita di segmenti. Utile per /reuse che mostra tutte le varianti.
  //   - null/undefined: tutti i segmenti.
  async listWithMinPrice(segmentOrSegments) {
    const normKey = (make, model) => `${make?.trim().toUpperCase()}|${model?.trim().toUpperCase()}`;

    // Segmenti di listing (mutuamente esclusivi). Le varianti ReUse-Privati /
    // ReUse-Business sono solo etichette del canone (QuoteBox + IVA) e non
    // fanno listing nelle pagine Privati/P.IVA: un veicolo ReUse sta SOLO in /reuse.
    const SEGMENT_GROUPS = {
      'P.IVA':   ['P.IVA'],
      'Privati': ['Privati'],
      'ReUse':   ['ReUse', 'ReUse-Privati', 'ReUse-Business'],
    };

    let segments;
    if (segmentOrSegments == null) {
      segments = null;
    } else if (Array.isArray(segmentOrSegments)) {
      segments = segmentOrSegments;
    } else {
      segments = SEGMENT_GROUPS[segmentOrSegments] ?? [segmentOrSegments];
    }

    const [offersRes, pricesRes] = await Promise.all([
      supabase.from('offers').select('*').eq('is_active', true).order('make'),
      supabase.rpc('get_vehicle_prices', segments ? { p_segments: segments } : {}),
    ]);

    if (offersRes.error) throw offersRes.error;
    if (pricesRes.error) throw pricesRes.error;

    // Mappa: key → { featured, min, advance, segment, ... }
    // Se uno stesso (make, model) ha piu' segmenti (es. ReUse-Privati + Privati)
    // vince quello con prezzo "featured" non-null, altrimenti il minimo.
    const priceMap = {};
    pricesRes.data?.forEach(c => {
      const key = normKey(c.make, c.model);
      const incoming = {
        featured: c.featured_rent             != null ? Number(c.featured_rent)             : null,
        min:      c.min_rent                  != null ? Number(c.min_rent)                  : null,
        advance:  c.featured_advance_payment  != null ? Number(c.featured_advance_payment)  : null,
        duration: c.featured_duration_months  != null ? Number(c.featured_duration_months)  : null,
        km:       c.featured_annual_km        != null ? Number(c.featured_annual_km)        : null,
        segment:  c.segment,
      };
      const prev = priceMap[key];
      if (!prev) {
        priceMap[key] = incoming;
      } else {
        const incomingScore = (incoming.featured != null ? 2 : 0) + (incoming.min != null ? 1 : 0);
        const prevScore     = (prev.featured     != null ? 2 : 0) + (prev.min     != null ? 1 : 0);
        if (incomingScore >= prevScore) priceMap[key] = incoming;
      }
    });

    const segmentsFilter = segments;
    return offersRes.data
      ?.filter(o => {
        const hasSegmentFlag = !segmentsFilter || (Array.isArray(o.segments) && o.segments.some(s => segmentsFilter.includes(s)));
        const hasConfig = priceMap[normKey(o.make, o.model)] != null;
        return hasSegmentFlag || hasConfig;
      })
      .map(o => {
        const p = priceMap[normKey(o.make, o.model)];
        return {
          ...o,
          monthly_rent:    p ? (p.featured ?? p.min) : null,
          advance_payment: p ? (p.advance ?? 0)      : 0,
          duration_months: p?.duration ?? null,
          annual_km:       p?.km       ?? null,
          config_segment:  p?.segment  ?? null,
        };
      }) ?? [];
  },
};
