import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Lock, Eye, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import StatusTimeline from "@/components/pratiche/StatusTimeline";
import DocumentUploadSection from "@/components/pratiche/DocumentUploadSection";

const STATUS_COLORS = {
  "Nuova": "bg-blue-100 text-blue-700",
  "In Lavorazione": "bg-yellow-100 text-yellow-700",
  "Documenti Richiesti": "bg-orange-100 text-orange-700",
  "Approvata": "bg-green-100 text-green-700",
  "Consegnata": "bg-purple-100 text-purple-700",
  "Chiusa": "bg-gray-100 text-gray-600",
};

const ALL_STATUSES = ["Nuova", "In Lavorazione", "Documenti Richiesti", "Approvata", "Consegnata", "Chiusa"];

export default function PraticaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notaTesto, setNotaTesto] = useState("");
  const [notaVisibile, setNotaVisibile] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: pratica, isLoading } = useQuery({
    queryKey: ["pratica", id],
    queryFn: async () => {
      const res = await base44.entities.Pratica.filter({ id });
      return res[0] || null;
    },
  });

  const { data: note = [] } = useQuery({
    queryKey: ["note", id],
    queryFn: () => base44.entities.PraticaNota.filter({ pratica_id: id }, "-created_date", 50),
    enabled: !!id,
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const updateStatus = useMutation({
    mutationFn: (status) => base44.entities.Pratica.update(id, {
      status,
      ultimo_aggiornamento_stato: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries(["pratica", id]);
      qc.invalidateQueries(["pratiche-admin"]);
      qc.invalidateQueries(["pratiche-agente"]);
      setNewStatus("");
      toast({ title: "Stato aggiornato" });
    },
  });

  const addNota = useMutation({
    mutationFn: () => base44.entities.PraticaNota.create({
      pratica_id: id,
      autore_nome: user?.full_name || "Operatore",
      autore_ruolo: user?.role || "admin",
      testo: notaTesto,
      visibile_cliente: notaVisibile,
    }),
    onSuccess: () => {
      qc.invalidateQueries(["note", id]);
      setNotaTesto("");
      setNotaVisibile(false);
      toast({ title: "Nota aggiunta" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!pratica) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pratica non trovata.</p>
          <Button onClick={() => navigate(-1)} variant="outline">Torna indietro</Button>
        </div>
      </div>
    );
  }

  const backPath = user?.role === "agente" ? "/agente" : "/admin";

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pratica.status]}`}>
                {pratica.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Creata il {pratica.created_date ? format(new Date(pratica.created_date), "d MMMM yyyy", { locale: it }) : "—"}
            </p>
          </div>

          {/* Change status */}
          {user?.role !== "cliente" && (
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

        {/* Documenti */}
        <div className="mb-6">
          <DocumentUploadSection praticaId={id} />
        </div>

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
                  {n.created_date ? format(new Date(n.created_date), "d MMM yyyy HH:mm", { locale: it }) : ""}
                </p>
              </div>
            ))}
          </div>

          {/* Add nota */}
          {user?.role !== "cliente" && (
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