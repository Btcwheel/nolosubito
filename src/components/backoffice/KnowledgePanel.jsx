import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Trash2, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

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

export default function KnowledgePanel({ currentUserId }) {
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
    <div className="space-y-4">
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
