import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { offersService } from "@/services/offers";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Eye, ClipboardList, Car, TrendingUp,
  CheckCircle2, Clock, AlertCircle, Zap, Layers,
  BarChart2, ArrowUpRight, ChevronRight, Circle
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import AdminOverviewCharts from "@/components/admin/AdminOverviewCharts";
import { PRATICA_STATUS_COLORS, DEFAULT_STATUS_COLOR } from "@/lib/praticaStatus";

const FUEL_LABELS = { Electric: "Elettrico", Hybrid: "Ibrido", Diesel: "Diesel", Petrol: "Benzina" };
const FUEL_COLORS = {
  Electric: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hybrid:   "bg-lime-50   text-lime-700   border-lime-200",
  Diesel:   "bg-slate-50  text-slate-600  border-slate-200",
  Petrol:   "bg-orange-50 text-orange-700 border-orange-200",
};

const TABS = [
  { id: "pratiche",   label: "Pratiche",    icon: ClipboardList },
  { id: "catalogo",   label: "Catalogo",    icon: Car },
  { id: "analytics",  label: "Statistiche", icon: BarChart2 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab]       = useState("pratiche");
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("tutti");
  const [searchAuto, setSearchAuto]     = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: pratiche = [], isLoading: loadingPratiche } = useQuery({
    queryKey: ["pratiche-admin"],
    queryFn: () => praticheService.list(),
  });

  const { data: offers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ["offers-admin"],
    queryFn: () => offersService.list(),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => offersService.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers-admin"] }),
    onError: () => toast({ title: "Errore", description: "Aggiornamento fallito.", variant: "destructive" }),
  });

  const stats = useMemo(() => ({
    totale:       pratiche.length,
    nuove:        pratiche.filter(p => p.status === "Nuova").length,
    inCorso:      pratiche.filter(p => !["Nuova","Consegnata","Chiusa"].includes(p.status)).length,
    consegnate:   pratiche.filter(p => p.status === "Consegnata").length,
    canone:       pratiche.filter(p => p.canone_mensile).reduce((s, p) => s + (p.canone_mensile || 0), 0),
    agenti:       new Set(pratiche.map(p => p.agente_id).filter(Boolean)).size,
  }), [pratiche]);

  const filteredPratiche = useMemo(() => pratiche.filter(p => {
    const q = search.toLowerCase();
    return (!search ||
      p.cliente_nome?.toLowerCase().includes(q) ||
      p.cliente_email?.toLowerCase().includes(q) ||
      p.codice?.toLowerCase().includes(q)
    ) && (filterStatus === "tutti" || p.status === filterStatus);
  }), [pratiche, search, filterStatus]);

  const filteredOffers = useMemo(() =>
    offers.filter(o => !searchAuto || `${o.make} ${o.model}`.toLowerCase().includes(searchAuto.toLowerCase())),
    [offers, searchAuto]
  );

  const hora = new Date().getHours();
  const greeting = hora < 12 ? "Buongiorno" : hora < 18 ? "Buon pomeriggio" : "Buonasera";
  const name = profile?.full_name?.split(" ")[0] || "Admin";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero banner ── */}
      <div className="bg-navy relative overflow-hidden pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.25)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

            {/* Left: greeting */}
            <div>
              <p className="text-white/45 text-sm font-medium mb-1">{greeting},</p>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-white leading-tight">
                {name} <span className="text-electric">·</span> Admin
              </h1>
              <p className="text-white/35 text-sm mt-1.5">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
              </p>
            </div>

            {/* Right: 4 hero KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Totale pratiche", value: stats.totale,   accent: false },
                { label: "Nuove",           value: stats.nuove,    accent: stats.nuove > 0 },
                { label: "In lavorazione",  value: stats.inCorso,  accent: false },
                { label: "Consegnate",      value: stats.consegnate, accent: false },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-2xl px-4 py-3.5 border ${k.accent
                    ? "bg-electric/15 border-electric/30"
                    : "bg-white/[0.05] border-white/[0.08]"
                  }`}
                >
                  <p className={`font-heading font-bold text-2xl ${k.accent ? "text-electric" : "text-white"}`}>
                    {k.value}
                  </p>
                  <p className="text-white/45 text-xs mt-0.5 leading-tight">{k.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sub-stats strip */}
          <div className="flex flex-wrap gap-5 mt-8 pt-6 border-t border-white/8">
            {[
              { label: "Canone mensile portfolio", value: `€ ${stats.canone.toLocaleString("it-IT")}` },
              { label: "Agenti attivi",             value: stats.agenti },
              { label: "Veicoli in catalogo",       value: offers.length },
              { label: "Veicoli attivi",            value: offers.filter(o => o.is_active).length },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{s.value}</span>
                <span className="text-white/35 text-xs">{s.label}</span>
              </div>
            ))}
            <div className="ml-auto hidden sm:block">
              <Link to="/cms">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white hover:bg-white/12 text-xs font-semibold transition-all cursor-pointer">
                  <Layers className="w-3.5 h-3.5" /> Gestione CMS
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Tab bar */}
        <div className="flex gap-1 mt-6 mb-6 bg-muted/50 rounded-2xl p-1 w-fit border border-border/40">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = id === "pratiche" ? pratiche.length : id === "catalogo" ? offers.length : null;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === id
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count !== null && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === id ? "bg-electric/10 text-electric" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB: PRATICHE ── */}
        {activeTab === "pratiche" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome, email o codice…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-56 h-11 rounded-xl">
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli stati</SelectItem>
                  {Object.keys(PRATICA_STATUS_COLORS).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              {loadingPratiche ? (
                <div className="p-6 space-y-3">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : filteredPratiche.length === 0 ? (
                <div className="py-20 text-center">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nessuna pratica trovata.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        {["Codice", "Cliente", "Veicolo", "Stato", "Agente", "Data", ""].map((h, i) => (
                          <th key={i} className={`text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider ${
                            i === 2 ? "hidden md:table-cell" :
                            i === 4 || i === 5 ? "hidden lg:table-cell" :
                            i === 6 ? "text-right" : ""
                          }`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/25">
                      {filteredPratiche.map((p, idx) => {
                        const statusCfg = PRATICA_STATUS_COLORS[p.status] ?? DEFAULT_STATUS_COLOR;
                        return (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            {/* Codice */}
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs font-bold text-electric tracking-wide">
                                {p.codice}
                              </span>
                            </td>

                            {/* Cliente */}
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-foreground text-sm leading-none">{p.cliente_nome}</p>
                              <p className="text-xs text-muted-foreground mt-1">{p.cliente_email}</p>
                            </td>

                            {/* Veicolo */}
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              {p.veicolo_marca || p.veicolo_modello ? (
                                <div>
                                  <p className="text-sm text-foreground font-medium">{p.veicolo_marca} {p.veicolo_modello}</p>
                                  {p.canone_mensile && (
                                    <p className="text-xs font-bold text-electric mt-0.5">€{p.canone_mensile}/mese</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/50 italic">—</span>
                              )}
                            </td>

                            {/* Stato */}
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusCfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                {p.status}
                              </span>
                            </td>

                            {/* Agente */}
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              {p.agente_nome
                                ? <span className="text-sm text-foreground">{p.agente_nome}</span>
                                : <span className="text-xs text-muted-foreground/50 italic">Non assegnato</span>
                              }
                            </td>

                            {/* Data */}
                            <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                              {p.created_at ? format(new Date(p.created_at), "d MMM yyyy", { locale: it }) : "—"}
                            </td>

                            {/* Action */}
                            <td className="px-4 py-3.5 text-right">
                              <Link to={`/admin/pratica/${p.id}`}>
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer group-hover:text-electric">
                                  Apri <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer count */}
              {!loadingPratiche && filteredPratiche.length > 0 && (
                <div className="px-4 py-3 border-t border-border/30 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    {filteredPratiche.length} pratica{filteredPratiche.length !== 1 ? "he" : ""} {filterStatus !== "tutti" ? `· filtro: ${filterStatus}` : ""}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB: CATALOGO ── */}
        {activeTab === "catalogo" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca marca o modello…"
                  value={searchAuto}
                  onChange={e => setSearchAuto(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <Link to="/cms">
                <Button variant="outline" className="h-11 gap-2 rounded-xl">
                  <Layers className="w-4 h-4" /> Gestisci nel CMS
                </Button>
              </Link>
            </div>

            {loadingOffers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOffers.map((o, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-card border rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${
                      o.is_active ? "border-border/50" : "border-border/25 opacity-55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-electric uppercase tracking-widest mb-0.5">{o.make}</p>
                        <p className="font-heading font-bold text-lg text-foreground leading-tight truncate">{o.model}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{o.category}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${FUEL_COLORS[o.fuel_type] || "bg-muted text-muted-foreground border-border"}`}>
                        {FUEL_LABELS[o.fuel_type] || o.fuel_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {o.power_hp && <span>{o.power_hp} CV</span>}
                      {o.power_hp && o.co2_emissions != null && <span className="text-border">·</span>}
                      {o.co2_emissions != null && (
                        <span className={o.co2_emissions === 0 ? "text-emerald-600 font-semibold" : ""}>
                          {o.co2_emissions === 0 ? "0 g CO₂" : `${o.co2_emissions} g/km`}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleActive.mutate({ id: o.id, is_active: !o.is_active })}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        o.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "bg-muted text-muted-foreground border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      }`}
                    >
                      {o.is_active ? "✓ Attivo — clicca per disattivare" : "Disattivato — clicca per attivare"}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: STATISTICHE ── */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {loadingPratiche ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ) : (
              <AdminOverviewCharts pratiche={pratiche} />
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
