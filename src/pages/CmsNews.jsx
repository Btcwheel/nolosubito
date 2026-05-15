import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsService } from "@/services/posts";
import { newsDraftsService } from "@/services/newsDrafts";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Sparkles, RefreshCw, CheckCircle2, XCircle, ExternalLink, FolderOpen, Search } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

// ── Image Picker (archivio locale /gigi/uploads) ──────────────────────────────
function GigiImagePicker({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/gigi-images.json")
      .then(r => r.json())
      .then(data => { setImages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? images.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : images;

  const visible = filtered.slice(0, 120);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <FolderOpen className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm">Archivio immagini Gigi</h3>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per nome file…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-electric"
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} risultati</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Caricamento…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nessuna immagine trovata.</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {visible.map(src => (
                <button
                  key={src}
                  onClick={() => { onSelect(src); onClose(); }}
                  className="aspect-square rounded-lg overflow-hidden border border-border hover:border-electric hover:scale-105 transition-all duration-150 bg-muted"
                  title={src.split('/').pop()}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.style.display='none'; }} />
                </button>
              ))}
            </div>
          )}
          {filtered.length > 120 && (
            <p className="text-center text-xs text-muted-foreground mt-4">Mostrate 120 di {filtered.length}. Affina la ricerca.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ["Notizie","Approfondimenti","Offerte","Green Mobility","Azienda"];

const EMPTY_POST = {
  title: "", slug: "", summary: "", content: "",
  cover_image_url: "", category: "Notizie",
  published_date: new Date().toISOString().slice(0, 16), is_published: true,
};

function slugify(str) {
  return str.toLowerCase()
    .replace(/[àáâä]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');
}

// ── Sezione Bozze AI ─────────────────────────────────────────────────────────

function AiDraftCard({ draft, onAccept, onReject, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {draft.cover_image_url && (
          <img src={draft.cover_image_url} alt="" className="w-28 h-20 object-cover object-center rounded-lg shrink-0" onError={e => e.target.style.display='none'} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">{draft.category}</Badge>
            {draft.source_title && (
              <a href={draft.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="w-3 h-3" /> {draft.source_title}
              </a>
            )}
          </div>
          <p className="font-semibold text-sm text-foreground leading-snug">{draft.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.summary}</p>
        </div>
      </div>

      {expanded && (
        <div className="bg-white rounded-lg border border-violet-100 p-4 text-sm max-h-72 overflow-y-auto prose prose-sm max-w-none">
          <ReactMarkdown>{draft.content}</ReactMarkdown>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2">
          {expanded ? "Nascondi anteprima" : "Leggi anteprima"}
        </button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(draft)} className="h-7 text-xs gap-1">
            <Pencil className="w-3 h-3" /> Modifica
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(draft.id)} className="h-7 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50">
            <XCircle className="w-3 h-3" /> Scarta
          </Button>
          <Button size="sm" onClick={() => onAccept(draft)} className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="w-3 h-3" /> Pubblica
          </Button>
        </div>
      </div>
    </div>
  );
}

function AiDraftsSection({ onEditDraft }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["news-drafts-pending"],
    queryFn: () => newsDraftsService.listPending(),
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (draft) => newsDraftsService.accept(draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news-drafts-pending"] });
      qc.invalidateQueries({ queryKey: ["cms-posts"] });
      toast({ title: "Articolo pubblicato" });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => newsDraftsService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news-drafts-pending"] });
      toast({ title: "Bozza scartata" });
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-news-drafts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const json = await res.json();
      if (json.ok) {
        qc.invalidateQueries({ queryKey: ["news-drafts-pending"] });
        toast({ title: `${json.generated} bozze generate`, description: "Controlla qui sotto." });
      } else {
        toast({ title: "Errore generazione", description: json.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm text-foreground">Bozze AI</h3>
          {drafts.length > 0 && (
            <Badge className="bg-violet-500 text-white text-xs">{drafts.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="h-7 text-xs gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50">
          <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generazione…" : "Genera ora"}
        </Button>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-xl py-6 text-center text-sm text-muted-foreground">
          Nessuna bozza in attesa. Clicca "Genera ora" o attendi il cron delle 08:00.
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(d => (
            <AiDraftCard
              key={d.id}
              draft={d}
              onAccept={(draft) => acceptMutation.mutate(draft)}
              onReject={(id) => rejectMutation.mutate(id)}
              onEdit={onEditDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CmsNews() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["cms-posts"],
    queryFn: () => postsService.list({ onlyPublished: false }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const { _draft_id, ...postData } = data;
      if (editing === "new") {
        await postsService.create(postData);
        // Se viene da una bozza AI, segnala come accettata
        if (_draft_id) await newsDraftsService.reject(_draft_id); // usa reject per rimuoverla dalla coda
      } else {
        await postsService.update(editing.id, postData);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-posts"] });
      qc.invalidateQueries({ queryKey: ["news-drafts-pending"] });
      toast({ title: editing === "new" ? "Articolo creato" : "Articolo aggiornato" });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => postsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["cms-posts"]);
      toast({ title: "Articolo eliminato" });
    },
  });

  const togglePublished = useMutation({
    mutationFn: ({ id, val }) => postsService.update(id, { is_published: val }),
    onSuccess: () => qc.invalidateQueries(["cms-posts"]),
  });

  const openNew = () => {
    setForm({ ...EMPTY_POST, published_date: new Date().toISOString().slice(0, 16) });
    setPreviewMode(false);
    setEditing("new");
  };

  const openEdit = (p) => {
    setForm({ ...p, published_date: p.published_date ? p.published_date.slice(0, 16) : "" });
    setPreviewMode(false);
    setEditing(p);
  };

  // Modifica bozza AI: apre il form precompilato come nuovo post
  const openDraftEdit = (draft) => {
    setForm({
      title: draft.title,
      slug: draft.slug,
      summary: draft.summary,
      content: draft.content,
      cover_image_url: draft.cover_image_url || "",
      category: draft.category || "Notizie",
      published_date: new Date().toISOString().slice(0, 16),
      is_published: true,
      _draft_id: draft.id,
    });
    setPreviewMode(false);
    setEditing("new");
  };

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleTitleChange = (val) => {
    set("title", val);
    if (editing === "new") set("slug", slugify(val));
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      published_date: form.published_date ? new Date(form.published_date).toISOString() : new Date().toISOString(),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-foreground">News & Articoli</h2>
        <Button onClick={openNew} className="bg-electric hover:bg-electric/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuovo Articolo
        </Button>
      </div>

      <AiDraftsSection onEditDraft={openDraftEdit} />

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-lg">{editing === "new" ? "Nuovo Articolo" : "Modifica Articolo"}</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewMode(p => !p)}>
                  {previewMode ? <><EyeOff className="w-3.5 h-3.5 mr-1" /> Modifica</> : <><Eye className="w-3.5 h-3.5 mr-1" /> Anteprima</>}
                </Button>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {previewMode ? (
              <div className="prose max-w-none">
                {form.cover_image_url && <img src={form.cover_image_url} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />}
                <h1 className="text-2xl font-bold">{form.title}</h1>
                <p className="text-muted-foreground">{form.summary}</p>
                <ReactMarkdown>{form.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Titolo *</Label>
                  <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} className="mt-1" placeholder="Titolo dell'articolo" />
                </div>
                <div>
                  <Label className="text-xs">Slug (URL)</Label>
                  <Input value={form.slug} onChange={e => set("slug", e.target.value)} className="mt-1 font-mono text-sm" placeholder="titolo-articolo" />
                </div>
                <div>
                  <Label className="text-xs">Sommario *</Label>
                  <Textarea value={form.summary} onChange={e => set("summary", e.target.value)} className="mt-1 h-20" placeholder="Breve descrizione dell'articolo..." />
                </div>
                <div>
                  <Label className="text-xs">Contenuto (Markdown) *</Label>
                  <Textarea value={form.content} onChange={e => set("content", e.target.value)} className="mt-1 h-56 font-mono text-xs" placeholder="## Titolo sezione&#10;Testo del corpo..." />
                </div>
                <div>
                  <Label className="text-xs">URL Immagine Copertina *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={form.cover_image_url} onChange={e => set("cover_image_url", e.target.value)} placeholder="https://… oppure /gigi/uploads/…" />
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowPicker(true)} className="shrink-0 gap-1.5 text-xs">
                      <FolderOpen className="w-3.5 h-3.5" /> Archivio
                    </Button>
                  </div>
                  {form.cover_image_url && <img src={form.cover_image_url} alt="" className="mt-2 h-28 object-cover rounded-xl border border-border w-full" onError={e => e.target.style.display='none'} />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select value={form.category} onValueChange={v => set("category", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Data Pubblicazione</Label>
                    <Input type="datetime-local" value={form.published_date} onChange={e => set("published_date", e.target.value)} className="mt-1" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_published} onChange={e => set("is_published", e.target.checked)} className="accent-electric" />
                  <span className="text-sm">Visibile sul sito</span>
                </label>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Annulla</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-electric hover:bg-electric/90 text-white">
                <Check className="w-4 h-4 mr-1" /> Salva
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPicker && (
        <GigiImagePicker
          onSelect={(src) => set("cover_image_url", src)}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Nessun articolo. Creane uno nuovo.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {posts.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt="" className="w-16 h-10 object-cover rounded-lg shrink-0" onError={e => e.target.style.display='none'} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{p.title}</span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${p.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_published ? "Pubblicato" : "Bozza"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.category} · {p.published_date ? format(new Date(p.published_date), "d MMM yyyy", { locale: it }) : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => togglePublished.mutate({ id: p.id, val: !p.is_published })}>
                    {p.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}