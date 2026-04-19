import { supabase } from '@/lib/supabase';

export const profilesService = {
  async getById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async listAgenti() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, agente_info')
      .eq('role', 'agente')
      .order('full_name');
    if (error) throw error;
    return data;
  },

  async listAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async inviteUser(email, role, fullName) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role, full_name: fullName },
    });
    if (error) throw error;
    return data;
  },
};
