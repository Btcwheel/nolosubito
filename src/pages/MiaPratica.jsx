import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { praticheService } from "@/services/pratiche";
import { preventiviService } from "@/services/preventivi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Car, User, MessageSquare, AlertCircle, Mail,
  CheckCircle2, XCircle, Clock, Plus, Loader2, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import StatusTimeline from "@/components/pratiche/StatusTimeline";
import { PRATICA_STATUS_COLORS, DEFAULT_STATUS_COLOR } from "@/lib/praticaStatus";
import { useToast } from "@/components/ui/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const MARCHE = [
  "Alfa Romeo","Audi","BMW","Citroen","Dacia","Fiat","Ford","Honda",
  "Hyundai","Jeep","Kia","Mazda","Mercedes-Benz","Nissan","Opel",
  "Peugeot","Renault","SEAT","Skoda","Tesla","Toyota","Volkswagen","Volvo","Altro",
];

const ALIMENTAZIONI = [
  "Benzina","Diesel","Full Hybrid Benzina","Full Hybrid Diesel",
  "Plug-in Hybrid","Elettrica","Metano","GPL",
];

const KM_OPTIONS = [
  { value: "10000", label: "10.000 km/anno" },
  { value: "15000", label: "15.000 km/anno" },
  { value: "20000", label: "20.000 km/anno" },
  { value: "25000", label: "25.000 km/anno" },
  { value: "30000", label: "30.000 km/anno" },
  { value: "40000", label: "40.000 km/anno" },
  { value: "50000", label: "50.000 km/anno" },
];

