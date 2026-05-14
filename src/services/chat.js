import { supabase } from '@/lib/supabase';

export const chatService = {
  async send(messages) {
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: { messages },
    });

    if (error) throw error;
    return data;
  },
};
