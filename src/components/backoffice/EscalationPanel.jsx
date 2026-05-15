import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageSquare, Clock, CheckCircle2, Send, BookOpen } from 'lucide-react';
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

function ChatHistory({ history }) {
  if (!history?.length) return <p className="text-xs text-muted-foreground italic">Nessuna cronologia disponibile.</p>;
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {history.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-xl px-3 py-1.5 text-xs max-w-[80%] ${
            msg.role === 'user'
              ? 'bg-electric/10 text-foreground'
              : 'bg-muted/60 text-foreground'
          }`}>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}

function EscalationCard({ session, onResolve, currentUserId }) {
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [addToKb, setAddToKb] = useState(false);
  const { toast } = useToast();

  const isMine = session.operator_id === currentUserId;
  const canTake = session.status === 'waiting';
  const canAnswer = session.status === 'operator_joined' && isMine;

  const elapsed = Math.floor((Date.now() - new Date(session.created_at)) / 1000 / 60);

  async function handleTake() {
    setSaving('taking');
    await supabase
      .from('escalated_sessions')
      .update({ operator_id: currentUserId, status: 'operator_joined', taken_at: new Date().toISOString() })
      .eq('id', session.id);
    setSaving('');
  }

  async function handleSend() {
    if (!answer.trim()) return;
    setSaving('sending');

    await supabase
      .from('escalated_sessions')
      .update({
        operator_answer: answer.trim(),
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (addToKb) {
      await supabase.from('knowledge_documents').insert({
        title: `Q: ${session.user_question.slice(0, 60)}`,
        content: `Domanda: ${session.user_question}\n\nRisposta: ${answer.trim()}`,
        source: 'operator_answer',
        created_by: currentUserId,
      });
      toast({ title: 'Risposta aggiunta alla knowledge base di Luca.' });
    }

    setSaving('');
    onResolve(session.id);
  }

  const st = STATUS_LABELS[session.status] ?? STATUS_LABELS.waiting;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{session.user_question}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {elapsed < 1 ? 'Adesso' : `${elapsed} min fa`}
            {' · '}
            {format(new Date(session.created_at), 'HH:mm', { locale: it })}
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

      <button
        onClick={() => setExpanded(v => !v)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <MessageSquare className="w-3 h-3" />
        {expanded ? 'Nascondi chat' : 'Vedi chat completa'}
      </button>

      {expanded && <ChatHistory history={session.chat_history} />}

      {canTake && (
        <Button size="sm" onClick={handleTake} disabled={saving === 'taking'} className="w-full">
          {saving === 'taking' ? 'Attendere...' : 'Prendi in carico'}
        </Button>
      )}

      {canAnswer && (
        <div className="space-y-2">
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Scrivi la risposta per il cliente..."
            rows={3}
            className="text-sm resize-none"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addToKb}
              onChange={e => setAddToKb(e.target.checked)}
              className="rounded"
            />
            <BookOpen className="w-3 h-3" />
            Aggiungi alla knowledge base di Luca
          </label>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!answer.trim() || saving === 'sending'}
            className="w-full"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {saving === 'sending' ? 'Invio...' : 'Invia risposta al cliente'}
          </Button>
        </div>
      )}

      {session.status === 'resolved' && session.operator_answer && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
          {session.operator_answer}
        </div>
      )}
    </div>
  );
}

export default function EscalationPanel({ currentUserId }) {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active' | 'all'
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
    // Richiedi permesso notifiche al primo render
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

  function handleResolve(id) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  const waiting = sessions.filter(s => s.status === 'waiting');
  const active = sessions.filter(s => ['operator_joined', 'contact_left'].includes(s.status));
  const resolved = sessions.filter(s => s.status === 'resolved');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Chat in escalation</h2>
          <p className="text-xs text-muted-foreground">Sessioni dove Luca ha chiesto aiuto</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'active'
                ? 'bg-electric text-white border-electric'
                : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Attive
          </button>
          <button
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
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            In attesa di risposta ({waiting.length})
          </p>
          {waiting.map(s => (
            <EscalationCard key={s.id} session={s} onResolve={handleResolve} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            In gestione ({active.length})
          </p>
          {active.map(s => (
            <EscalationCard key={s.id} session={s} onResolve={handleResolve} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {filter === 'all' && resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
            Risolte ({resolved.length})
          </p>
          {resolved.map(s => (
            <EscalationCard key={s.id} session={s} onResolve={() => {}} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm">Nessuna chat in escalation</p>
        </div>
      )}
    </div>
  );
}
