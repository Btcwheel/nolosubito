import { useState, useRef, useCallback } from 'react';
import { chatService } from '@/services/chat';

const WELCOME = {
  role: 'assistant',
  content: 'Salve! Sono Luca, consulente NLT di Nolosubito. Sono qui per aiutarti a trovare il veicolo giusto per te. Hai già in mente qualcosa o preferisci farmi qualche domanda sul noleggio a lungo termine?',
};

function typingDelay(text) {
  const base = text.length * 72;
  const jitter = Math.random() * 600 - 300;
  return Math.min(Math.max(base + jitter, 2800), 5500);
}

const BETWEEN_MSG_PAUSE = () => 1200 + Math.random() * 800;
const READ_DELAY = () => 1500 + Math.random() * 1500;

export default function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const bottomRef = useRef(null);

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

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || typing) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    await new Promise(r => setTimeout(r, READ_DELAY()));
    setTyping(true);

    try {
      const apiMessages = newMessages.slice(1);
      const data = await chatService.send(apiMessages);

      if (data.leadSaved && !leadSaved) {
        setLeadSaved(true);
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
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
      }]);
    }
  }, [messages, typing, leadSaved, deliverMessages]);

  const reset = useCallback(() => {
    setMessages([WELCOME]);
    setInput('');
    setTyping(false);
    setLeadSaved(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    typing,
    leadSaved,
    bottomRef,
    sendMessage,
    reset,
  };
}
