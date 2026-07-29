import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

const STYLES = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' },
  header: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
  operatorLabel: { fontSize: '12px', color: '#2563eb', fontWeight: 600, marginTop: '2px' },
  messages: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  inputArea: { padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: '#fff' },
  input: { flex: 1, border: '1px solid #d1d5db', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' },
  sendBtn: { borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' },
  sendBtnDisabled: { borderRadius: '10px', border: 'none', backgroundColor: '#cbd5e1', color: '#fff', padding: '8px 20px', fontSize: '14px', cursor: 'not-allowed' },
  closeBtn: { borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
};

export default function ChatView({ session, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`chat_${session.session_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'operator_chat_messages',
        filter: `session_id=eq.${session.session_id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session.session_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadMessages = async () => {
    const { data: liveMessages } = await supabase
      .from('operator_chat_messages')
      .select('*')
      .eq('session_id', session.session_id)
      .order('created_at', { ascending: true });

    const historyMessages = Array.isArray(session.chat_history)
      ? session.chat_history
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map((m, idx) => ({
            id: `history-${idx}`,
            session_id: session.session_id,
            sender: m.role === 'user' ? 'customer' : 'luca',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            created_at: null,
            isHistory: true,
          }))
      : [];

    setMessages([...historyMessages, ...(liveMessages || [])]);
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    await supabase.from('operator_chat_messages').insert({
      session_id: session.session_id,
      sender: 'operator',
      operator_id: user.id,
      operator_name: profile?.name || 'Operatore',
      content,
    });

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={STYLES.container}>
      <div style={STYLES.header}>
        <div>
          <strong>Chat cliente</strong>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            {session.user_question?.slice(0, 60)}...
          </p>
          {session.operator_name && (
            <p style={STYLES.operatorLabel}>Rispondi come {session.operator_name}</p>
          )}
        </div>
        <button style={STYLES.closeBtn} onClick={onClose}>Chiudi</button>
      </div>

      <div style={STYLES.messages}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'operator' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '8px 14px',
              borderRadius: '16px',
              backgroundColor: m.sender === 'operator' ? '#2563eb' : (m.isHistory ? '#e2e8f0' : '#f1f5f9'),
              color: m.sender === 'operator' ? '#fff' : '#1e293b',
              fontSize: '14px',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              opacity: m.isHistory ? 0.85 : 1,
            }}>
              {m.isHistory && (
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                  {m.sender === 'luca' ? 'LUCA' : 'CLIENTE'} — prima dell’escalation
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={STYLES.inputArea}>
        <textarea
          ref={inputRef}
          style={STYLES.input}
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Scrivi un messaggio..."
        />
        <button
          style={text.trim() && !sending ? STYLES.sendBtn : STYLES.sendBtnDisabled}
          onClick={send}
          disabled={!text.trim() || sending}
        >
          Invia
        </button>
      </div>
    </div>
  );
}
