import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preventiviService } from "@/services/preventivi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Send, Trash2, CheckCircle2, XCircle, Clock,
  Car, ChevronDown, ChevronUp, Loader2, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALIMENTAZIONI = [
  "Benzina", "Diesel", "Full Hybrid Benzina", "Full Hybrid Diesel",
  "Plug-in Hybrid", "Elettrica", "Metano", "GPL",
];

const DURATE = [24, 36, 48, 60];

const KM_OPTIONS = [
  { value: 10000,  label: "10.000 km/anno" },
  { value: 15000,  label: "15.000 km/anno" },
  { value: 20000,  label: "20.000 km/anno" },
  { value: 25000,  label: "25.000 km/anno" },
  { value: 30000,  label: "30.000 km/anno" },
  { value: 40000,  label: "40.000 km/anno" },
  { value: 50000,  label: "50.000 km/anno" },
];

const STATUS_CFG = {
  Bozza:     { label: "Bozza",    cls: "bg-muted text-muted-foreground border-border" },
  Inviato:   { label: "Inviato",  cls: "style={{backgroundColor:'#71BAED'}}/10 style={{color:'#71BAED'}} style={{borderColor:'#71BAED'}}/20" },
  Accettato: { label: "Accettato",cls: "bg-fuel-ev/10 text-fuel-ev border-fuel-ev/20" },
  Rifiutato: { label: "Rifiutato",cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const BLANK_FORM = {
  veicolo_marca: "", veicolo_modello: "", alimentazione: "",
  durata_mesi: "", km_annui: "",
  anticipo: "", canone_mensile: "", canone_finale: "",
  note_cliente: "", note_operative: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, required, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}{required && " *"}
      </Label>
      {children}
    </div>
  );
}

