import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import useChat from '@/hooks/useChat';
import useScrollDirection from '@/hooks/useScrollDirection';

function EscalationChoiceButtons({ onChoice }) {
  return (
    <div className="flex gap-2 mt-1 flex-wrap">
      <button type="button"
        onClick={() => onChoice('wait')}
        className="px-3 py-1.5 text-xs rounded-xl border border-electric/40 text-electric hover:bg-electric/10 transition-colors cursor-pointer"
      >
        Aspetto ancora
      </button>
      <button type="button"
        onClick={() => onChoice('contact')}
        className="px-3 py-1.5 text-xs rounded-xl bg-electric text-white hover:bg-electric/90 transition-colors cursor-pointer"
      >
        Lascio un recapito
      </button>
    </div>
  );
}

function ContactForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || (!phone.trim() && !email.trim())) return;
    onSubmit({ name, phone, email });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome e cognome *"
        className="bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-electric/50"
        required
      />
      <input
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Telefono"
        className="bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-electric/50"
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-electric/50"
      />
      <button
        type="submit"
        disabled={!name.trim() || (!phone.trim() && !email.trim())}
        className="py-2 rounded-xl bg-electric text-white text-sm font-medium hover:bg-electric/90 disabled:bg-muted disabled:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        Invia recapito
      </button>
    </form>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="shrink-0">
        <div className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm size-7">
          <span className="font-bold text-white text-[11px]">L</span>
        </div>
      </div>
      <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="size-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const {
    messages, input, setInput, typing, partialContent, leadSaved, escalated, escalationPhase,
    bottomRef, sendMessage, handleEscalationChoice, saveContact,
  } = useChat();

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);
  const scrollingUp = useScrollDirection();
  const fabVisible = scrollingUp || open;

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, bottomRef]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || typing) return;
    sendMessage(input);
  }, [input, typing, sendMessage]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:z-50 z-[60] pointer-events-none flex flex-col sm:items-end sm:gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto fixed inset-0 z-[60] sm:relative sm:inset-auto sm:w-[380px] h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-6rem)] bg-background sm:border sm:border-border/60 sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/30" />
            </div>
            <div className="bg-navy px-4 py-3.5 flex items-center gap-3 shrink-0">
              <img
                src="/logo-bianco.png"
                alt="Nolosubito"
                width="160"
                height="24"
                className="h-6 w-auto object-contain shrink-0"
                onError={e => e.target.style.display = 'none'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-none">Luca — Consulente NLT</p>
                <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-400 inline-block" />
                  Online — risposta immediata
                </p>
              </div>
              <button type="button"
                onClick={() => setOpen(false)}
                className="p-2 sm:p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                aria-label="Chiudi chat"
              >
                <span className="hidden sm:inline text-xs">Chiudi</span>
                <ChevronDown className="size-5 sm:hidden" />
                <X className="size-4 hidden sm:block" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

              {partialContent && !typing && <ChatMessage message={partialContent} />}

              {typing && <TypingIndicator />}

              {escalationPhase === 'ask_wait' && !typing && (
                <EscalationChoiceButtons onChoice={handleEscalationChoice} />
              )}
              {escalationPhase === 'ask_contact' && !typing && (
                <ContactForm onSubmit={saveContact} />
              )}

              <div ref={bottomRef} />
            </div>

            <div className="px-3 py-3 border-t border-border/40 bg-background shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Scrivi un messaggio…"
                  rows={1}
                  className="flex-1 resize-none bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all max-h-24 leading-relaxed"
                  style={{ minHeight: '42px' }}
                />
                <button type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || typing}
                  className="size-10 rounded-xl bg-electric disabled:bg-muted flex items-center justify-center text-white transition-all hover:bg-electric/90 active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {typing
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Send className="size-4" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                Consulenza Nolosubito · I tuoi dati sono al sicuro
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            className="hidden sm:block pointer-events-auto bg-white rounded-2xl shadow-xl border border-border/50 p-3.5 max-w-[220px] relative cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <button type="button"
              onClick={e => { e.stopPropagation(); setHovered(false); }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Chiudi suggerimento"
            >
              <X className="size-3" />
            </button>
            <p className="text-sm font-semibold text-foreground pr-4">Hai domande sul Noleggio Lungo Termine?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Luca risponde subito!</p>
            <div className="absolute -bottom-2 right-7 w-4 h-2 overflow-hidden">
              <div className="size-3 bg-white border-r border-b border-border/50 rotate-45 translate-y-[-50%] translate-x-[2px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: fabVisible || open ? 0 : 96, opacity: fabVisible || open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="pointer-events-auto fixed bottom-4 right-4 sm:static sm:bottom-auto sm:right-auto z-[55] sm:z-auto"
      >
        <motion.button
          onClick={() => setOpen(v => !v)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="size-14 rounded-full bg-navy shadow-lg shadow-navy/30 flex items-center justify-center cursor-pointer relative"
          aria-label="Apri assistente AI"
        >
          {!open && (
            <motion.div
              className="absolute inset-0 rounded-full bg-electric"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
          <AnimatePresence mode="wait">
            {open
              ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="size-6 text-white" />
                </motion.div>
              )
              : (
                <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <MessageCircle className="size-6 text-white" />
                </motion.div>
              )
            }
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  );
}
