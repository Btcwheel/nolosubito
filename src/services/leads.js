import { supabase } from '@/lib/supabase';

export const leadsService = {
  // ── CRUD base ────────────────────────────────────────────────
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
      .select(`
        *,
        agente:agente_id(id, nome, cognome)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        agente:agente_id(id, nome, cognome)
      `)
      .eq('id', id)
      .single();
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

  async deleteSelected(ids) {
    if (!ids.length) return;
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) throw error;
  },

  // ── Status e campi tracciamento ──────────────────────────────
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

  async registraContatto(id, { nota, autoreId, autoreNome, autoreTipo = 'admin' } = {}) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('leads')
      .update({ last_contacted_at: now, status: 'Contattato' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Registra attività manuale
    await supabase.rpc('add_lead_activity', {
      p_lead_id:     id,
      p_tipo:        'contatto_operatore',
      p_descrizione: nota || 'Contatto registrato',
      p_autore_id:   autoreId || null,
      p_autore_nome: autoreNome || null,
      p_autore_tipo: autoreTipo,
    });

    return data;
  },

  async programmaFollowUp(id, { data: followUpDate, nota, autoreId, autoreNome } = {}) {
    const { data, error } = await supabase
      .from('leads')
      .update({ follow_up_at: followUpDate })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await supabase.rpc('add_lead_activity', {
      p_lead_id:     id,
      p_tipo:        'follow_up_programmato',
      p_descrizione: nota || `Follow-up programmato per ${new Date(followUpDate).toLocaleDateString('it-IT')}`,
      p_autore_id:   autoreId || null,
      p_autore_nome: autoreNome || null,
      p_autore_tipo: 'admin',
    });

    return data;
  },

  async assegnaAgente(id, { agenteId, autoreId, autoreNome } = {}) {
    const { data, error } = await supabase
      .from('leads')
      .update({ agente_id: agenteId })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await supabase.rpc('add_lead_activity', {
      p_lead_id:     id,
      p_tipo:        'assegnazione',
      p_descrizione: agenteId ? 'Lead assegnato a operatore' : 'Assegnazione rimossa',
      p_autore_id:   autoreId || null,
      p_autore_nome: autoreNome || null,
      p_autore_tipo: 'admin',
    });

    return data;
  },

  async aggiornaNota(id, { nota, autoreId, autoreNome, autoreTipo = 'admin' } = {}) {
    await supabase.rpc('add_lead_activity', {
      p_lead_id:     id,
      p_tipo:        'nota',
      p_descrizione: nota,
      p_autore_id:   autoreId || null,
      p_autore_nome: autoreNome || null,
      p_autore_tipo: autoreTipo,
    });
  },

  // ── Preferenze strutturate ───────────────────────────────────
  async aggiornaPref(id, prefs) {
    const allowed = [
      'pref_marca','pref_modello','pref_carburante',
      'pref_durata_mesi','pref_budget_min','pref_budget_max',
      'pref_km_anno','pref_anticipo',
    ];
    const payload = Object.fromEntries(
      Object.entries(prefs).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Attività (timeline) ──────────────────────────────────────
  async getAttivita(leadId) {
    const { data, error } = await supabase
      .from('lead_attivita')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ── Filtri avanzati ──────────────────────────────────────────
  async listFiltered({ status, marca, carburante, search, agenteId, soloFollowUp } = {}) {
    let q = supabase
      .from('leads')
      .select(`*, agente:agente_id(id, nome, cognome)`)
      .order('created_at', { ascending: false });

    if (status && status !== 'tutti')       q = q.eq('status', status);
    if (marca)                              q = q.ilike('pref_marca', `%${marca}%`);
    if (carburante)                         q = q.eq('pref_carburante', carburante);
    if (agenteId)                           q = q.eq('agente_id', agenteId);
    if (soloFollowUp)                       q = q.not('follow_up_at', 'is', null).lte('follow_up_at', new Date().toISOString());
    if (search) {
      q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%,pref_marca.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
};
