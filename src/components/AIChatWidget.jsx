import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Ritardo realistico: simula una persona che scrive sul telefono
function typingDelay(text) {
  const base = text.length * 72;
  const jitter = Math.random() * 600 - 300; // ±300ms variazione casuale
  return Math.min(Math.max(base + jitter, 2800), 5500);
}

const BETWEEN_MSG_PAUSE = () => 1200 + Math.random() * 800; // 1.2-2s tra un msg e l'altro
const READ_DELAY = () => 1500 + Math.random() * 1500; // 1.5-3s per "leggere" il messaggio

// Avatar umano di Luca
const LucaAvatar = ({ size = "sm" }) => (
  <div className={`rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm ${size === "sm" ? "w-7 h-7" : "w-9 h-9"}`}>
    <span className={`font-bold text-white ${size === "sm" ? "text-[11px]" : "text-sm"}`}>L</span>
  </div>
);

// ── Groq config ────────────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Sei Luca, consulente di Nolosubito. Parli con i clienti via chat come faresti su WhatsApp — naturale, diretto, umano. Non sei un bot.

COSA FAI:
Aiuti a trovare un'auto nuova con un fisso mensile tutto incluso (assicurazione, bollo, manutenzione). Il cliente pensa solo alla benzina.

INFORMAZIONI:
- Auto disponibili (3 anni, zero anticipo): SUV ~399€/mese, berlina ~449€/mese, city car ~249€/mese, elettrica ~349€/mese, furgone ~329€/mese
- I km si personalizzano: 10k/15k/20k/30k anno — meno km costa meno
- Durate: 2, 3, 4 o 5 anni
- L'auto non diventa di proprietà — si restituisce a fine contratto
- Con P.IVA ci sono vantaggi fiscali (non entrare in dettagli a meno che non chiedano)
- Verifica preventiva gratuita, senza impegno, risposta in 24-48 ore

TONO E STILE — LA COSA PIÙ IMPORTANTE:
- Scrivi ESATTAMENTE come un collega scrive su WhatsApp. Frasi corte. Parole semplici.
- Usa "allora", "guarda", "sì certo", "dipende", "nel senso", "tipo"
- MAI finire con "Vuoi sapere X?" o "Posso aiutarti con Y?" — suona da bot, non farlo mai
- MAI elencare prezzi come un menu — citane al massimo uno in modo naturale nella frase
- Non ripetere le stesse strutture di frase, varia
- Rispondi solo a quello che viene chiesto, non aggiungere tutto quello che sai
- Se non sai qualcosa: "te lo faccio verificare"
- Quando hai capito le esigenze, chiedi nome e numero per far richiamare un collega
- Appena hai nome E telefono → chiama save_lead immediatamente

