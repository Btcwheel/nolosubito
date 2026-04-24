import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { materialiService } from "@/services/materiali";
import { profilesService } from "@/services/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Trash2, X, Check, Upload, Loader2,
  FileText, ExternalLink, Users, Globe,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const TIPI = ["Listino", "Canvass", "Offerta a Tempo", "Comunicazione"];

const EMPTY = {
  titolo: "", descrizione: "", tipo: "Listino",
  visibilita: "tutti", expires_at: "", is_active: true,
};

function MaterialeModal({ onClose, onSaved }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm]     = useState(EMPTY);
  const [file, setFile]     = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: agenti = [] } = useQuery({
    queryKey: ["agenti-list"],
    queryFn: () => profilesService.listByRole("agente"),
  });
  const [selectedAgenti, setSelectedAgenti] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleAgente = (id) => setSelectedAgenti(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleSubmit = async () => {
    if (!form.titolo.trim()) { toast({ title: "Titolo obbligatorio", variant: "destructive" }); return; }
    if (!file)               { toast({ title: "Seleziona un file", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const m = await materialiService.create(form, file);
      if (form.visibilita === "selezionati" && selectedAgenti.length) {
        await materialiService.setVisibilita(m.id, selectedAgenti);
      }
      toast({ title: "Materiale caricato" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-lg">Nuovo Materiale</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Titolo *</Label>
            <Input value={form.titolo} onChange={e => set("titolo", e.target.value)} placeholder="Listino Prezzi Q2 2025" />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Descrizione</Label>
            <Textarea value={form.descrizione} onChange={e => set("descrizione", e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPI.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Visibilità</Label>
              <Select value={form.visibilita} onValueChange={v => set("visibilita", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli agenti</SelectItem>
                  <SelectItem value="selezionati">Agenti selezionati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.tipo === "Offerta a Tempo" && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Scadenza</Label>
              <Input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} />
            </div>
          )}

          {form.visibilita === "selezionati" && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Agenti</Label>
              <div className="border border-border rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                {agenti.length === 0
                  ? <p className="text-xs text-muted-foreground">Nessun agente trovato</p>
                  : agenti.map(a => (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedAgenti.includes(a.id)}
                        onChange={() => toggleAgente(a.id)}
                        className="accent-electric"
                      />
                      <span className="text-sm">{a.full_name || a.email}</span>
                    </label>
                  ))
                }
              </div>
            </div>
          )}

          {/* File upload */}
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">File *</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-electric/40 hover:bg-electric/3 transition-colors text-center"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-electric" />
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clicca o trascina il file</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">PDF, DOCX, XLSX, PNG…</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden"
              onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-electric hover:bg-electric/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Carica
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function CmsMateriali() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: materiali = [], isLoading } = useQuery({
    queryKey: ["cms-materiali"],
    queryFn: () => materialiService.listAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, storagePath }) => materialiService.delete(id, storagePath),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-materiali"] });
      toast({ title: "Materiale eliminato" });
    },
    onError: (err) => toast({ title: "Errore", description: err.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Materiali Agenti</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{materiali.length} documenti caricati</p>
        </div>
        <Button onClick={() => setShowModal(true)}
          className="bg-electric hover:bg-electric/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuovo Materiale
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : materiali.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nessun materiale caricato.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {materiali.map(m => {
              const agentiCount = m.materiale_visibilita?.length ?? 0;
              const expired = m.expires_at && new Date(m.expires_at) < new Date();
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{m.titolo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{m.tipo}</span>
                      {m.visibilita === "tutti"
                        ? <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Globe className="w-3 h-3" /> Tutti gli agenti</span>
                        : <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Users className="w-3 h-3" /> {agentiCount} agenti</span>
                      }
                      {m.expires_at && (
                        <span className={`text-xs ${expired ? "text-red-500" : "text-amber-600"}`}>
                          scade {format(new Date(m.expires_at), "d MMM yyyy", { locale: it })}
                        </span>
                      )}
                      {!m.is_active && <span className="text-xs text-muted-foreground/50 italic">disattivo</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {format(new Date(m.created_at), "d MMM yyyy", { locale: it })}
                  </span>
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: m.id, storagePath: m.storage_path })}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <MaterialeModal
          onClose={() => setShowModal(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["cms-materiali"] })}
        />
      )}
    </div>
  );
}
