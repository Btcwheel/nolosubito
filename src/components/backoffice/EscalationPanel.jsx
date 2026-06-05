import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { chatService } from '@/services/chat';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageSquare, Clock, CheckCircle2, Send, BookOpen, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const STATUS_LABELS = {
  waiting: { label: 'In attesa', color: 'bg-amber-100 text-amber-800' },
  operator_joined: { label: 'Preso in carico', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Risolto', color: 'bg-green-100 text-green-800' },
  contact_left: { label: 'Recapito lasciato', color: 'bg-purple-100 text-purple-800' },
};

function useNotificationSound() {
  const audioCtx = useRef(null);

  const play = () => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new AudioContext();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  return play;
}

function useElapsed(startedAt) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(i);
  }, []);
  if (!startedAt) return 0;
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000 / 60);
}

function OperatorChat({ session, currentUserId, onClose, onKbSaved }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [saveToKb, setSaveToKb] = useState(true);
  const [kbTitle, setKbTitle] = useState('');
  const bottomRef = useRef(null);
  const { toast } = useToast();

  const sessionId = session.session_id;

  // Carica messaggi iniziali + sottoscrivi realtime
  useEffect(() => {
    let active = true;

    async function load() {
      const data = await chatService.listOperatorMessages(sessionId);
      if (active) {
        setMessages(data);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel(`op_chat_${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'operator_chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const { error } = await chatService.sendOperatorMessage(sessionId, text, currentUserId);
    if (error) {
      toast({ title: 'Errore invio', description: error.message, variant: 'destructive' });
      setInput(text);
    }
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function closeConversation() {
    // Componi contenuto per KB
    const transcript = messages
      .map(m => `${m.sender === 'operator' ? 'OPERATORE' : 'CLIENTE'}: ${m.content}`)
      .join('\n\n');
    const kbContent = `DOMANDA INIZIALE: ${session.user_question}\n\nCONVERSAZIONE:\n${transcript}`;

    await chatService.closeEscalation(sessionId, {
      saveToKb,
      kbContent: saveToKb ? kbContent : null,
      kbTitle: saveToKb ? (kbTitle || `Escalation: ${session.user_question.slice(0, 60)}`) : null,
    });

    toast({
      title: saveToKb ? 'Conversazione salvata in KB' : 'Conversazione chiusa',
      description: saveToKb ? 'Luca imparerà da questa conversazione.' : 'La chat è stata chiusa.',
    });

    setShowCloseDialog(false);
    onKbSaved?.();
    onClose?.(session.id);
  }

  return (
    <div className="bg-card border-2 border-electric/40 rounded-xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/30 bg-muted/30 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug truncate">{session.user_question}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="size-3" />
            {format(new Date(session.created_at), "HH:mm", { locale: it })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCloseDialog(true)} className="shrink-0">
          <CheckCircle2 className="size-3.5 mr-1.5" />
          Chiudi
        </Button>
      </div>

      {session.contact_name && (
        <div className="bg-muted/40 px-4 py-2 text-xs space-y-0.5 shrink-0">
          <p className="font-medium text-foreground">{session.contact_name}</p>
          {session.contact_phone && <p className="text-muted-foreground">{session.contact_phone}</p>}
          {session.contact_email && <p className="text-muted-foreground">{session.contact_email}</p>}
        </div>
      )}

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background">
        {loading && (
          <div className="text-center text-xs text-muted-foreground py-4">Caricamento...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-4">
            <MessageSquare className="size-6 mx-auto mb-2 text-muted-foreground/40" />
            Inizia tu la conversazione con il cliente
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'operator' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              m.sender === 'operator'
                ? 'bg-electric text-white rounded-tr-sm'
                : 'bg-muted/60 border border-border/40 text-foreground rounded-tl-sm'
            }`}>
              {m.content}
              <p className={`text-[10px] mt-1 ${m.sender === 'operator' ? 'text-white/60' : 'text-muted-foreground/60'}`}>
                {format(new Date(m.created_at), 'HH:mm', { locale: it })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border/30 bg-background shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Scrivi una risposta al cliente..."
            rows={2}
            className="text-sm resize-none"
            disabled={sending}
          />
          <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="h-9 w-9 shrink-0">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Dialog chiusura */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCloseDialog(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">Chiudi conversazione</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Hai concluso la conversazione con il cliente. Vuoi salvare questa conversazione nella knowledge base di Luca?
            </p>
            <label className="flex items-start gap-2 p-3 rounded-xl border border-electric/30 bg-electric/5 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={saveToKb}
                onChange={e => setSaveToKb(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  Salva nella knowledge base di Luca
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Luca userà questa conversazione per rispondere in futuro a domande simili.
                </p>
              </div>
            </label>
            {saveToKb && (
              <Input
                value={kbTitle}
                onChange={e => setKbTitle(e.target.value)}
                placeholder="Titolo (opzionale, es. 'Info recesso anticipato')"
                className="mb-4 text-sm"
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCloseDialog(false)} className="flex-1">
                Annulla
              </Button>
              <Button onClick={closeConversation} className="flex-1">
                <CheckCircle2 className="size-4 mr-1.5" />
                Chiudi e {saveToKb ? 'salva' : 'fine'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, className }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-electric/50 ${className || ''}`}
    />
  );
}

function EscalationCard({ session, onTake, currentUserId, takenSessionId, onKbSaved }) {
  const elapsed = useElapsed(session.created_at);
  const st = STATUS_LABELS[session.status] ?? STATUS_LABELS.waiting;
  const isTakenByMe = takenSessionId === session.id;

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-2 ${isTakenByMe ? 'border-electric/50 ring-1 ring-electric/30' : 'border-border/50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{session.user_question}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="size-3" />
            {elapsed < 1 ? 'Adesso' : `${elapsed} min fa`} · {format(new Date(session.created_at), "HH:mm", { locale: it })}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
          {st.label}
        </span>
      </div>

      {session.contact_name && (
        <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs space-y-0.5">
          <p className="font-medium text-foreground">{session.contact_name}</p>
          {session.contact_phone && <p className="text-muted-foreground">{session.contact_phone}</p>}
          {session.contact_email && <p className="text-muted-foreground">{session.contact_email}</p>}
        </div>
      )}

      {canTake(session.status) && !isTakenByMe && (
        <Button size="sm" onClick={() => onTake(session)} className="w-full">
          Prendi in carico e rispondi
        </Button>
      )}
    </div>
  );
}

function canTake(status) {
  return status === 'waiting';
}

export default function EscalationPanel({ currentUserId }) {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('active');
  const [activeSession, setActiveSession] = useState(null);
  const playSound = useNotificationSound();
  const prevCountRef = useRef(0);

  async function fetchSessions() {
    const query = supabase
      .from('escalated_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query.in('status', ['waiting', 'operator_joined', 'contact_left']);
    }

    const { data } = await query;
    if (data) {
      const waitingCount = data.filter(s => s.status === 'waiting').length;
      if (waitingCount > prevCountRef.current) {
        playSound();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Luca ha bisogno di aiuto', {
            body: data.find(s => s.status === 'waiting')?.user_question ?? '',
            icon: '/favicon.ico',
          });
        }
      }
      prevCountRef.current = waitingCount;
      setSessions(data);
    }
  }

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchSessions();

    const channel = supabase
      .channel('escalation_panel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'escalated_sessions',
      }, () => fetchSessions())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [filter]);

  async function handleTake(session) {
    await supabase
      .from('escalated_sessions')
      .update({
        operator_id: currentUserId,
        status: 'operator_joined',
        taken_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    // Ricarica per avere i dati freschi
    const { data } = await supabase
      .from('escalated_sessions')
      .select('*')
      .eq('id', session.id)
      .single();

    if (data) {
      setActiveSession(data);
    }
    fetchSessions();
  }

  async function handleKbSaved() {
    setActiveSession(null);
    fetchSessions();
  }

  const waiting = sessions.filter(s => s.status === 'waiting');
  const active = sessions.filter(s => s.status === 'operator_joined');
  const resolved = sessions.filter(s => s.status === 'resolved' || s.status === 'contact_left');

  return (
    <div className="space-y-4">
      {activeSession ? (
        <OperatorChat
          session={activeSession}
          currentUserId={currentUserId}
          onClose={handleKbSaved}
          onKbSaved={handleKbSaved}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Chat in escalation</h2>
              <p className="text-xs text-muted-foreground">Sessioni dove Luca ha chiesto aiuto</p>
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setFilter('active')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === 'active'
                    ? 'bg-electric text-white border-electric'
                    : 'border-border/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                Attive
              </button>
              <button type="button"
                onClick={() => setFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === 'all'
                    ? 'bg-electric text-white border-electric'
                    : 'border-border/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                Tutte
              </button>
            </div>
          </div>

          {waiting.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                In attesa di risposta ({waiting.length})
              </p>
              {waiting.map(s => (
                <EscalationCard
                  key={s.id}
                  session={s}
                  onTake={handleTake}
                  currentUserId={currentUserId}
                  takenSessionId={activeSession?.id}
                />
              ))}
            </div>
          )}

          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                In gestione ({active.length})
              </p>
              {active.map(s => (
                <EscalationCard
                  key={s.id}
                  session={s}
                  onTake={handleTake}
                  currentUserId={currentUserId}
                  takenSessionId={activeSession?.id}
                />
              ))}
            </div>
          )}

          {filter === 'all' && resolved.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                Risolte ({resolved.length})
              </p>
              {resolved.map(s => (
                <EscalationCard
                  key={s.id}
                  session={s}
                  onTake={handleTake}
                  currentUserId={currentUserId}
                  takenSessionId={activeSession?.id}
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="size-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm">Nessuna chat in escalation</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
