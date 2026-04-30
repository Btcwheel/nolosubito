import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsService } from "@/services/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

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

export default function CmsNews() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["cms-posts"],
    queryFn: () => postsService.list({ onlyPublished: false }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing === "new"
      ? postsService.create(data)
      : postsService.update(editing.id, data),
    onSuccess: () => {
      qc.invalidateQueries(["cms-posts"]);
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
                  <Input value={form.cover_image_url} onChange={e => set("cover_image_url", e.target.value)} className="mt-1" placeholder="https://images.unsplash.com/..." />
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