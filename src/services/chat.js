const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

export const chatService = {
  async send(messages, sessionId) {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages, session_id: sessionId }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Edge Function error ${res.status}: ${err}`);
    }

    return res.json();
  },

  async saveContact(sessionId, { name, phone, email }) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    return supabase
      .from('escalated_sessions')
      .update({
        contact_name: name,
        contact_phone: phone || null,
        contact_email: email || null,
        status: 'contact_left',
      })
      .eq('session_id', sessionId);
  },
};
