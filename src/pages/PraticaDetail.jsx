import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Lock, Eye, ChevronRight, Euro, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import StatusTimeline from "@/components/pratiche/StatusTimeline";
import DocumentUploadSection from "@/components/pratiche/DocumentUploadSection";
import PreventiviSection from "@/components/pratiche/PreventiviSection";
import { PRATICA_STATUS_COLORS, DEFAULT_STATUS_COLOR } from "@/lib/praticaStatus";

const ALL_STATUSES = ["Nuova", "In Lavorazione", "Documenti Richiesti", "Approvata", "Consegnata", "Chiusa"];

export default function PraticaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notaTesto, setNotaTesto] = useState("");
  const [notaVisibile, setNotaVisibile] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [provvigione, setProvvigione] = useState("");
  const { profile } = useAuth();

  const { data: pratica, isLoading } = useQuery({
    queryKey: ["pratica", id],
    queryFn: () => praticheService.getById(id),
  });

  // Notes are nested in pratica.pratica_note
  const note = useMemo(
    () => [...(pratica?.pratica_note ?? [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [pratica]
  );

  const updateStatus = useMutation({
    mutationFn: (status) => praticheService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(["pratica", id]);
      qc.invalidateQueries(["pratiche-admin"]);
      qc.invalidateQueries(["pratiche-agente"]);
      setNewStatus("");
      toast({ title: "Stato aggiornato" });
    },
  });

  const saveProvvigione = useMutation({
    mutationFn: ({ importo, pagata }) => praticheService.setProvvigione(id, importo, pagata),
    onSuccess: () => {
      qc.invalidateQueries(["pratica", id]);
      setProvvigione("");
      toast({ title: "Provvigione salvata" });
    },
  });

  const addNota = useMutation({
    mutationFn: () => praticheService.addNota(
      id,
      notaTesto,
      profile?.full_name || "Operatore",
      profile?.role || "admin",
      notaVisibile,
    ),
    onSuccess: () => {
      qc.invalidateQueries(["pratica", id]);
      setNotaTesto("");
      setNotaVisibile(false);
      toast({ title: "Nota aggiunta" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!pratica) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pratica non trovata.</p>
          <Button onClick={() => navigate(-1)} variant="outline">Torna indietro</Button>
        </div>
      </div>
    );
  }

  const backPath =
    profile?.role === "agente"     ? "/agente" :
    profile?.role === "backoffice" ? "/backoffice" : "/admin";

  return (
    <div className="min-h-screen bg-background pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(backPath)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-electric transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Torna alla lista
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-2xl text-foreground">
                Pratica {pratica.codice || pratica.id.slice(0, 8)}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${(PRATICA_STATUS_COLORS[pratica.status] ?? DEFAULT_STATUS_COLOR).badge}`}>
                {pratica.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Creata il {pratica.created_at ? format(new Date(pratica.created_at), "d MMMM yyyy", { locale: it }) : "—"}
            </p>
          </div>

          {/* Change status */}
          {profile?.role !== "cliente" && (
            <div className="flex items-center gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Cambia stato..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!newStatus || updateStatus.isPending}
                onClick={() => updateStatus.mutate(newStatus)}
                className="bg-electric hover:bg-electric/90 text-white"
              >
                Salva
              </Button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <StatusTimeline currentStatus={pratica.status} />
        </div>

        {/* Grid info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Cliente */}
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h2 className="font-heading font-semibold text-base mb-4">Dati Cliente</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium text-foreground">{pratica.cliente_nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{pratica.cliente_email}</dd>
              </div>
              {pratica.cliente_telefono && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Telefono</dt>
                  <dd className="font-medium text-foreground">{pratica.cliente_telefono}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-medium text-foreground">{pratica.cliente_tipo || "—"}</dd>
              </div>
              {pratica.cliente_piva && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">P.IVA / CF</dt>
                  <dd className="font-medium text-foreground">{pratica.cliente_piva}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Veicolo */}
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h2 className="font-heading font-semibold text-base mb-4">Configurazione Veicolo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Veicolo</dt>
                <dd className="font-medium text-foreground">{pratica.veicolo_marca} {pratica.veicolo_modello}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Segmento</dt>
                <dd className="font-medium text-foreground">{pratica.segmento || "—"}</dd>
              </div>
              {pratica.durata_mesi && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Durata</dt>
                  <dd className="font-medium text-foreground">{pratica.durata_mesi} mesi</dd>
                </div>
              )}
              {pratica.km_annui && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Km annui</dt>
                  <dd className="font-medium text-foreground">{pratica.km_annui?.toLocaleString()}</dd>
                </div>
              )}
              {pratica.anticipo !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Anticipo</dt>
                  <dd className="font-medium text-foreground">€{pratica.anticipo?.toLocaleString()}</dd>
                </div>
              )}
              {pratica.canone_mensile && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Canone</dt>
                  <dd className="font-bold text-electric">€{pratica.canone_mensile}/mese</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Preventivi */}
        <div className="mb-6">
          <PreventiviSection praticaId={id} />
        </div>

        {/* Documenti */}
        <div className="mb-6">
          <DocumentUploadSection praticaId={id} />
        </div>

        {/* Provvigione agente — visibile solo a admin/backoffice */}
        {pratica.agente_id && profile?.role !== "cliente" && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6">
            <h2 className="font-heading font-semibold text-base mb-4 flex items-center gap-2">
              <Euro className="w-4 h-4 text-electric" /> Provvigione Agente
            </h2>

            {/* Stato attuale */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Agente</p>
                <p className="font-semibold text-sm text-foreground">{pratica.agente_nome || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Importo</p>
                <p className="font-bold text-lg text-electric">
                  {pratica.provvigione != null ? `€${Number(pratica.provvigione).toLocaleString("it-IT")}` : "Non definita"}
                </p>
              </div>
              <div>
                {pratica.provvigione != null && (
                  pratica.provvigione_pagata
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"><CheckCircle2 className="w-3 h-3" /> Pagata</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1"><Clock className="w-3 h-3" /> Da pagare</span>
                )}
              </div>
            </div>

            {/* Form solo per admin/backoffice */}
            {profile?.role !== "agente" && (
              <div className="border-t border-border/50 pt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <span className="text-sm text-muted-foreground">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    placeholder={pratica.provvigione != null ? String(pratica.provvigione) : "Importo provvigione"}
                    value={provvigione}
                    onChange={e => setProvvigione(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!provvigione || saveProvvigione.isPending}
                  onClick={() => saveProvvigione.mutate({ importo: parseFloat(provvigione), pagata: pratica.provvigione_pagata ?? false })}
                  className="bg-electric hover:bg-electric/90 text-white"
                >
                  Salva importo
                </Button>
                {pratica.provvigione != null && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saveProvvigione.isPending}
                    onClick={() => saveProvvigione.mutate({ importo: pratica.provvigione, pagata: !pratica.provvigione_pagata })}
                  >
                    {pratica.provvigione_pagata ? "Segna come da pagare" : "Segna come pagata"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="font-heading font-semibold text-base mb-4">Note & Comunicazioni</h2>

          {/* Note list */}
          <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
            {note.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna nota ancora.</p>
            )}
            {note.map(n => (
              <div key={n.id} className={`rounded-xl p-3 text-sm ${
                n.autore_ruolo === "cliente" ? "bg-blue-50 border border-blue-100" : "bg-muted/50"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{n.autore_nome}</span>
                  <span className="text-xs text-muted-foreground capitalize">{n.autore_ruolo}</span>
                  {n.visibile_cliente && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                      <Eye className="w-3 h-3" /> Visibile al cliente
                    </span>
                  )}
                  {!n.visibile_cliente && n.autore_ruolo !== "cliente" && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" /> Interna
                    </span>
                  )}
                </div>
                <p className="text-foreground/80">{n.testo}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.created_at ? format(new Date(n.created_at), "d MMM yyyy HH:mm", { locale: it }) : ""}
                </p>
              </div>
            ))}
          </div>

          {/* Add nota */}
          {profile?.role !== "cliente" && (
            <div className="border-t border-border/50 pt-4 space-y-3">
              <Textarea
                placeholder="Scrivi una nota..."
                value={notaTesto}
                onChange={e => setNotaTesto(e.target.value)}
                className="h-20"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notaVisibile}
                    onChange={e => setNotaVisibile(e.target.checked)}
                    className="rounded"
                  />
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  Visibile al cliente
                </label>
                <Button
                  onClick={() => addNota.mutate()}
                  disabled={!notaTesto.trim() || addNota.isPending}
                  size="sm"
                  className="bg-electric hover:bg-electric/90 text-white gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Invia Nota
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}