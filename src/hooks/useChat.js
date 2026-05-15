import { useState, useRef, useCallback, useEffect } from 'react';
import { chatService } from '@/services/chat';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'nolosubito_chat';
const STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 ore
const ESCALATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minuti

const WELCOME = {
  role: 'assistant',
  content: 'Salve! Sono Luca, consulente NLT di Nolosubito. Sono a Sua disposizione per aiutarLa a trovare il veicolo più adatto alle Sue esigenze. Ha già qualcosa in mente, o preferisce che Le illustri come funziona il noleggio a lungo termine?',
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

function typingDelay(text) {
  const base = text.length * 130;
  const jitter = Math.random() * 1000 - 500;
  return Math.min(Math.max(base + jitter, 4000), 10000);
}

const BETWEEN_MSG_PAUSE = () => 2500 + Math.random() * 2000;
const READ_DELAY = () => 2500 + Math.random() * 2500;

export default function useChat() {
  const stored = loadFromStorage();
  const [messages, setMessages] = useState(stored?.messages ?? [WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [leadSaved, setLeadSaved] = useState(stored?.leadSaved ?? false);
  const [escalated, setEscalated] = useState(false);
  const [escalationPhase, setEscalationPhase] = useState(null); // null | 'waiting' | 'ask_wait' | 'ask_contact'
  const [sessionId] = useState(() => stored?.sessionId ?? generateSessionId());
  const bottomRef = useRef(null);
  const escalationTimerRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  useEffect(() => {
    saveToStorage(messages, leadSaved, sessionId);
  }, [messages, leadSaved, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(escalationTimerRef.current);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const deliverMessages = useCallback(async (parts) => {
    for (let idx = 0; idx < parts.length; idx++) {
      setTyping(true);
      await new Promise(r => setTimeout(r, typingDelay(parts[idx])));
      setTyping(false);
      await new Promise(r => setTimeout(r, 80));
      setMessages(prev => [...prev, { role: 'assistant', content: parts[idx] }]);
      if (idx < parts.length - 1) {
        await new Promise(r => setTimeout(r, BETWEEN_MSG_PAUSE()));
      }
    }
  }, []);

  const subscribeToOperatorReply = useCallback((sid) => {
    // Evita doppie sottoscrizioni
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`escalation_${sid}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'escalated_sessions',
        filter: `session_id=eq.${sid}`,
      }, (payload) => {
        const row = payload.new;
        if (row.operator_answer && row.status === 'resolved') {
          clearTimeout(escalationTimerRef.current);
          setEscalated(false);
          setEscalationPhase(null);
          setTyping(false);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: row.operator_answer,
          }]);
          supabase.removeChannel(channel);
          realtimeChannelRef.current = null;
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, []);

  const startEscalationTimer = useCallback((sid) => {
    setEscalationPhase('waiting');

    escalationTimerRef.current = setTimeout(async () => {
      // 2 minuti senza risposta — Luca chiede se aspettare
      setTyping(true);
      await new Promise(r => setTimeout(r, 2000));
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sto ancora verificando — preferisce aspettare ancora qualche minuto o le conviene lasciarmi un recapito così la ricontattiamo appena possibile?',
      }]);
      setEscalationPhase('ask_wait');
    }, ESCALATION_TIMEOUT_MS);

    subscribeToOperatorReply(sid);
  }, [subscribeToOperatorReply]);

  const handleEscalationChoice = useCallback(async (choice) => {
    if (choice === 'wait') {
      // Ricomincia il timer
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
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
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
    if (!text.trim() || typing || escalated) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    await new Promise(r => setTimeout(r, READ_DELAY()));
    setTyping(true);

    try {
      const apiMessages = newMessages.slice(1);
      const data = await chatService.send(apiMessages, sessionId);

      if (data.leadSaved && !leadSaved) {
        setLeadSaved(true);
      }

      if (data.escalated) {
        setEscalated(true);
        setTyping(false);
        await deliverMessages(data.reply);
        // Avvia i pallini di attesa e il timer
        setTyping(true);
        startEscalationTimer(data.session_id || sessionId);
        return;
      }

      setTyping(false);

      if (Array.isArray(data.reply) && data.reply.length > 0) {
        await deliverMessages(data.reply);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Posso ricontattarLa tra poco — mi lascia un recapito? Grazie.',
      }]);
    }
  }, [messages, typing, escalated, leadSaved, sessionId, deliverMessages, startEscalationTimer]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTimeout(escalationTimerRef.current);
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    setMessages([WELCOME]);
    setInput('');
    setTyping(false);
    setLeadSaved(false);
    setEscalated(false);
    setEscalationPhase(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    typing,
    leadSaved,
    escalated,
    escalationPhase,
    bottomRef,
    sendMessage,
    handleEscalationChoice,
    saveContact,
    reset,
  };
}
