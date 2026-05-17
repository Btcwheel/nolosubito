import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "@/services/leads";
import { praticheService } from "@/services/pratiche";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search, Plus, ArrowRight, X, Loader2, Mail, Phone, User, Trash2,
  Clock, MessageSquare, Bot, UserCheck, Calendar, ChevronRight,
  Activity, Car, Fuel, Timer, Euro, AlertCircle, CheckCircle2,
  Filter, RotateCcw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

// ── Costanti ──────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  "Nuovo":           "bg-blue-100 text-blue-700 border-blue-200",
  "Contattato":      "bg-amber-100 text-amber-700 border-amber-200",
  "Convertito":      "bg-green-100 text-green-700 border-green-200",
  "Non qualificato": "bg-gray-100 text-gray-500 border-gray-200",
};

const ALL_STATUSES = ["Nuovo", "Contattato", "Convertito", "Non qualificato"];
const CARBURANTI   = ["Benzina", "Diesel", "Ibrido", "Elettrico", "GPL", "Metano"];

const ATTIVITA_META = {
  creazione:            { icon: Plus,         color: "text-blue-500",   bg: "bg-blue-50",   label: "Lead creato" },
  cambio_status:        { icon: Activity,     color: "text-amber-500",  bg: "bg-amber-50",  label: "Status cambiato" },
  contatto_operatore:   { icon: UserCheck,    color: "text-green-500",  bg: "bg-green-50",  label: "Contatto operatore" },
  follow_up_ai:         { icon: Bot,          color: "text-purple-500", bg: "bg-purple-50", label: "Follow-up AI" },
  nota:                 { icon: MessageSquare,color: "text-sky-500",    bg: "bg-sky-50",    label: "Nota" },
  assegnazione:         { icon: UserCheck,    color: "text-indigo-500", bg: "bg-indigo-50", label: "Assegnazione" },
  conversione:          { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  label: "Convertito" },
  follow_up_programmato:{ icon: Calendar,     color: "text-orange-500", bg: "bg-orange-50", label: "Follow-up programmato" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtData(d) {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy", { locale: it });
}

function fmtOra(d) {
  if (!d) return "";
  return format(new Date(d), "HH:mm", { locale: it });
}

function fmtRelativo(d) {
  if (!d) return "";
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: it });
}

// ── Modal conversione ─────────────────────────────────────────────────────────

