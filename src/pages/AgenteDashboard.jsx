import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Eye, ClipboardList, TrendingUp, Clock, CheckCircle2,
  Users, Car, ChevronRight, ArrowUpRight, AlertCircle, Zap, BarChart2, Euro
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import AgentePipelineView from "@/components/agente/AgentePipelineView";
import AgenteStatsChart from "@/components/agente/AgenteStatsChart";
import { PRATICA_STATUS_COLORS, DEFAULT_STATUS_COLOR } from "@/lib/praticaStatus";

const ALL_STATUSES = [
  "Nuova", "In Lavorazione", "Documenti Richiesti", "Documenti Caricati",
  "Attesa Affidamento Finanziaria", "Affidamento Ricevuto", "Stipula Contratto",
  "Attesa Consegna", "Approvata", "Consegnata", "Chiusa",
];
const ACTIVE_STATUSES = ["Nuova", "In Lavorazione", "Documenti Richiesti", "Approvata"];

export default function AgenteDashboard() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("tutti");
  const [view, setView] = useState("lista"); // "lista" | "pipeline" | "stats"

  const { profile } = useAuth();

  const { data: pratiche = [], isLoading } = useQuery({
    queryKey: ["pratiche-agente", profile?.id],
    queryFn: () => praticheService.list({ agenteId: profile.id }),
    enabled: !!profile?.id,
  });

  const stats = useMemo(() => {
    const attive = pratiche.filter(p => ACTIVE_STATUSES.includes(p.status)).length;
    const chiuse = pratiche.filter(p => p.status === "Chiusa" || p.status === "Consegnata").length;
    const nuove = pratiche.filter(p => p.status === "Nuova").length;
    const totalCanone = pratiche
      .filter(p => p.status === "Consegnata" && p.canone_mensile)
      .reduce((sum, p) => sum + (p.canone_mensile || 0), 0);
    const provvigioneTotale = pratiche
      .filter(p => p.provvigione != null)
      .reduce((sum, p) => sum + Number(p.provvigione), 0);
    const provvigionePagata = pratiche
      .filter(p => p.provvigione != null && p.provvigione_pagata)
      .reduce((sum, p) => sum + Number(p.provvigione), 0);
    return { attive, chiuse, nuove, totalCanone, provvigioneTotale, provvigionePagata };
  }, [pratiche]);

  const filtered = useMemo(() => pratiche.filter(p => {
    const matchSearch = !search ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_email?.toLowerCase().includes(search.toLowerCase()) ||
      p.codice?.toLowerCase().includes(search.toLowerCase()) ||
      `${p.veicolo_marca} ${p.veicolo_modello}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tutti" || p.status === filterStatus;
    return matchSearch && matchStatus;
  }), [pratiche, search, filterStatus]);

  const hora = new Date().getHours();
  const greeting = hora < 12 ? "Buongiorno" : hora < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <div className="min-h-screen bg-background">
      {/* Top hero bar */}
      <div className="bg-navy relative overflow-hidden pt-10 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.3)_0%,_transparent_65%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-white/50 text-sm font-medium mb-1">{greeting},</p>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-white leading-tight">
                {profile?.full_name || "Agente"}
              </h1>
              <p className="text-white/40 text-sm mt-1.5">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: it })} · {pratiche.length} pratiche totali
              </p>
            </div>

            {/* View switcher */}
            <div className="flex bg-white/10 rounded-xl p-1 gap-1 self-start sm:self-auto">
              {[
                { id: "lista", label: "Lista", icon: ClipboardList },
                { id: "pipeline", label: "Pipeline", icon: Zap },
                { id: "stats", label: "Statistiche", icon: BarChart2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    view === id ? "bg-white text-navy shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-1 pb-16">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
          {[
            {
              label: "Pratiche Attive",
              value: stats.attive,
              icon: ClipboardList,
              color: "text-blue-600",
              bg: "bg-blue-50",
              trend: "In corso"
            },
            {
              label: "Nuove da gestire",
              value: stats.nuove,
              icon: AlertCircle,
              color: "text-amber-600",
              bg: "bg-amber-50",
              trend: "Da assegnare"
            },
            {
              label: "Consegnate / Chiuse",
              value: stats.chiuse,
              icon: CheckCircle2,
              color: "text-green-600",
              bg: "bg-green-50",
              trend: "Completate"
            },
            {
              label: "Provvigioni maturate",
              value: `€${stats.provvigioneTotale.toLocaleString("it-IT")}`,
              icon: Euro,
              color: "text-electric",
              bg: "bg-electric/5",
              trend: `€${stats.provvigionePagata.toLocaleString("it-IT")} pagati`
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  {React.createElement(kpi.icon, { className: `w-5 h-5 ${kpi.color}` })}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{kpi.trend}</span>
              </div>
              <p className="font-heading font-bold text-2xl text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Status pipeline mini bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_STATUSES.map(s => {
            const count = pratiche.filter(p => p.status === s).length;
            if (!count) return null;
            const cfg = PRATICA_STATUS_COLORS[s] ?? DEFAULT_STATUS_COLOR;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "tutti" : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filterStatus === s ? cfg.badge + " shadow-sm scale-105" : "bg-muted/50 text-muted-foreground border-border/40 hover:border-border"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {s} <span className="opacity-70">·</span> {count}
              </button>
            );
          })}
        </div>

        {/* Content by view */}
        {view === "pipeline" ? (
          <AgentePipelineView pratiche={pratiche} isLoading={isLoading} />
        ) : view === "stats" ? (
          <AgenteStatsChart pratiche={pratiche} />
        ) : (
          <>
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per cliente, veicolo o codice…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-52 h-11">
                  <SelectValue placeholder="Filtra stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli stati</SelectItem>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table / List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground">Nessuna pratica trovata</p>
                <p className="text-sm text-muted-foreground mt-1">Prova a modificare i filtri di ricerca.</p>
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/40 bg-muted/30">
                  <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Codice</p>
                  <p className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
                  <p className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:block">Veicolo</p>
                  <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stato</p>
                  <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Azione</p>
                </div>

                <div className="divide-y divide-border/30">
                  {filtered.map((p, i) => {
                    const cfg = PRATICA_STATUS_COLORS[p.status] ?? DEFAULT_STATUS_COLOR;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors group"
                      >
                        {/* Codice */}
                        <div className="col-span-2">
                          <span className="font-mono text-xs font-bold text-electric">
                            {p.codice || `#${p.id.slice(0, 8).toUpperCase()}`}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.created_at ? format(new Date(p.created_at), "d MMM", { locale: it }) : ""}
                          </p>
                        </div>

                        {/* Cliente */}
                        <div className="col-span-3 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{p.cliente_nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.cliente_email}</p>
                        </div>

                        {/* Veicolo */}
                        <div className="col-span-3 hidden md:flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Car className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.veicolo_marca} {p.veicolo_modello}
                            </p>
                            {p.canone_mensile && (
                              <p className="text-xs text-electric font-semibold">€{p.canone_mensile}/mese</p>
                            )}
                          </div>
                        </div>

                        {/* Stato */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {p.status}
                          </span>
                        </div>

                        {/* Azione */}
                        <div className="col-span-2 flex justify-end">
                          <Link to={`/agente/pratica/${p.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-muted-foreground hover:text-foreground group-hover:bg-muted h-8"
                            >
                              Apri <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="px-5 py-3 border-t border-border/30 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{filtered.length} pratiche mostrate</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}