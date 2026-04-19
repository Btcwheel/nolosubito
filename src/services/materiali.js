import { supabase } from '@/lib/supabase';

export const materialiService = {
  // Per agenti: solo materiali visibili a loro
  async listForAgente(agenteId) {
    const { data, error } = await supabase
      .from('materiali')
      .select(`*, materiale_visibilita!inner(agente_id)`)
      .or(`visibilita.eq.tutti,materiale_visibilita.agente_id.eq.${agenteId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Per admin: tutti i materiali
  async listAll() {
    const { data, error } = await supabase
      .from('materiali')
      .select(`*, materiale_visibilita(agente_id, profiles(full_name))`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(materiale, file) {
    const ext = file.name.split('.').pop();
    const path = `materiali/${materiale.tipo}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('materiali')
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('materiali')
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from('materiali')
      .insert({ ...materiale, file_url: publicUrl, storage_path: path })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setVisibilita(materialeId, agenteIds) {
    // Cancella visibilità precedente
    await supabase
      .from('materiale_visibilita')
      .delete()
      .eq('materiale_id', materialeId);

    if (agenteIds.length === 0) return;

    const rows = agenteIds.map(id => ({ materiale_id: materialeId, agente_id: id }));
    const { error } = await supabase.from('materiale_visibilita').insert(rows);
    if (error) throw error;
  },

  async delete(id, storagePath) {
    if (storagePath) {
      await supabase.storage.from('materiali').remove([storagePath]);
    }
    const { error } = await supabase.from('materiali').delete().eq('id', id);
    if (error) throw error;
  },
};
