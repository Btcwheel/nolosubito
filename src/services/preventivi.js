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
      await supabase.functions.invoke('send-preventivo-email', {
        body: { preventivoId: id, praticaId: data.pratica_id },
      });
    } catch (e) {
      console.warn('Email Edge Function non disponibile:', e.message);
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
};
