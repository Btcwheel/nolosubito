import { supabase } from '@/lib/supabase';

export const praticheService = {
  // ── Pratiche ──────────────────────────────────────────────

  async list({ agenteId, clienteEmail } = {}) {
    let query = supabase
      .from('pratiche')
      .select(`*, pratica_documenti(*), pratica_note(*)`)
      .order('created_at', { ascending: false });

    if (agenteId) query = query.eq('agente_id', agenteId);
    if (clienteEmail) query = query.eq('cliente_email', clienteEmail);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('pratiche')
      .select(`*, pratica_documenti(*), pratica_note(*)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getByAccessToken(token) {
    const { data, error } = await supabase
      .from('pratiche')
      .select(`*, pratica_documenti(*), pratica_note(count)`)
      .eq('access_token', token)
      .single();
    if (error) throw error;
    return data;
  },

  async create(pratica) {
    const codice = `NS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const access_token = crypto.randomUUID();

    const { data, error } = await supabase
      .from('pratiche')
      .insert({ ...pratica, codice, access_token, status: 'Nuova' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('pratiche')
      .update({ status, ultimo_aggiornamento_stato: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('pratiche')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async assignAgente(praticaId, agenteId, agenteNome) {
    return this.update(praticaId, { agente_id: agenteId, agente_nome: agenteNome });
  },

  // ── Documenti ─────────────────────────────────────────────

  async uploadDocumento(praticaId, file, tipoDocumento) {
    const ext = file.name.split('.').pop();
    const path = `pratiche/${praticaId}/${tipoDocumento}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documenti')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documenti')
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from('pratica_documenti')
      .insert({
        pratica_id: praticaId,
        nome_file: file.name,
        tipo_documento: tipoDocumento,
        file_url: publicUrl,
        storage_path: path,
        stato_verifica: 'In attesa',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDocumentoStato(docId, stato, noteVerifica = null) {
    const { data, error } = await supabase
      .from('pratica_documenti')
      .update({ stato_verifica: stato, note_verifica: noteVerifica })
      .eq('id', docId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDocumento(docId, storagePath) {
    if (storagePath) {
      await supabase.storage.from('documenti').remove([storagePath]);
    }
    const { error } = await supabase
      .from('pratica_documenti')
      .delete()
      .eq('id', docId);
    if (error) throw error;
  },

  // ── Note ──────────────────────────────────────────────────

  async addNota(praticaId, testo, autorNome, autoreRuolo, visibileCliente = false) {
    const { data, error } = await supabase
      .from('pratica_note')
      .insert({
        pratica_id: praticaId,
        testo,
        autore_nome: autorNome,
        autore_ruolo: autoreRuolo,
        visibile_cliente: visibileCliente,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteNota(notaId) {
    const { error } = await supabase
      .from('pratica_note')
      .delete()
      .eq('id', notaId);
    if (error) throw error;
  },

  // Links a pre-uploaded temp file to a pratica (called after pratica creation)
  async addDocumentoUrl(praticaId, { nome_file, tipo_documento, storage_path }) {
    const { data, error } = await supabase
      .from('pratica_documenti')
      .insert({
        pratica_id: praticaId,
        nome_file,
        tipo_documento,
        storage_path,
        stato_verifica: 'In attesa',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