function PreventivoCard({ prev, onInvia, onReinvia, onDelete, isLoading }) {
  const cfg = STATUS_CFG[prev.status] ?? STATUS_CFG.Bozza;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground text-sm">
            {prev.veicolo_marca} {prev.veicolo_modello}
          </p>
          {prev.alimentazione && (
            <p className="text-xs text-muted-foreground mt-0.5">{prev.alimentazione}</p>
          )}
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Durata</p>
          <p className="font-semibold">{prev.durata_mesi} mesi</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Km annui</p>
          <p className="font-semibold">{prev.km_annui?.toLocaleString("it-IT")}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Anticipo</p>
          <p className="font-semibold">€{(prev.anticipo || 0).toLocaleString("it-IT")}</p>
        </div>
        <div className="bg-[#71BAED]/5 border border-[#71BAED]/15 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Canone</p>
          <p className="font-bold text-[#71BAED]">€{prev.canone_mensile?.toLocaleString("it-IT")}/mese</p>
        </div>
      </div>

      {/* Canone finale (se disponibile) */}
      {prev.canone_finale && (
        <p className="text-xs text-muted-foreground">
          Canone finale definito: <span className="font-semibold text-foreground">€{prev.canone_finale?.toLocaleString("it-IT")}/mese</span>
        </p>
      )}

      {/* Note cliente */}
      {prev.note_cliente && (
        <div className="bg-muted/20 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Nota al cliente: </span>
          {prev.note_cliente}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Creato: {format(new Date(prev.created_at), "d MMM yyyy", { locale: it })}</span>
        {prev.inviato_at && (
          <span>Inviato: {format(new Date(prev.inviato_at), "d MMM yyyy HH:mm", { locale: it })}</span>
        )}
        {prev.accettato_at && (
          <span className="text-fuel-ev font-medium">
            <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
            Accettato: {format(new Date(prev.accettato_at), "d MMM yyyy HH:mm", { locale: it })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        {prev.status === "Bozza" && (
          <>
            <Button
              size="sm"
              onClick={() => onInvia(prev.id)}
              disabled={isLoading}
              className="bg-[#71BAED] hover:bg-[#71BAED]/90 text-white gap-1.5 flex-1"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Invia al Cliente
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(prev.id)}
              disabled={isLoading}
              className="border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
        {prev.status === "Inviato" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReinvia(prev.id)}
            disabled={isLoading}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reinvia email
          </Button>
        )}
        {prev.status === "Accettato" && (
          <div className="flex items-center gap-1.5 text-fuel-ev text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" /> Cliente ha accettato
          </div>
        )}
        {prev.status === "Rifiutato" && (
          <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
            <XCircle className="w-4 h-4" /> Cliente ha rifiutato
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PreventiviSection({ praticaId }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const { data: preventivi = [], isLoading } = useQuery({
    queryKey: ["preventivi", praticaId],
    queryFn: () => preventiviService.list(praticaId),
  });

  const invalidate = () => {
    qc.invalidateQueries(["preventivi", praticaId]);
    qc.invalidateQueries(["pratica", praticaId]);
    qc.invalidateQueries(["pratiche-admin"]);
    qc.invalidateQueries(["pratiche-agente"]);
  };

  const createMut = useMutation({
    mutationFn: () => preventiviService.create({
      pratica_id:     praticaId,
      veicolo_marca:  form.veicolo_marca.trim(),
      veicolo_modello: form.veicolo_modello.trim(),
      alimentazione:  form.alimentazione || null,
      durata_mesi:    parseInt(form.durata_mesi),
      km_annui:       parseInt(form.km_annui),
      anticipo:       form.anticipo ? parseFloat(form.anticipo) : 0,
      canone_mensile: parseFloat(form.canone_mensile),
      canone_finale:  form.canone_finale ? parseFloat(form.canone_finale) : null,
      note_cliente:   form.note_cliente.trim() || null,
      note_operative: form.note_operative.trim() || null,
    }),
    onSuccess: () => {
      invalidate();
      setForm(BLANK_FORM);
      setShowForm(false);
      toast({ title: "Preventivo salvato come bozza" });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const inviaMut = useMutation({
    mutationFn: (id) => preventiviService.invia(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Preventivo inviato al cliente", description: "Email inviata." });
    },
    onError: (e) => toast({ title: "Errore invio", description: e.message, variant: "destructive" }),
  });

  const reinviaMut = useMutation({
    mutationFn: (id) => preventiviService.invia(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Email reinviata" });
    },
    onError: (e) => toast({ title: "Errore reinvio", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => preventiviService.delete(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Preventivo eliminato" });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const isMutating = inviaMut.isPending || reinviaMut.isPending || deleteMut.isPending;

  const canSubmit =
    form.veicolo_marca.trim() &&
    form.veicolo_modello.trim() &&
    form.durata_mesi &&
    form.km_annui &&
    form.canone_mensile;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold text-base">Preventivi</h2>
          {preventivi.length > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {preventivi.length}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className={showForm ? "" : "style={{backgroundColor:'#71BAED'}} hover:style={{backgroundColor:'#71BAED'}}/90 text-white gap-1.5"}
        >
          {showForm ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Annulla</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Nuovo Preventivo</>
          )}
        </Button>
      </div>

      {/* ── New preventivo form ── */}
      {showForm && (
        <div className="border border-border/50 rounded-xl p-4 bg-muted/10 mb-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">
            Nuovo preventivo
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Veicolo */}
            <div className="space-y-4">
              <FieldGroup label="Marca" required>
                <Input
                  value={form.veicolo_marca}
                  onChange={(e) => set("veicolo_marca", e.target.value)}
                  placeholder="es. Volkswagen"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="Modello" required>
                <Input
                  value={form.veicolo_modello}
                  onChange={(e) => set("veicolo_modello", e.target.value)}
                  placeholder="es. Golf 1.5 eTSI"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="Alimentazione">
                <Select value={form.alimentazione} onValueChange={(v) => set("alimentazione", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                  <SelectContent>
                    {ALIMENTAZIONI.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>

            {/* Configurazione */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Durata (mesi)" required>
                  <Select value={form.durata_mesi} onValueChange={(v) => set("durata_mesi", v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Mesi" /></SelectTrigger>
                    <SelectContent>
                      {DURATE.map((d) => <SelectItem key={d} value={String(d)}>{d} mesi</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Km annui" required>
                  <Select value={form.km_annui} onValueChange={(v) => set("km_annui", v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Km" /></SelectTrigger>
                    <SelectContent>
                      {KM_OPTIONS.map((k) => <SelectItem key={k.value} value={String(k.value)}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldGroup label="Anticipo (€)">
                  <Input
                    type="number" min="0" step="100"
                    value={form.anticipo}
                    onChange={(e) => set("anticipo", e.target.value)}
                    placeholder="0"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Canone/mese (€)" required>
                  <Input
                    type="number" min="0" step="1"
                    value={form.canone_mensile}
                    onChange={(e) => set("canone_mensile", e.target.value)}
                    placeholder="399"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Canone finale (€)">
                  <Input
                    type="number" min="0" step="1"
                    value={form.canone_finale}
                    onChange={(e) => set("canone_finale", e.target.value)}
                    placeholder="Opz."
                    className="h-10"
                  />
                </FieldGroup>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Nota per il cliente (visibile nell'email)">
              <Textarea
                value={form.note_cliente}
                onChange={(e) => set("note_cliente", e.target.value)}
                placeholder="Include anche: servizi, garanzie, ecc."
                className="h-20 resize-none text-sm"
              />
            </FieldGroup>
            <FieldGroup label="Nota operativa (solo interna)">
              <Textarea
                value={form.note_operative}
                onChange={(e) => set("note_operative", e.target.value)}
                placeholder="Note interne, broker, margine…"
                className="h-20 resize-none text-sm"
              />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}>
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={() => createMut.mutate()}
              disabled={!canSubmit || createMut.isPending}
              className="bg-navy hover:bg-navy-dark text-white gap-1.5"
            >
              {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Salva bozza
            </Button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : preventivi.length === 0 ? (
        <div className="text-center py-8">
          <Car className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nessun preventivo ancora.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Clicca "Nuovo Preventivo" per crearne uno.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {preventivi.map((p) => (
            <PreventivoCard
              key={p.id}
              prev={p}
              onInvia={(id) => inviaMut.mutate(id)}
              onReinvia={(id) => reinviaMut.mutate(id)}
              onDelete={(id) => deleteMut.mutate(id)}
              isLoading={isMutating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
