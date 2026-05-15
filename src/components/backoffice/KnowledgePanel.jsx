import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Trash2, CheckCircle2, FileText, ChevronDown, ChevronUp, Send, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const CHAT_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
const TRAINING_SESSION_ID = 'training_backoffice';

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function TrainingChat({ currentUserId, onKbUpdated }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono Luca. Fammi delle domande sulla contrattualistica per verificare cosa so — se sbaglio, correggimi e imparo subito.', feedback: null }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [correcting, setCorrecting] = useState(null); // indice messaggio in correzione
  const [correction, setCorrection] = useState('');
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, correcting]);

  async function sendMessage() {
    if (!input.trim() || typing) return;
    const text = input.trim();
    setInput('');

    const userMsg = { role: 'user', content: text, feedback: null };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTyping(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content })).slice(1);
      const res = await fetch(CHAT_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, session_id: TRAINING_SESSION_ID }),
      });
      const data = await res.json();
      const reply = Array.isArray(data.reply) ? data.reply.join('\n\n') : (data.reply || '...');
      setMessages(prev => [...prev, { role: 'assistant', content: reply, feedback: null }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore nella risposta.', feedback: null }]);
    } finally {
      setTyping(false);
    }
  }

  function markCorrect(idx) {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedback: 'correct' } : m));
    setCorrecting(null);
  }

  function startCorrect(idx) {
    setCorrecting(idx);
    setCorrection('');
  }

  async function saveCorrection(idx) {
    if (!correction.trim()) return;
    setSaving(true);

    const question = messages[idx - 1]?.content ?? '';
    const wrongAnswer = messages[idx]?.content ?? '';
    const docContent = `Domanda: ${question}\n\nRisposta corretta: ${correction.trim()}\n\nRisposta precedente di Luca (errata): ${wrongAnswer}`;

    const { data: doc } = await supabase.from('knowledge_documents').insert({
      title: `Correzione: ${question.slice(0, 60)}`,
      content: docContent,
      source: 'operator_answer',
      created_by: currentUserId,
    }).select().single();

    if (doc) {
      await supabase.from('knowledge_chunks').insert({
        document_id: doc.id,
        content: docContent,
        metadata: { type: 'correction' },
      });
    }

    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedback: 'corrected', correctedTo: correction.trim() } : m));
    setCorrecting(null);
    setCorrection('');
    setSaving(false);
    toast({ title: 'Correzione salvata. Luca imparerà per la prossima volta.' });
    onKbUpdated?.();
  }

  function reset() {
    setMessages([{
      role: 'assistant',
      content: 'Ciao! Sono Luca. Fammi delle domande sulla contrattualistica per verificare cosa so — se sbaglio, correggimi e imparo subito.',
      feedback: null,
    }]);
    setCorrecting(null);
    setCorrection('');
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20 shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">Chat di addestramento con Luca</p>
          <p className="text-xs text-muted-foreground">Testa le risposte e correggi gli errori — ogni correzione viene salvata in KB</p>
        </div>
        <button onClick={reset} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Ricomincia">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-xl px-3 py-2 text-sm max-w-[80%] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-electric/10 text-foreground'
                : msg.feedback === 'corrected'
                  ? 'bg-red-50 border border-red-200 text-foreground'
                  : msg.feedback === 'correct'
                    ? 'bg-green-50 border border-green-200 text-foreground'
                    : 'bg-muted/60 text-foreground'
            }`}>
              {msg.content}
              {msg.feedback === 'corrected' && (
                <p className="text-xs text-green-700 mt-1.5 pt-1.5 border-t border-green-200">
                  ✓ Corretto a: {msg.correctedTo}
                </p>
              )}
            </div>

            {/* Pulsanti feedback solo su risposte di Luca senza feedback ancora */}
            {msg.role === 'assistant' && i > 0 && msg.feedback === null && correcting !== i && (
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => markCorrect(i)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 border border-green-200 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" /> Corretto
                </button>
                <button
                  onClick={() => startCorrect(i)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  <ThumbsDown className="w-3 h-3" /> Correggi
                </button>
              </div>
            )}

            {/* Form correzione */}
            {correcting === i && (
              <div className="mt-2 w-full max-w-[90%] space-y-2">
                <Textarea
                  value={correction}
                  onChange={e => setCorrection(e.target.value)}
                  placeholder="Scrivi la risposta corretta che Luca avrebbe dovuto dare..."
                  rows={3}
                  className="text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveCorrection(i)} disabled={!correction.trim() || saving} className="flex-1">
                    {saving ? 'Salvataggio...' : 'Salva correzione'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCorrecting(null)}>Annulla</Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex items-start">
            <div className="bg-muted/60 rounded-xl">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border/30 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Es: Come funziona il recesso anticipato?"
            disabled={typing}
            className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-electric/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || typing}
            className="w-9 h-9 rounded-xl bg-electric disabled:bg-muted flex items-center justify-center text-white transition-colors hover:bg-electric/90 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function chunkText(text, maxChars = 800) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > maxChars && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text.trim()];
}

function DocumentCard({ doc, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
          <p className="text-xs text-muted-foreground">
            {doc.source === 'operator_answer' ? 'Risposta operatore' : 'Documento manuale'}
            {' · '}
            {new Date(doc.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/30 pt-3">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{doc.content}</p>
        </div>
      )}
    </div>
  );
}

export default function KnowledgePanel({ currentUserId, onKbUpdated }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function fetchDocs() {
    const { data } = await supabase
      .from('knowledge_documents')
      .select('id, title, content, source, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  }

  useEffect(() => { fetchDocs(); }, []);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    const { data: doc, error } = await supabase
      .from('knowledge_documents')
      .insert({
        title: title.trim(),
        content: content.trim(),
        source: 'manual',
        created_by: currentUserId,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Errore nel salvataggio', variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Chunking
    const chunks = chunkText(content.trim());
    if (chunks.length > 0) {
      await supabase.from('knowledge_chunks').insert(
        chunks.map((c, i) => ({
          document_id: doc.id,
          content: c,
          metadata: { index: i, total: chunks.length },
        }))
      );
    }

    toast({ title: `Documento salvato con ${chunks.length} chunk${chunks.length > 1 ? 's' : ''}.` });
    setTitle('');
    setContent('');
    setShowForm(false);
    setSaving(false);
    fetchDocs();
  }

  async function handleDelete(id) {
    await supabase.from('knowledge_documents').update({ is_active: false }).eq('id', id);
    setDocs(prev => prev.filter(d => d.id !== id));
    toast({ title: 'Documento rimosso dalla knowledge base.' });
  }

  return (
    <div className="space-y-6">

      {/* Chat di addestramento */}
      <TrainingChat currentUserId={currentUserId} onKbUpdated={fetchDocs} />

      {/* Documenti KB */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Knowledge Base di Luca</h2>
          <p className="text-xs text-muted-foreground">Documenti e risposte che Luca usa per rispondere</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Aggiungi documento
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-electric/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Nuovo documento</p>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titolo (es. Condizioni di recesso, FAQ prezzi...)"
          />
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Incolla qui il testo del documento. Usa righe vuote per separare i paragrafi — verranno usati come chunk separati."
            rows={10}
            className="text-sm resize-none font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Il testo verrà suddiviso automaticamente in paragrafi di ~800 caratteri.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!title.trim() || !content.trim() || saving} className="flex-1">
              {saving ? 'Salvataggio...' : 'Salva e indicizza'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm">Nessun documento nella knowledge base</p>
          <p className="text-xs mt-1">Aggiungi condizioni contrattuali, FAQ o altri testi per addestrare Luca</p>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{docs.length} document{docs.length === 1 ? 'o' : 'i'} indicizzat{docs.length === 1 ? 'o' : 'i'}</p>
          {docs.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
