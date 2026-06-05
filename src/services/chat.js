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

  // ── Operatore ↔ Cliente takeover chat ────────────────────────
  async sendOperatorMessage(sessionId, content, operatorId) {
    const { supabase } = await import('@/lib/supabase');
    return supabase.from('operator_chat_messages').insert({
      session_id: sessionId,
      sender: 'operator',
      operator_id: operatorId || null,
      content,
    });
  },

  async sendCustomerMessage(sessionId, content) {
    const { supabase } = await import('@/lib/supabase');
    return supabase.from('operator_chat_messages').insert({
      session_id: sessionId,
      sender: 'customer',
      content,
    });
  },

  async listOperatorMessages(sessionId) {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('operator_chat_messages')
      .select('id, sender, content, created_at, operator_id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return data ?? [];
  },

  async listCustomerMessagesForSession(sessionId) {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('operator_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('sender', 'customer')
      .order('created_at', { ascending: true });
    return data ?? [];
  },

  async closeEscalation(sessionId, { saveToKb = false, kbContent = null, kbTitle = null } = {}) {
    const { supabase } = await import('@/lib/supabase');
    await supabase
      .from('escalated_sessions')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        added_to_kb: saveToKb,
      })
      .eq('session_id', sessionId);

    if (saveToKb && kbContent) {
      await supabase.from('knowledge_documents').insert({
        title: kbTitle || 'Conversazione escalation',
        content: kbContent,
        source: 'operator_conversation',
      });
    }
  },
};
