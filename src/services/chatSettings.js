let supabaseInstance = null;

async function getSupabase() {
  if (!supabaseInstance) {
    const mod = await import('@/lib/supabase');
    supabaseInstance = mod.supabase;
  }
  return supabaseInstance;
}

const TABLE = 'chat_operator_settings';
const ID = 'global';

export const chatSettingsService = {
  async get() {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from(TABLE)
      .select('ai_enabled, updated_at, updated_by')
      .eq('id', ID)
      .single();
    return data ?? { ai_enabled: true };
  },

  async setAiEnabled(enabled, userId) {
    const supabase = await getSupabase();
    return supabase.from(TABLE).upsert({
      id: ID,
      ai_enabled: enabled,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  },

  async subscribe(callback) {
    const supabase = await getSupabase();
    
    const channel = supabase
      .channel('chat_operator_mode')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `id=eq.${ID}`,
      }, (payload) => {
        callback(payload.new.ai_enabled);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async countWaitingDirect() {
    const supabase = await getSupabase();
    const { count } = await supabase
      .from('escalated_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'direct')
      .eq('status', 'waiting');
    return count ?? 0;
  },
};