SEPARAZIONE MESSAGGI:
Manda più messaggi corti invece di uno lungo, separati da ||
Scrivi come se mandassi più whatsapp di fila, ognuno con un pensiero.
Es: "Sì, la e-208 ce l'abbiamo 👍 || Con 10.000 km anno viene un po' meno di 349 || Stai pensando a 2 o 3 anni?"
Se la risposta è una sola frase, NON usare ||`;

const SAVE_LEAD_TOOL = {
  type: "function",
  function: {
    name: "save_lead",
    description: "Salva i dati del cliente nel CRM quando hai raccolto nome e numero di telefono",
    parameters: {
      type: "object",
      properties: {
        nome:         { type: "string",  description: "Nome e cognome del cliente" },
        telefono:     { type: "string",  description: "Numero di telefono" },
        tipo_cliente: { type: "string",  enum: ["privato", "piva", "azienda", "non specificato"] },
        interesse:    { type: "string",  description: "Tipo di veicolo, durata, km e altre esigenze emerse" },
        email:        { type: "string",  description: "Email se fornita, altrimenti stringa vuota" },
      },
      required: ["nome", "telefono", "tipo_cliente", "interesse"],
    },
  },
};

// ── Salva lead su Supabase ─────────────────────────────────────────────────────
async function saveLead({ nome, telefono, tipo_cliente, interesse, email }, chatHistory) {
  const { error } = await supabase.from("leads").insert({
    nome,
    telefono,
    email:        email || null,
    tipo_cliente: tipo_cliente === "piva" ? "P.IVA" : tipo_cliente === "azienda" ? "Azienda" : "Privato",
    interesse,
    source:       "ai_chat_widget",
    status:       "Nuovo",
    chat_history: chatHistory,
  });
  if (error) console.error("Errore salvataggio lead:", error);
}

// ── Chiama Groq API ────────────────────────────────────────────────────────────
async function callGroq(messages) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      tools:       [SAVE_LEAD_TOOL],
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens:  512,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  return res.json();
}

// ── Messaggio iniziale ─────────────────────────────────────────────────────────
const WELCOME = {
  role: "assistant",
  content: "Salve! Sono Luca di Nolosubito, sono a tua disposizione per aiutarti a trovare quello di cui hai bisogno. 😊",
};

// ── Componente ─────────────────────────────────────────────────────────────────
export default function AIChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([WELCOME]);
  const [input, setInput]         = useState("");
  const [typing, setTyping]       = useState(false); // "Luca sta scrivendo..."
  const [leadSaved, setLeadSaved] = useState(false);
  const [unread, setUnread]       = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input all'apertura
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(false);
    }
  }, [open]);

  // Tooltip unread dopo 8s se chiuso
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setUnread(true), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  // Invia una sequenza di messaggi con puntini tra l'uno e l'altro
  const deliverMessages = useCallback(async (parts) => {
    for (let idx = 0; idx < parts.length; idx++) {
      setTyping(true);
      await new Promise(r => setTimeout(r, typingDelay(parts[idx])));
      setTyping(false);
      // Piccola pausa dopo che i dots scompaiono, prima che il messaggio appaia
      await new Promise(r => setTimeout(r, 80));
      setMessages(prev => [...prev, { role: "assistant", content: parts[idx] }]);
      // Pausa tra un messaggio e il successivo (non dopo l'ultimo)
      if (idx < parts.length - 1) {
        await new Promise(r => setTimeout(r, BETWEEN_MSG_PAUSE()));
      }
    }
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Simula il consulente che legge il messaggio prima di rispondere
    await new Promise(r => setTimeout(r, READ_DELAY()));
    setTyping(true);

    try {
      const apiMessages = newMessages.slice(1); // escludi il welcome dal contesto API
      const data = await callGroq(apiMessages);
      const choice = data.choices[0];

      // Gestione tool call (save_lead)
      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0];
        if (toolCall.function.name === "save_lead" && !leadSaved) {
          const args = JSON.parse(toolCall.function.arguments);
          await saveLead(args, apiMessages);
          setLeadSaved(true);

          const toolResult = { role: "tool", tool_call_id: toolCall.id, content: "Lead salvato con successo" };
          const followUp = await callGroq([...apiMessages, choice.message, toolResult]);
          const parts = followUp.choices[0].message.content.split("||").map(s => s.trim()).filter(Boolean);
          setTyping(false);
          await deliverMessages(parts);
        }
      } else {
        const parts = choice.message.content.split("||").map(s => s.trim()).filter(Boolean);
        setTyping(false);
        await deliverMessages(parts);
      }
    } catch (err) {
      console.error(err);
      setTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Mi dispiace, si è verificato un errore. Riprova!" }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-[340px] sm:w-[380px] bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="bg-navy px-4 py-3.5 flex items-center gap-3 shrink-0">
              <img
                src="/logo-bianco.png"
                alt="Nolosubito"
                className="h-6 w-auto object-contain shrink-0"
                onError={e => e.target.style.display = "none"}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-none">Assistente Nolosubito</p>
                <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Online — risposta immediata
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
              {messages.map((msg, i) => (
                msg.role === "user" ? (
                  <div key={i} className="flex gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-electric/15 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-electric" />
                    </div>
                    <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-electric text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <div className="shrink-0 mt-0.5">
                      <LucaAvatar size="sm" />
                    </div>
                    <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-muted/60 text-foreground border border-border/40 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                )
              ))}

              {/* Puntini typing */}
              {typing && (
                <div className="flex gap-2.5 items-end">
                  <div className="shrink-0">
                    <LucaAvatar size="sm" />
                  </div>
                  <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Lead saved confirmation */}
              {leadSaved && (
                <div className="mx-auto text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Dati salvati — un consulente ti contatterà presto
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
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
                  style={{ minHeight: "42px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || typing}
                  className="w-10 h-10 rounded-xl bg-electric disabled:bg-muted flex items-center justify-center text-white transition-all hover:bg-electric/90 active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {typing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                Powered by Nolosubito · I tuoi dati sono al sicuro
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unread tooltip ── */}
      <AnimatePresence>
        {!open && unread && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            className="bg-white rounded-2xl shadow-xl border border-border/50 p-3.5 max-w-[220px] relative cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <button
              onClick={e => { e.stopPropagation(); setUnread(false); }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-sm font-semibold text-foreground pr-4">Hai domande sul Noleggio Lungo Termine?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Il nostro consulente risponde subito!</p>
            <div className="absolute -bottom-2 right-7 w-4 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white border-r border-b border-border/50 rotate-45 translate-y-[-50%] translate-x-[2px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB button ── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-navy shadow-lg shadow-navy/30 flex items-center justify-center cursor-pointer relative"
        aria-label="Apri assistente AI"
      >
        {/* Pulse quando chiuso */}
        {!open && (
          <motion.div
            className="absolute inset-0 rounded-full bg-electric"
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
          />
        )}
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