const PREVENTIVO_STATUS = {
  Inviato:   { label: "Da valutare", cls: "bg-electric/10 text-electric border-electric/20" },
  Accettato: { label: "Accettato",   cls: "bg-fuel-ev/10 text-fuel-ev border-fuel-ev/20" },
  Rifiutato: { label: "Non accettato", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

// ─── Nuova Richiesta Preventivo dialog ───────────────────────────────────────

function NuovaRichiestaDialog({ open, onClose, praticaId, clienteNome }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ marca: "", modello: "", alimentazione: "", kmAnnui: "", note: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.marca && !form.modello) return;
    setSending(true);
    try {
      const testo = [
        `📋 Richiesta nuovo preventivo da ${clienteNome}:`,
        form.marca && `• Marca: ${form.marca}`,
        form.modello && `• Modello: ${form.modello}`,
        form.alimentazione && `• Alimentazione: ${form.alimentazione}`,
        form.kmAnnui && `• Km annui: ${parseInt(form.kmAnnui).toLocaleString("it-IT")}`,
        form.note && `• Note: ${form.note}`,
      ].filter(Boolean).join("\n");

      await praticheService.addNota(
        praticaId,
        testo,
        clienteNome,
        "cliente",
        false, // nota interna → visibile allo staff, non al cliente in area pubblica
      );
      qc.invalidateQueries(["mia-pratica"]);
      toast({ title: "Richiesta inviata!", description: "Il team la contatterà per il nuovo preventivo." });
      onClose();
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Richiedi un altro preventivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Marca</Label>
              <Select value={form.marca} onValueChange={(v) => set("marca", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                <SelectContent>
                  {MARCHE.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Modello</Label>
              <Input value={form.modello} onChange={(e) => set("modello", e.target.value)} placeholder="es. Golf" className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Alimentazione</Label>
              <Select value={form.alimentazione} onValueChange={(v) => set("alimentazione", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                <SelectContent>
                  {ALIMENTAZIONI.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Km annui</Label>
              <Select value={form.kmAnnui} onValueChange={(v) => set("kmAnnui", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                <SelectContent>
                  {KM_OPTIONS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Note aggiuntive</Label>
            <Textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Colore, allestimento, budget massimo…"
              className="resize-none h-20 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Annulla</Button>
            <Button
              type="submit"
              disabled={sending || (!form.marca && !form.modello)}
              size="sm"
              className="bg-electric hover:bg-electric/90 text-white"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Invia richiesta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Preventivi client cards ─────────────────────────────────────────────────

function PreventiviCliente({ praticaId, clienteNome }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showNuovaRichiesta, setShowNuovaRichiesta] = useState(false);

  const { data: preventivi = [], isLoading } = useQuery({
    queryKey: ["preventivi-cliente", praticaId],
    queryFn: () => preventiviService.list(praticaId),
  });

  const invalidate = () => {
    qc.invalidateQueries(["preventivi-cliente", praticaId]);
    qc.invalidateQueries(["mia-pratica"]);
  };

  const accettaMut = useMutation({
    mutationFn: (id) => preventiviService.accetta(id),
    onSuccess: () => {
      invalidate();
      toast({
        title: "Preventivo accettato!",
        description: "Ti verranno richiesti i documenti per procedere.",
      });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const rifiutaMut = useMutation({
    mutationFn: (id) => preventiviService.rifiuta(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Preventivo rifiutato", description: "Il team cercherà altre soluzioni." });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  // Only show non-bozza preventivi to client
  const visibili = preventivi.filter((p) => p.status !== "Bozza");

  if (isLoading) return <div className="h-24 bg-muted/30 rounded-xl animate-pulse" />;
  if (visibili.length === 0) return null;

  const isMutating = accettaMut.isPending || rifiutaMut.isPending;

  return (
    <>
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <p className="font-semibold text-foreground text-sm">
              Preventivi ({visibili.length})
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNuovaRichiesta(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3 h-3" />
            Richiedi altro
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {visibili.map((prev) => {
            const cfg = PREVENTIVO_STATUS[prev.status] ?? PREVENTIVO_STATUS.Inviato;
            const isAccettato = prev.status === "Accettato";
            const isRifiutato = prev.status === "Rifiutato";
            const isInviato = prev.status === "Inviato";

            return (
              <div
                key={prev.id}
                className={`border rounded-xl p-4 transition-colors ${
                  isAccettato
                    ? "border-fuel-ev/30 bg-fuel-ev/5"
                    : isRifiutato
                    ? "border-border/30 bg-muted/10 opacity-70"
                    : "border-border/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {prev.veicolo_marca} {prev.veicolo_modello}
                    </p>
                    {prev.alimentazione && (
                      <p className="text-xs text-muted-foreground">{prev.alimentazione}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Config pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-muted/50 px-2.5 py-1 rounded-full">
                    {prev.durata_mesi} mesi
                  </span>
                  <span className="text-xs bg-muted/50 px-2.5 py-1 rounded-full">
                    {prev.km_annui?.toLocaleString("it-IT")} km/anno
                  </span>
                  {prev.anticipo > 0 && (
                    <span className="text-xs bg-muted/50 px-2.5 py-1 rounded-full">
                      Anticipo €{prev.anticipo?.toLocaleString("it-IT")}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-2xl font-heading font-bold text-electric">
                    €{(prev.canone_finale || prev.canone_mensile)?.toLocaleString("it-IT")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mese</span>
                  {prev.canone_finale && prev.canone_finale !== prev.canone_mensile && (
                    <span className="text-xs text-muted-foreground line-through ml-1">
                      €{prev.canone_mensile?.toLocaleString("it-IT")}
                    </span>
                  )}
                </div>

                {/* Note cliente */}
                {prev.note_cliente && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                    {prev.note_cliente}
                  </p>
                )}

                {/* Inviato_at */}
                <p className="text-xs text-muted-foreground mb-3">
                  Preventivo del{" "}
                  {format(new Date(prev.inviato_at || prev.created_at), "d MMMM yyyy", { locale: it })}
                </p>

                {/* Actions */}
                {isInviato && (
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <Button
                      onClick={() => accettaMut.mutate(prev.id)}
                      disabled={isMutating}
                      className="flex-1 bg-fuel-ev hover:bg-fuel-ev/90 text-white h-10 gap-2"
                    >
                      {accettaMut.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Accetto
                    </Button>
                    <Button
                      onClick={() => rifiutaMut.mutate(prev.id)}
                      disabled={isMutating}
                      variant="outline"
                      className="flex-1 h-10 gap-2 border-border/50"
                    >
                      <XCircle className="w-4 h-4" />
                      Non mi interessa
                    </Button>
                  </div>
                )}

                {isAccettato && (
                  <div className="flex items-center gap-2 text-fuel-ev text-sm font-medium pt-3 border-t border-fuel-ev/20">
                    <CheckCircle2 className="w-4 h-4" />
                    Hai accettato questo preventivo
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <NuovaRichiestaDialog
        open={showNuovaRichiesta}
        onClose={() => setShowNuovaRichiesta(false)}
        praticaId={praticaId}
        clienteNome={clienteNome}
      />
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MiaPratica() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [searchEmail, setSearchEmail] = useState(emailFromUrl);
  const [submitted, setSubmitted] = useState(!!emailFromUrl);

  const { data: pratiche = [], isLoading } = useQuery({
    queryKey: ["mia-pratica", searchEmail],
    queryFn: () => praticheService.list({ clienteEmail: searchEmail }),
    enabled: !!searchEmail,
  });

  const notePerPratica = useMemo(
    () => (pratiche[0]?.pratica_note ?? []).filter((n) => n.visibile_cliente),
    [pratiche]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchEmail(email.trim().toLowerCase());
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-navy pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.25)_0%,_transparent_60%)]" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/15 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
            Tracciamento in tempo reale
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-4 leading-tight">
            La tua pratica Noleggio Lungo Termine
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            Inserisci l'email utilizzata per la richiesta e monitora lo stato del tuo noleggio.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16 relative z-10">
        {/* Search card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl p-6 mb-8">
          <form onSubmit={handleSearch}>
            <p className="text-sm font-medium text-foreground mb-3">Email utilizzata per la richiesta</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.it"
                  className="pl-9 h-11"
                  required
                />
              </div>
              <Button type="submit" className="bg-electric hover:bg-electric/90 text-white h-11 px-6 gap-2 shrink-0">
                <Search className="w-4 h-4" /> Cerca
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {submitted && (
            isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </motion.div>
            ) : pratiche.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-10 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground text-lg mb-2">Nessuna pratica trovata</p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Controlla l'indirizzo email inserito. Se hai appena inviato la richiesta, potrebbe volerci qualche minuto.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {pratiche.map((p) => {
                  const statusCfg = PRATICA_STATUS_COLORS[p.status] ?? DEFAULT_STATUS_COLOR;
                  const showNotes = notePerPratica.length > 0 && p.id === pratiche[0].id;

                  return (
                    <div key={p.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">

                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Pratica</p>
                          <p className="font-mono font-bold text-foreground text-sm tracking-wider">
                            {p.codice || `#${p.id.slice(0, 8).toUpperCase()}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badge}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Timeline */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Avanzamento pratica</p>
                          <StatusTimeline currentStatus={p.status} />
                        </div>

                        {/* Veicolo + Agente */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(p.veicolo_marca || p.veicolo_modello) && (
                            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                              <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                                <Car className="w-4 h-4 text-electric" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Veicolo richiesto</p>
                                <p className="font-semibold text-foreground text-sm">{p.veicolo_marca} {p.veicolo_modello}</p>
                                {p.canone_mensile && (
                                  <p className="text-electric font-bold text-sm mt-0.5">€{p.canone_mensile}/mese</p>
                                )}
                              </div>
                            </div>
                          )}

                          {p.agente_nome && (
                            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                              <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-electric" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Agente assegnato</p>
                                <p className="font-semibold text-foreground text-sm">{p.agente_nome}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preventivi */}
                        <PreventiviCliente
                          praticaId={p.id}
                          clienteNome={p.cliente_nome}
                        />

                        {/* Documenti richiesti banner */}
                        {p.status === "Documenti Richiesti" && (
                          <div className="bg-fuel-petrol/10 border border-fuel-petrol/25 rounded-xl px-4 py-3.5 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-fuel-petrol shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-fuel-petrol">Documenti richiesti</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Il team ha bisogno dei tuoi documenti per procedere con la pratica.
                                Il link per il caricamento ti verrà inviato via email.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Note visibili al cliente */}
                        {showNotes && (
                          <div className="border-t border-border/40 pt-5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> Comunicazioni dal team
                            </p>
                            <div className="space-y-3">
                              {notePerPratica.map((n) => (
                                <div key={n.id} className="flex gap-3">
                                  <div className="w-7 h-7 rounded-full bg-electric/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-electric font-bold text-xs">NS</span>
                                  </div>
                                  <div className="flex-1 bg-electric/5 border border-electric/10 rounded-xl px-4 py-3">
                                    <p className="text-sm text-foreground leading-relaxed">{n.testo}</p>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                      {n.created_at ? format(new Date(n.created_at), "d MMM yyyy · HH:mm", { locale: it }) : ""}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Footer */}
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Hai bisogno di assistenza?{" "}
                    <a href="mailto:offerte@nolosubito.it" className="text-electric font-medium hover:underline">
                      Contattaci
                    </a>
                  </p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
