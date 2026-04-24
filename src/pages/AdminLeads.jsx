import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "@/services/leads";
import { praticheService } from "@/services/pratiche";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, ArrowRight, X, Loader2, Mail, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_STYLES = {
  "Nuovo":             "bg-blue-100 text-blue-700",
  "Contattato":        "bg-amber-100 text-amber-700",
  "Convertito":        "bg-green-100 text-green-700",
  "Non qualificato":   "bg-gray-100 text-gray-500",
};

const ALL_STATUSES = ["Nuovo", "Contattato", "Convertito", "Non qualificato"];

// ── Modal conversione lead → pratica ─────────────────────────────────────────

function ConvertModal({ lead, onClose, onConverted }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    cliente_nome:    lead.nome?.split(" ")[0] || "",
    cliente_cognome: lead.nome?.split(" ").slice(1).join(" ") || "",
    cliente_email:   lead.email || "",
    cliente_telefono:lead.telefono || "",
    cliente_tipo:    lead.tipo_cliente || "Privato",
    veicolo_marca:   "",
    veicolo_modello: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.cliente_email) {
      toast({ title: "Email obbligatoria", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await praticheService.create(form);
      await leadsService.updateStatus(lead.id, "Convertito");
      toast({ title: "Pratica creata", description: `Cliente: ${form.cliente_email}` });
      onConverted();
      onClose();
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-heading font-semibold text-lg">Converti in Pratica</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Crea una nuova pratica dal lead</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Nome</Label>
              <Input value={form.cliente_nome} onChange={e => set("cliente_nome", e.target.value)} placeholder="Mario" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Cognome</Label>
              <Input value={form.cliente_cognome} onChange={e => set("cliente_cognome", e.target.value)} placeholder="Rossi" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Email *</Label>
            <Input type="email" value={form.cliente_email} onChange={e => set("cliente_email", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Telefono</Label>
              <Input value={form.cliente_telefono} onChange={e => set("cliente_telefono", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Tipo cliente</Label>
              <Select value={form.cliente_tipo} onValueChange={v => set("cliente_tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Privato", "P.IVA", "Azienda"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Marca veicolo</Label>
              <Input value={form.veicolo_marca} onChange={e => set("veicolo_marca", e.target.value)} placeholder="BMW" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Modello veicolo</Label>
              <Input value={form.veicolo_modello} onChange={e => set("veicolo_modello", e.target.value)} placeholder="Serie 3" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-electric hover:bg-electric/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Crea Pratica
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("tutti");
  const [convertLead, setConvert]   = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => leadsService.list(),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => leadsService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
    onError: () => toast({ title: "Errore aggiornamento", variant: "destructive" }),
  });

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      l.nome?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.telefono?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "tutti" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length; return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-16 px-4 pt-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground">Lead</h1>
          <p className="text-muted-foreground mt-1 text-sm">Richieste di preventivo dal sito — {leads.length} totali</p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          {ALL_STATUSES.map(s => (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === s ? "border-electric bg-electric/10 text-electric" : "border-border bg-card text-muted-foreground hover:border-electric/50"
            }`}
              onClick={() => setFilter(filterStatus === s ? "tutti" : s)}
            >
              <span>{s}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[s]}`}>{counts[s]}</span>
            </div>
          ))}
        </div>

        {/* Filtro ricerca */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca nome, email…" className="pl-9" />
          </div>
          {filterStatus !== "tutti" && (
            <Button variant="outline" size="sm" onClick={() => setFilter("tutti")} className="gap-1">
              <X className="w-3.5 h-3.5" /> Rimuovi filtro
            </Button>
          )}
        </div>

        {/* Lista */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Nessun lead trovato.</div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(lead => (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-navy" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{lead.nome || <span className="text-muted-foreground italic">Senza nome</span>}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {lead.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />{lead.email}
                        </span>
                      )}
                      {lead.telefono && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{lead.telefono}
                        </span>
                      )}
                      {lead.tipo_cliente && (
                        <span className="text-xs text-muted-foreground">{lead.tipo_cliente}</span>
                      )}
                    </div>
                    {lead.interesse && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate max-w-md">{lead.interesse}</p>
                    )}
                  </div>

                  {/* Data */}
                  <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {format(new Date(lead.created_at), "d MMM yyyy", { locale: it })}
                  </div>

                  {/* Status select */}
                  <Select
                    value={lead.status}
                    onValueChange={val => changeStatus.mutate({ id: lead.id, status: val })}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {/* Converti */}
                  {lead.status !== "Convertito" && (
                    <Button size="sm" variant="outline" onClick={() => setConvert(lead)}
                      className="h-8 text-xs gap-1 shrink-0">
                      <Plus className="w-3.5 h-3.5" /> Pratica
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {convertLead && (
        <ConvertModal
          lead={convertLead}
          onClose={() => setConvert(null)}
          onConverted={() => qc.invalidateQueries({ queryKey: ["admin-leads"] })}
        />
      )}
    </div>
  );
}
