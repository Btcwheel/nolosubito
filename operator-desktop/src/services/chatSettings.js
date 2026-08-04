import { supabase } from './supabase';

const TABLE = 'chat_operator_settings';
const ID = 'global';

export const chatSettingsService = {
  async get() {
    const { data } = await supabase.from(TABLE).select('ai_enabled').eq('id', ID).single();
    return data ?? { ai_enabled: true };
  },

  async setAiEnabled(enabled, userId) {
    return supabase.from(TABLE).upsert({
      id: ID,
      ai_enabled: enabled,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  },

  subscribe(callback) {
    const channel = supabase
      .channel('chat_operator_mode_desktop')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `id=eq.${ID}`,
      }, (payload) => {
        callback(payload.new.ai_enabled);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
