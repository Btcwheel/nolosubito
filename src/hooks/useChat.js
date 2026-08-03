import { useState, useRef, useCallback, useEffect } from 'react';
import { chatService } from '@/services/chat';
import { chatSettingsService } from '@/services/chatSettings';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'nolosubito_chat';
const STORAGE_TTL = 24 * 60 * 60 * 1000;
const ESCALATION_TIMEOUT_MS = 1 * 60 * 1000;

const WELCOME = {
  role: 'assistant',
  content: 'Salve! Sono l\'assistente AI di Nolosubito. Posso aiutarla a trovare il veicolo più adatto alle Sue esigenze di noleggio a lungo termine. Ha già qualcosa in mente, o preferisce che Le illustri come funziona il noleggio a lungo termine?',
};

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { messages, leadSaved, sessionId, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { messages, leadSaved, sessionId };
  } catch {
    return null;
  }
}

function saveToStorage(messages, leadSaved, sessionId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, leadSaved, sessionId, savedAt: Date.now() }));
  } catch {}
}

export default function useChat() {
  const stored = loadFromStorage();
  const [messages, setMessages] = useState(stored?.messages ?? [WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [leadSaved, setLeadSaved] = useState(stored?.leadSaved ?? false);
  const [escalated, setEscalated] = useState(false);
  const [escalationPhase, setEscalationPhase] = useState(null); // null | 'waiting' | 'ask_wait' | 'ask_contact'
  const [operatorTyping, setOperatorTyping] = useState(false);
  const [operatorName, setOperatorName] = useState(null);
  const [sessionId] = useState(() => stored?.sessionId ?? generateSessionId());
  const [aiEnabled, setAiEnabled] = useState(true);
  const bottomRef = useRef(null);
  const escalationTimerRef = useRef(null);
  const escalationChannelRef = useRef(null);
  const takeoverChannelRef = useRef(null);

  useEffect(() => {
    saveToStorage(messages, leadSaved, sessionId);
  }, [messages, leadSaved, sessionId]);

  // Fetch iniziale + sottoscrizione Realtime allo stato del toggle AI
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    chatSettingsService.get().then((settings) => {
      if (!cancelled) setAiEnabled(settings.ai_enabled !== false);
    });

    chatSettingsService.subscribe((enabled) => {
      if (!cancelled) setAiEnabled(enabled);
    }).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(escalationTimerRef.current);
      if (escalationChannelRef.current) supabase.removeChannel(escalationChannelRef.current);
      if (takeoverChannelRef.current) supabase.removeChannel(takeoverChannelRef.current);
    };
  }, []);

  const deliverMessages = useCallback(async (parts) => {
    for (let idx = 0; idx < parts.length; idx++) {
      setTyping(true);
      await new Promise(r => setTimeout(r, 250));
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: parts[idx] }]);
    }
  }, []);

  // ── TAKE-OVER MODE: ascolto continuo su operator_chat_messages ─────────────
  const subscribeToOperatorTakeover = useCallback((sid) => {
    if (takeoverChannelRef.current) {
      supabase.removeChannel(takeoverChannelRef.current);
    }

    const channel = supabase
      .channel(`op_takeover_${sid}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'operator_chat_messages',
        filter: `session_id=eq.${sid}`,
      }, (payload) => {
        const row = payload.new;
        if (row.sender === 'operator') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: row.content,
            operatorMessage: true,
            operatorName: row.operator_name || 'Operatore',
          }]);
          setOperatorTyping(false);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'escalated_sessions',
        filter: `session_id=eq.${sid}`,
      }, (payload) => {
        const row = payload.new;
        if (row.status === 'resolved' && row.operator_id) {
          // L'operatore ha chiuso la conversazione → torna a Luca
          setEscalated(false);
          setEscalationPhase(null);
          setOperatorTyping(false);
          clearTimeout(escalationTimerRef.current);
          if (takeoverChannelRef.current) {
            supabase.removeChannel(takeoverChannelRef.current);
            takeoverChannelRef.current = null;
          }
        }
      })
      .subscribe();

    takeoverChannelRef.current = channel;
  }, []);

  // ── Vecchio canale escalation UPDATE: lo teniamo come fallback ─────────────
  const subscribeToEscalationStatus = useCallback((sid) => {
    if (escalationChannelRef.current) {
      supabase.removeChannel(escalationChannelRef.current);
    }

    const channel = supabase
      .channel(`escalation_status_${sid}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'escalated_sessions',
        filter: `session_id=eq.${sid}`,
      }, (payload) => {
        const row = payload.new;
        if (row.operator_name) setOperatorName(row.operator_name);
        if (row.operator_id) setOperatorName(row.operator_name || row.operator_id);
        if (row.status === 'operator_joined') {
          setOperatorTyping(true);
        }
      })
      .subscribe();

    escalationChannelRef.current = channel;
  }, []);

  const startEscalationTimer = useCallback((sid) => {
    setEscalationPhase('waiting');

    escalationTimerRef.current = setTimeout(async () => {
      setTyping(true);
      await new Promise(r => setTimeout(r, 2000));
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sto ancora verificando — preferisce aspettare ancora qualche minuto o le conviene lasciarmi un recapito così la ricontattiamo appena possibile?',
      }]);
      setEscalationPhase('ask_wait');
    }, ESCALATION_TIMEOUT_MS);

    subscribeToOperatorTakeover(sid);
    subscribeToEscalationStatus(sid);
  }, [subscribeToOperatorTakeover, subscribeToEscalationStatus]);

  const handleEscalationChoice = useCallback(async (choice) => {
    if (choice === 'wait') {
      clearTimeout(escalationTimerRef.current);
      setEscalationPhase('waiting');
      setTyping(true);
      await new Promise(r => setTimeout(r, 1500));
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Grazie per la pazienza, ci vorrà ancora qualche minuto.',
      }]);

      escalationTimerRef.current = setTimeout(async () => {
        setTyping(true);
        await new Promise(r => setTimeout(r, 2000));
        setTyping(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Mi dispiace per l\'attesa. Preferisce lasciarmi un recapito così la ricontattiamo al più presto?',
        }]);
        setEscalationPhase('ask_contact');
      }, ESCALATION_TIMEOUT_MS);

    } else if (choice === 'contact') {
      setEscalationPhase('ask_contact');
      setTyping(true);
      await new Promise(r => setTimeout(r, 1500));
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Perfetto, mi lasci nome e un recapito (telefono o email) e la ricontattiamo al più presto.',
      }]);
    }
  }, []);

  const saveContact = useCallback(async ({ name, phone, email }) => {
    await chatService.saveContact(sessionId, { name, phone, email });
    clearTimeout(escalationTimerRef.current);
    setEscalated(false);
    setEscalationPhase(null);
    if (escalationChannelRef.current) {
      supabase.removeChannel(escalationChannelRef.current);
      escalationChannelRef.current = null;
    }
    if (takeoverChannelRef.current) {
      supabase.removeChannel(takeoverChannelRef.current);
      takeoverChannelRef.current = null;
    }
    setTyping(true);
    await new Promise(r => setTimeout(r, 1800));
    setTyping(false);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Grazie! La ricontatteremo il prima possibile.',
    }]);
  }, [sessionId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || typing) return;

    const text_clean = text.trim();
    const userMsg = { role: 'user', content: text_clean };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // ── TAKE-OVER MODE: scrivo direttamente su operator_chat_messages ─────
    if (escalated) {
      await chatService.sendCustomerMessage(sessionId, text_clean);
      return;
    }

    // ── AI DISABLED: routing diretto all'operatore ─────────────────────────
    if (!aiEnabled) {
      const newMessages = [...messages, userMsg];
      setTyping(true);
      await chatService.createDirectChat(sessionId, text_clean, newMessages);
      setTyping(false);
      setEscalated(true);
      setEscalationPhase('direct');
      subscribeToOperatorTakeover(sessionId);
      subscribeToEscalationStatus(sessionId);
      return;
    }

    // ── NORMAL MODE: chiamo l'edge function ──────────────────────────────
    const newMessages = [...messages, userMsg];
    setTyping(true);

    try {
      const apiMessages = newMessages.slice(1);
      const data = await chatService.send(apiMessages, sessionId);

      if (data.leadSaved && !leadSaved) {
        setLeadSaved(true);
      }

      const serverLen = data.response_length;

      if (data.escalated) {
        setEscalated(true);
        setTyping(false);
        await deliverMessages(data.reply, serverLen);

        if (data.direct_mode) {
          setEscalationPhase('direct');
          subscribeToOperatorTakeover(data.session_id || sessionId);
          subscribeToEscalationStatus(data.session_id || sessionId);
        } else {
          setTyping(true);
          startEscalationTimer(data.session_id || sessionId);
        }
        return;
      }

      setTyping(false);

      if (Array.isArray(data.reply) && data.reply.length > 0) {
        await deliverMessages(data.reply, serverLen);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Posso ricontattarLa tra poco — mi lascia un recapito? Grazie.',
      }]);
    }
  }, [messages, typing, escalated, leadSaved, sessionId, aiEnabled, deliverMessages, startEscalationTimer, subscribeToOperatorTakeover, subscribeToEscalationStatus]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTimeout(escalationTimerRef.current);
    if (escalationChannelRef.current) {
      supabase.removeChannel(escalationChannelRef.current);
      escalationChannelRef.current = null;
    }
    if (takeoverChannelRef.current) {
      supabase.removeChannel(takeoverChannelRef.current);
      takeoverChannelRef.current = null;
    }
    setMessages([WELCOME]);
    setInput('');
    setTyping(false);
    setLeadSaved(false);
    setEscalated(false);
    setEscalationPhase(null);
    setOperatorTyping(false);
    setOperatorName(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    typing,
    leadSaved,
    escalated,
    escalationPhase,
    operatorTyping,
    operatorName,
    sessionId,
    aiEnabled,
    bottomRef,
    sendMessage,
    handleEscalationChoice,
    saveContact,
    reset,
  };
}
