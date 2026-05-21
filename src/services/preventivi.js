import { supabase } from '@/lib/supabase';

export const preventiviService = {

  async list(praticaId) {
    const { data, error } = await supabase
      .from('preventivi')
      .select('*')
      .eq('pratica_id', praticaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(preventivo) {
    const { data, error } = await supabase
      .from('preventivi')
      .insert({ ...preventivo, status: 'Bozza' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('preventivi')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('preventivi')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Invia il preventivo al cliente.
   * 1. Aggiorna status → 'Inviato' + inviato_at
   * 2. Il trigger DB aggiorna pratica.status → 'In Lavorazione' se era 'Nuova'
   * 3. Chiama l'Edge Function per inviare l'email (best-effort)
   */
  async invia(id) {
    const { data, error } = await supabase
      .from('preventivi')
      .update({ status: 'Inviato', inviato_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, pratica_id')
      .single();
    if (error) throw error;

    // Trigger email (best-effort: non blocca se l'Edge Function non è configurata)
    try {
      console.log('[preventivi] invocazione send-preventivo-email', { preventivoId: id, praticaId: data.pratica_id });
      const { data: fnData, error: fnError } = await supabase.functions.invoke('send-preventivo-email', {
        body: { preventivoId: id, praticaId: data.pratica_id },
      });
      console.log('[preventivi] risposta send-preventivo-email', { fnData, fnError });
    } catch (e) {
      console.warn('[preventivi] Email Edge Function errore:', e.message);
    }

    return data;
  },

  /**
   * Cliente accetta il preventivo.
   * Il trigger DB aggiorna pratica.status → 'Documenti Richiesti'.
   */
  async accetta(id) {
    const { data, error } = await supabase
      .from('preventivi')
      .update({ status: 'Accettato' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async rifiuta(id) {
    const { data, error } = await supabase
      .from('preventivi')
      .update({ status: 'Rifiutato' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Carica il PDF broker originale su Storage e salva l'URL nel preventivo.
   * Il file viene rinominato con il codice preventivo NS-YYYY-XXXXXX.
   */
  async uploadDocumentoBroker(preventivoId, createdAt, file) {
    const anno = new Date(createdAt).getFullYear();
    const codice = `NS-${anno}-${preventivoId.slice(0, 6).toUpperCase()}`;
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${preventivoId}/${codice}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('preventivi-broker')
      .upload(path, file, { upsert: true });
    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage
      .from('preventivi-broker')
      .getPublicUrl(path);

    // Il bucket è privato: usiamo signed URL valido 1 anno (31536000 sec)
    const { data: signed, error: signErr } = await supabase.storage
      .from('preventivi-broker')
      .createSignedUrl(path, 31536000);
    if (signErr) throw signErr;

    return this.update(preventivoId, {
      documento_broker_url: signed.signedUrl,
      documento_broker_nome: `${codice}.${ext}`,
    });
  },

  // Segna come letti tutti i preventivi Inviato non ancora letti della pratica
  async segnaLetti(praticaId) {
    await supabase
      .from('preventivi')
      .update({ letto_at: new Date().toISOString() })
      .eq('pratica_id', praticaId)
      .eq('status', 'Inviato')
      .is('letto_at', null);
  },

  // Segna come letto un singolo preventivo (chiamato all'apertura del modal)
  async segnaLetto(id) {
    await supabase
      .from('preventivi')
      .update({ letto_at: new Date().toISOString() })
      .eq('id', id)
      .is('letto_at', null);
  },
};
