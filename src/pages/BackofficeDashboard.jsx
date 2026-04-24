import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { profilesService } from "@/services/profiles";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search, Eye, ClipboardList, Clock, CheckCircle2,
  AlertCircle, FileCheck, FileX, ChevronRight, Users,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PRATICA_STATUS_COLORS, DEFAULT_STATUS_COLOR } from "@/lib/praticaStatus";

const ALL_STATUSES = [
  "Nuova", "In Lavorazione", "Documenti Richiesti", "Documenti Caricati",
  "Attesa Affidamento Finanziaria", "Affidamento Ricevuto",
  "Stipula Contratto", "Attesa Consegna", "Approvata", "Consegnata", "Chiusa",
];

const TABS = [
  { id: "pratiche",  label: "Tutte le Pratiche",       icon: ClipboardList },
  { id: "documenti", label: "Documenti da Verificare",  icon: FileCheck },
];

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

function PraticaRow({ p, basePath }) {
  const sc = PRATICA_STATUS_COLORS[p.status] ?? DEFAULT_STATUS_COLOR;
  const docDaVerificare = (p.pratica_documenti || [])
    .filter(d => d.stato_verifica === "In attesa").length;

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-sm text-foreground">{p.codice}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "d MMM yyyy", { locale: it })}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground">{p.cliente_nome} {p.cliente_cognome}</p>
        <p className="text-xs text-muted-foreground">{p.cliente_email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {p.veicolo_marca ? `${p.veicolo_marca} ${p.veicolo_modello}` : <span className="italic text-muted-foreground/50">—</span>}
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={`text-xs ${sc.badge}`}>{p.status}</Badge>
      </td>
      <td className="px-4 py-3">
        {docDaVerificare > 0
          ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{docDaVerificare} da verificare</span>
          : <span className="text-xs text-muted-foreground/50">—</span>
        }
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {p.agente_nome || <span className="italic text-muted-foreground/40">Non assegnata</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link to={`${basePath}/pratica/${p.id}`}>
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
            <Eye className="w-3.5 h-3.5" /> Apri
          </Button>
        </Link>
      </td>
    </tr>
  );
}

export default function BackofficeDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pratiche");
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("tutti");

  const { data: pratiche = [], isLoading } = useQuery({
    queryKey: ["pratiche-backoffice"],
    queryFn: () => praticheService.list(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => praticheService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pratiche-backoffice"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: () => toast({ title: "Errore aggiornamento stato", variant: "destructive" }),
  });

  // Stats
  const stats = useMemo(() => ({
    totali:      pratiche.length,
    nuove:       pratiche.filter(p => p.status === "Nuova").length,
    docCaricati: pratiche.filter(p => p.status === "Documenti Caricati").length,
    consegnate:  pratiche.filter(p => p.status === "Consegnata").length,
    docsInAttesa: pratiche.reduce((acc, p) =>
      acc + (p.pratica_documenti || []).filter(d => d.stato_verifica === "In attesa").length, 0),
  }), [pratiche]);

  // Filtri
  const filtered = useMemo(() => pratiche.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.codice?.toLowerCase().includes(q) ||
      p.cliente_nome?.toLowerCase().includes(q) ||
      p.cliente_email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "tutti" || p.status === filterStatus;
    return matchSearch && matchStatus;
  }), [pratiche, search, filterStatus]);

  // Pratiche con documenti da verificare
  const docDaVerificare = useMemo(() =>
    pratiche.filter(p => (p.pratica_documenti || []).some(d => d.stato_verifica === "In attesa")),
    [pratiche]
  );

  return (
    <div className="min-h-screen bg-background pb-16 px-4 pt-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground">Dashboard Backoffice</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestione pratiche e verifica documenti</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <StatCard label="Pratiche totali"       value={stats.totali}      icon={ClipboardList}  colorClass="text-navy bg-navy/8" />
          <StatCard label="Nuove"                  value={stats.nuove}       icon={AlertCircle}    colorClass="text-amber-600 bg-amber-50" />
          <StatCard label="Documenti caricati"     value={stats.docCaricati} icon={FileCheck}      colorClass="text-blue-600 bg-blue-50" />
          <StatCard label="Doc. da verificare"     value={stats.docsInAttesa}icon={FileX}          colorClass="text-red-500 bg-red-50" />
          <StatCard label="Consegnate"             value={stats.consegnate}  icon={CheckCircle2}   colorClass="text-green-600 bg-green-50" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "documenti" && stats.docsInAttesa > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {stats.docsInAttesa}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB PRATICHE ── */}
        {activeTab === "pratiche" && (
          <div>
            {/* Filtri */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca codice, cliente…"
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli stati</SelectItem>
                  {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Codice</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Veicolo</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Stato</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Documenti</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Agente</th>
                        <th className="text-right px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => (
                        <PraticaRow key={p.id} p={p} basePath="/backoffice" />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB DOCUMENTI DA VERIFICARE ── */}
        {activeTab === "documenti" && (
          <div>
            {docDaVerificare.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-foreground">Tutto verificato!</p>
                <p className="text-sm text-muted-foreground mt-1">Nessun documento in attesa di verifica.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {docDaVerificare.map(p => {
                  const docsAttesa = (p.pratica_documenti || []).filter(d => d.stato_verifica === "In attesa");
                  const sc = PRATICA_STATUS_COLORS[p.status] ?? DEFAULT_STATUS_COLOR;
                  return (
                    <div key={p.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                      {/* Pratica header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-foreground">{p.codice}</span>
                          <Badge variant="outline" className={`text-xs ${sc.badge}`}>{p.status}</Badge>
                          <span className="text-sm text-muted-foreground">{p.cliente_nome} {p.cliente_cognome}</span>
                        </div>
                        <Link to={`/backoffice/pratica/${p.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                            Apri pratica <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                      {/* Documenti */}
                      <div className="divide-y divide-border/20">
                        {docsAttesa.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.nome_file}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{doc.tipo_documento} · {format(new Date(doc.created_at), "d MMM yyyy HH:mm", { locale: it })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.file_url && (
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="h-8 text-xs">
                                    Visualizza
                                  </Button>
                                </a>
                              )}
                              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                                In attesa
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