function ConvertModal({ lead, onClose, onConverted }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    cliente_nome:    lead.nome?.split(" ")[0] || "",
    cliente_cognome: lead.nome?.split(" ").slice(1).join(" ") || "",
    cliente_email:   lead.email || "",
    cliente_telefono:lead.telefono || "",
    cliente_tipo:    lead.tipo_cliente || "Privato",
    veicolo_marca:   lead.pref_marca || "",
    veicolo_modello: lead.pref_modello || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.cliente_email) {
      toast({ title: "Email obbligatoria", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const pratica = await praticheService.create(form);
      await leadsService.updateStatus(lead.id, "Convertito");
      // collega la pratica al lead
      await leadsService.aggiornaPref(lead.id, {});  // no-op, ma triggera updated_at
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
            <div><Label className="text-xs font-semibold mb-1.5 block">Nome</Label>
              <Input value={form.cliente_nome} onChange={e => set("cliente_nome", e.target.value)} /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Cognome</Label>
              <Input value={form.cliente_cognome} onChange={e => set("cliente_cognome", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs font-semibold mb-1.5 block">Email *</Label>
            <Input type="email" value={form.cliente_email} onChange={e => set("cliente_email", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold mb-1.5 block">Telefono</Label>
              <Input value={form.cliente_telefono} onChange={e => set("cliente_telefono", e.target.value)} /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Tipo cliente</Label>
              <Select value={form.cliente_tipo} onValueChange={v => set("cliente_tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Privato","P.IVA","Azienda"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold mb-1.5 block">Marca</Label>
              <Input value={form.veicolo_marca} onChange={e => set("veicolo_marca", e.target.value)} placeholder="BMW" /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Modello</Label>
              <Input value={form.veicolo_modello} onChange={e => set("veicolo_modello", e.target.value)} placeholder="Serie 3" /></div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-electric hover:bg-electric/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Crea Pratica
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline attività ─────────────────────────────────────────────────────────

function Timeline({ leadId }) {
  const { data: attivita = [], isLoading } = useQuery({
    queryKey: ["lead-attivita", leadId],
    queryFn:  () => leadsService.getAttivita(leadId),
    enabled:  !!leadId,
  });

  if (isLoading) return <div className="space-y-2 py-2">{Array(3).fill(0).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (!attivita.length) return <p className="text-xs text-muted-foreground py-4 text-center">Nessuna attività registrata</p>;

  return (
    <div className="relative space-y-3 py-1">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
      {attivita.map(a => {
        const meta = ATTIVITA_META[a.tipo] || ATTIVITA_META.nota;
        const Icon = meta.icon;
        return (
          <div key={a.id} className="flex gap-3 relative">
            <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center shrink-0 z-10 border border-white`}>
              <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{fmtOra(a.created_at)} · {fmtData(a.created_at)}</span>
              </div>
              {a.descrizione && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.descrizione}</p>}
              {a.autore_nome && <p className="text-[10px] text-muted-foreground/60 mt-0.5">da {a.autore_nome} ({a.autore_tipo})</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Drawer dettaglio lead ─────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose, onRefresh }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab]       = useState("timeline");
  const [nota, setNota]     = useState("");
  const [followUp, setFU]   = useState("");
  const [prefs, setPrefs]   = useState({
    pref_marca:       lead.pref_marca || "",
    pref_modello:     lead.pref_modello || "",
    pref_carburante:  lead.pref_carburante || "",
    pref_durata_mesi: lead.pref_durata_mesi || "",
    pref_budget_min:  lead.pref_budget_min || "",
    pref_budget_max:  lead.pref_budget_max || "",
    pref_km_anno:     lead.pref_km_anno || "",
    pref_anticipo:    lead.pref_anticipo || "",
  });
  const [savingNota, setSN]  = useState(false);
  const [savingFU, setSFU]   = useState(false);
  const [savingPref, setSP]  = useState(false);
  const [savingContatto, setSC] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    qc.invalidateQueries({ queryKey: ["lead-attivita", lead.id] });
    onRefresh?.();
  };

  const handleContatto = async () => {
    setSC(true);
    try {
      await leadsService.registraContatto(lead.id, { nota: nota || undefined });
      setNota("");
      toast({ title: "Contatto registrato" });
      invalidate();
    } catch (e) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setSC(false); }
  };

  const handleNota = async () => {
    if (!nota.trim()) return;
    setSN(true);
    try {
      await leadsService.aggiornaNota(lead.id, { nota });
      setNota("");
      toast({ title: "Nota aggiunta" });
      invalidate();
    } catch (e) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setSN(false); }
  };

  const handleFollowUp = async () => {
    if (!followUp) return;
    setSFU(true);
    try {
      await leadsService.programmaFollowUp(lead.id, { data: new Date(followUp).toISOString() });
      setFU("");
      toast({ title: "Follow-up programmato" });
      invalidate();
    } catch (e) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setSFU(false); }
  };

  const handlePrefs = async () => {
    setSP(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(prefs).map(([k, v]) => [k, v === "" ? null : (["pref_durata_mesi","pref_budget_min","pref_budget_max","pref_km_anno","pref_anticipo"].includes(k) ? Number(v) || null : v)])
      );
      await leadsService.aggiornaPref(lead.id, payload);
      toast({ title: "Preferenze salvate" });
      invalidate();
    } catch (e) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setSP(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-5 h-5 text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-foreground truncate">{lead.nome || "Senza nome"}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {lead.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</span>}
              {lead.telefono && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{lead.telefono}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[10px] px-2 py-0.5 border ${STATUS_STYLES[lead.status]}`}>{lead.status}</Badge>
              {lead.tipo_cliente && <Badge variant="outline" className="text-[10px] px-2 py-0.5">{lead.tipo_cliente}</Badge>}
              {lead.contact_attempts > 0 && (
                <span className="text-[10px] text-muted-foreground">{lead.contact_attempts} contatt{lead.contact_attempts === 1 ? "o" : "i"}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Info rapide */}
        <div className="grid grid-cols-2 gap-px bg-border/30 border-b border-border/30">
          {[
            { label: "Creato",       value: fmtData(lead.created_at) },
            { label: "Ult. contatto",value: lead.last_contacted_at ? fmtRelativo(lead.last_contacted_at) : "Mai" },
            { label: "Follow-up",    value: lead.follow_up_at ? fmtData(lead.follow_up_at) : "—" },
            { label: "Fonte",        value: lead.source || "chat" },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-2.5 bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {[
            { id: "timeline",   label: "Attività" },
            { id: "azioni",     label: "Azioni" },
            { id: "preferenze", label: "Preferenze" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === t.id ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenuto tab */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Timeline ── */}
          {tab === "timeline" && (
            <div>
              {/* Chat history dell'AI */}
              {Array.isArray(lead.chat_history) && lead.chat_history.length > 0 && (
                <details className="mb-4">
                  <summary className="text-xs font-semibold text-muted-foreground cursor-pointer mb-2 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> Chat AI ({lead.chat_history.length} messaggi)
                  </summary>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {lead.chat_history.map((m, i) => (
                      <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg ${m.role === "user" ? "bg-muted/60 text-foreground" : "bg-purple-50 text-purple-900"}`}>
                        <span className="font-semibold mr-1">{m.role === "user" ? "Cliente" : "AI"}:</span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <Timeline leadId={lead.id} />
            </div>
          )}

          {/* ── Azioni ── */}
          {tab === "azioni" && (
            <div className="space-y-5">
              {/* Registra contatto */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-green-500" /> Registra contatto</p>
                <Textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Note sul contatto (opzionale)…"
                  className="text-xs min-h-[60px] resize-none"
                />
                <Button onClick={handleContatto} disabled={savingContatto} size="sm" className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                  {savingContatto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  Segna come Contattato
                </Button>
              </div>

              {/* Aggiungi nota */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-sky-500" /> Aggiungi nota</p>
                <Textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Scrivi una nota interna…"
                  className="text-xs min-h-[60px] resize-none"
                />
                <Button onClick={handleNota} disabled={savingNota || !nota.trim()} size="sm" variant="outline" className="w-full gap-2">
                  {savingNota ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  Salva nota
                </Button>
              </div>

              {/* Programma follow-up */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-500" /> Programma follow-up</p>
                <Input
                  type="datetime-local"
                  value={followUp}
                  onChange={e => setFU(e.target.value)}
                  className="text-xs"
                />
                <Button onClick={handleFollowUp} disabled={savingFU || !followUp} size="sm" variant="outline" className="w-full gap-2">
                  {savingFU ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  Programma
                </Button>
              </div>
            </div>
          )}

          {/* ── Preferenze ── */}
          {tab === "preferenze" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Dati estratti dalla chat o inseriti manualmente. Usati per segmentare e filtrare i lead.</p>

              {/* Interesse testuale originale */}
              {lead.interesse && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Testo originale (AI)</p>
                  <p className="text-xs text-foreground">{lead.interesse}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1"><Car className="w-3 h-3" /> Marca</Label>
                  <Input value={prefs.pref_marca} onChange={e => setPrefs(p => ({...p, pref_marca: e.target.value}))} placeholder="es. BMW" className="text-xs" /></div>
                <div><Label className="text-xs font-semibold mb-1.5 block">Modello</Label>
                  <Input value={prefs.pref_modello} onChange={e => setPrefs(p => ({...p, pref_modello: e.target.value}))} placeholder="es. Serie 3" className="text-xs" /></div>
              </div>

              <div><Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1"><Fuel className="w-3 h-3" /> Carburante</Label>
                <Select value={prefs.pref_carburante} onValueChange={v => setPrefs(p => ({...p, pref_carburante: v}))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                  <SelectContent>{CARBURANTI.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select></div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1"><Timer className="w-3 h-3" /> Durata (mesi)</Label>
                  <Input type="number" value={prefs.pref_durata_mesi} onChange={e => setPrefs(p => ({...p, pref_durata_mesi: e.target.value}))} placeholder="36" className="text-xs" /></div>
                <div><Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1"><Activity className="w-3 h-3" /> Km/anno</Label>
                  <Input type="number" value={prefs.pref_km_anno} onChange={e => setPrefs(p => ({...p, pref_km_anno: e.target.value}))} placeholder="15000" className="text-xs" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1"><Euro className="w-3 h-3" /> Budget min (€/mese)</Label>
                  <Input type="number" value={prefs.pref_budget_min} onChange={e => setPrefs(p => ({...p, pref_budget_min: e.target.value}))} placeholder="300" className="text-xs" /></div>
                <div><Label className="text-xs font-semibold mb-1.5 block">Budget max (€/mese)</Label>
                  <Input type="number" value={prefs.pref_budget_max} onChange={e => setPrefs(p => ({...p, pref_budget_max: e.target.value}))} placeholder="600" className="text-xs" /></div>
              </div>

              <div><Label className="text-xs font-semibold mb-1.5 block">Anticipo (€)</Label>
                <Input type="number" value={prefs.pref_anticipo} onChange={e => setPrefs(p => ({...p, pref_anticipo: e.target.value}))} placeholder="0" className="text-xs" /></div>

              <Button onClick={handlePrefs} disabled={savingPref} className="w-full gap-2 bg-electric hover:bg-electric/90 text-white">
                {savingPref ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Salva preferenze
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch]               = useState("");
  const [filterStatus, setFilter]         = useState("tutti");
  const [filterCarburante, setCarb]       = useState("");
  const [filterMarca, setMarca]           = useState("");
  const [soloFollowUp, setSoloFollowUp]   = useState(false);
  const [showFilters, setShowFilters]     = useState(false);
  const [convertLead, setConvert]         = useState(null);
  const [detailLead, setDetail]           = useState(null);
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn:  () => leadsService.list(),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => leadsService.updateStatus(id, status),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
    onError:    () => toast({ title: "Errore aggiornamento", variant: "destructive" }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => leadsService.deleteAll(),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["admin-leads"] }); toast({ title: "Tutti i lead eliminati" }); setConfirmDelete(null); setSelectedIds(new Set()); },
    onError:    e => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: () => leadsService.deleteSelected([...selectedIds]),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["admin-leads"] }); toast({ title: `${selectedIds.size} lead eliminati` }); setConfirmDelete(null); setSelectedIds(new Set()); },
    onError:    e => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  // Filtro client-side
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    if (search && !l.nome?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q) && !l.telefono?.toLowerCase().includes(q) && !l.pref_marca?.toLowerCase().includes(q)) return false;
    if (filterStatus !== "tutti" && l.status !== filterStatus) return false;
    if (filterCarburante && l.pref_carburante !== filterCarburante) return false;
    if (filterMarca && !l.pref_marca?.toLowerCase().includes(filterMarca.toLowerCase())) return false;
    if (soloFollowUp && (!l.follow_up_at || new Date(l.follow_up_at) > new Date())) return false;
    return true;
  });

  const counts = ALL_STATUSES.reduce((acc, s) => { acc[s] = leads.filter(l => l.status === s).length; return acc; }, {});
  const followUpCount = leads.filter(l => l.follow_up_at && new Date(l.follow_up_at) <= new Date()).length;
  const hasActiveFilters = filterCarburante || filterMarca || soloFollowUp;

  const resetFilters = () => { setCarb(""); setMarca(""); setSoloFollowUp(false); };

  return (
    <div className="min-h-screen bg-background pb-16 px-4 pt-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Lead</h1>
            <p className="text-muted-foreground mt-1 text-sm">{leads.length} totali · {counts["Nuovo"]} nuovi · {counts["Contattato"]} contattati</p>
          </div>
          {followUpCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold cursor-pointer" onClick={() => { setSoloFollowUp(true); setShowFilters(true); }}>
              <AlertCircle className="w-4 h-4" /> {followUpCount} follow-up scadut{followUpCount === 1 ? "o" : "i"}
            </div>
          )}
        </div>

        {/* Actions */}
        {leads.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete("selected")} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" /> Elimina selezionati ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete("all")} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" /> Elimina tutti
            </Button>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ALL_STATUSES.map(s => (
            <button key={s}
              onClick={() => setFilter(filterStatus === s ? "tutti" : s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${filterStatus === s ? "border-electric/50 bg-electric/10 text-electric" : "border-border bg-card text-muted-foreground hover:border-electric/30"}`}>
              {s}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[s]}`}>{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Barra filtri */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca nome, email, marca…" className="pl-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={`gap-2 ${hasActiveFilters ? "border-electric text-electric" : ""}`}>
            <Filter className="w-3.5 h-3.5" /> Filtri {hasActiveFilters && `(${[filterCarburante, filterMarca, soloFollowUp].filter(Boolean).length})`}
          </Button>
          {(filterStatus !== "tutti" || search || hasActiveFilters) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilter("tutti"); setSearch(""); resetFilters(); }} className="gap-1 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
        </div>

        {/* Filtri avanzati */}
        {showFilters && (
          <div className="mb-4 p-4 rounded-xl border border-border bg-muted/20 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Marca</Label>
              <Input value={filterMarca} onChange={e => setMarca(e.target.value)} placeholder="es. BMW" className="text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Carburante</Label>
              <Select value={filterCarburante} onValueChange={setCarb}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">Tutti</SelectItem>
                  {CARBURANTI.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSoloFollowUp(!soloFollowUp)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors w-full ${soloFollowUp ? "bg-orange-50 border-orange-300 text-orange-700" : "border-border text-muted-foreground hover:border-border/60"}`}>
                <Calendar className="w-3.5 h-3.5" /> Solo follow-up
              </button>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 w-full text-xs">
                  <X className="w-3 h-3" /> Pulisci filtri
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Nessun lead trovato.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border/30 bg-muted/10">
                <input type="checkbox" className="w-4 h-4 rounded border-border cursor-pointer"
                  checked={filtered.length > 0 && filtered.every(l => selectedIds.has(l.id))}
                  onChange={e => { if (e.target.checked) setSelectedIds(new Set(filtered.map(l => l.id))); else setSelectedIds(new Set()); }} />
                <span className="text-xs text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selezionati` : `${filtered.length} lead`}</span>
              </div>

              <div className="divide-y divide-border/30">
                {filtered.map(lead => (
                  <div key={lead.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer group ${selectedIds.has(lead.id) ? "bg-destructive/5" : ""}`}
                    onClick={() => setDetail(lead)}>
                    {/* Checkbox */}
                    <input type="checkbox" className="w-4 h-4 rounded border-border cursor-pointer shrink-0"
                      checked={selectedIds.has(lead.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { const n = new Set(selectedIds); if (e.target.checked) n.add(lead.id); else n.delete(lead.id); setSelectedIds(n); }} />

                    {/* Avatar con indicatore follow-up */}
                    <div className="relative w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-navy" />
                      {lead.follow_up_at && new Date(lead.follow_up_at) <= new Date() && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-card" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{lead.nome || <span className="text-muted-foreground italic text-xs">Senza nome</span>}</p>
                        {lead.contact_attempts > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{lead.contact_attempts}×</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {lead.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.telefono && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{lead.telefono}</span>}
                      </div>
                      {/* Preferenze strutturate */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {lead.pref_marca && <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"><Car className="w-2.5 h-2.5" />{lead.pref_marca} {lead.pref_modello}</span>}
                        {lead.pref_carburante && <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"><Fuel className="w-2.5 h-2.5" />{lead.pref_carburante}</span>}
                        {lead.pref_durata_mesi && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{lead.pref_durata_mesi} mesi</span>}
                        {(lead.pref_budget_min || lead.pref_budget_max) && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            €{lead.pref_budget_min || "?"}–{lead.pref_budget_max || "?"}/mese
                          </span>
                        )}
                        {!lead.pref_marca && lead.interesse && <span className="text-[10px] text-muted-foreground/60 truncate max-w-xs">{lead.interesse}</span>}
                      </div>
                    </div>

                    {/* Data */}
                    <div className="text-xs text-muted-foreground shrink-0 hidden sm:block text-right">
                      <p>{fmtData(lead.created_at)}</p>
                      {lead.last_contacted_at && <p className="text-[10px] text-green-600 mt-0.5">contattato {fmtRelativo(lead.last_contacted_at)}</p>}
                    </div>

                    {/* Status select */}
                    <Select value={lead.status} onValueChange={val => { changeStatus.mutate({ id: lead.id, status: val }); }}>
                      <SelectTrigger className="w-36 h-8 text-xs" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Converti */}
                    {lead.status !== "Convertito" && (
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setConvert(lead); }} className="h-8 text-xs gap-1 shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Pratica
                      </Button>
                    )}

                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer dettaglio */}
      {detailLead && (
        <LeadDrawer
          lead={detailLead}
          onClose={() => setDetail(null)}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["admin-leads"] })}
        />
      )}

      {/* Modal conversione */}
      {convertLead && (
        <ConvertModal
          lead={convertLead}
          onClose={() => setConvert(null)}
          onConverted={() => qc.invalidateQueries({ queryKey: ["admin-leads"] })}
        />
      )}

      {/* Confirm delete */}
      {(confirmDelete === "all" || confirmDelete === "selected") && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-center mb-2">
              {confirmDelete === "selected" ? `Elimina ${selectedIds.size} lead` : "Elimina tutti i lead"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {confirmDelete === "selected"
                ? `Stai per eliminare ${selectedIds.size} lead selezionati. Questa azione non può essere annullata.`
                : `Stai per eliminare ${leads.length} lead. Questa azione non può essere annullata.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Annulla</Button>
              <Button
                onClick={() => confirmDelete === "selected" ? deleteSelectedMutation.mutate() : deleteAllMutation.mutate()}
                disabled={deleteAllMutation.isPending || deleteSelectedMutation.isPending}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2">
                {(deleteAllMutation.isPending || deleteSelectedMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmDelete === "selected" ? "Elimina selezionati" : "Elimina tutto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
