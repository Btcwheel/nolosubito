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
  BarChart2, ArrowUpRight, ChevronRight, Circle, Trash2, Loader2, Users, Tag, X,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import AdminOverviewCharts from "@/components/admin/AdminOverviewCharts";
import AdminTeam from "@/components/admin/AdminTeam";
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
  { id: "team",       label: "Team",        icon: Users },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab]           = useState("pratiche");
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("tutti");
  const [searchAuto, setSearchAuto]         = useState("");
  const [selectedPraticheIds, setSelectedPraticheIds] = useState(new Set());
  const [confirmDeletePraticheMode, setConfirmDeletePraticheMode] = useState(null); // "all" | "selected"
  const [promoEditId, setPromoEditId]       = useState(null);
  const [promoDiscount, setPromoDiscount]   = useState("10");
  const [promoExpires, setPromoExpires]     = useState("");
  const [promoSegment, setPromoSegment]     = useState("entrambi"); // "piva" | "privati" | "entrambi"
  const [promoServices, setPromoServices]   = useState("");
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

  const savePromo = useMutation({
    mutationFn: ({ id, promo_expires_at, promo_discount_pct, promo_segment, promo_services }) =>
      offersService.update(id, { promo_expires_at, promo_discount_pct, promo_segment, promo_services }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers-admin"] });
      qc.invalidateQueries({ queryKey: ["offers-home-catalog"] });
      setPromoEditId(null);
      toast({ title: "Promo salvata", description: "L'offerta è ora visibile sul sito." });
    },
    onError: () => toast({ title: "Errore", description: "Salvataggio promo fallito.", variant: "destructive" }),
  });

  const removePromo = useMutation({
    mutationFn: (id) => offersService.update(id, { promo_expires_at: null, promo_discount_pct: null, promo_segment: null, promo_services: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers-admin"] });
      qc.invalidateQueries({ queryKey: ["offers-home-catalog"] });
      toast({ title: "Promo rimossa" });
    },
    onError: () => toast({ title: "Errore", description: "Rimozione promo fallita.", variant: "destructive" }),
  });

  function openPromoEdit(o) {
    setPromoEditId(o.id);
    setPromoDiscount(o.promo_discount_pct ? String(o.promo_discount_pct) : "10");
    setPromoServices(o.promo_services || "");
    setPromoSegment(
      o.promo_segment === "P.IVA"   ? "piva"    :
      o.promo_segment === "Privati" ? "privati"  :
      "entrambi"
    );
    // Se c'è già una scadenza la precompilo, altrimenti default +3gg
    if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
      setPromoExpires(new Date(o.promo_expires_at).toISOString().slice(0, 16));
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setPromoExpires(d.toISOString().slice(0, 16));
    }
  }

  function quickDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setPromoExpires(d.toISOString().slice(0, 16));
  }

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

  const deleteAllPraticheMutation = useMutation({
    mutationFn: () => praticheService.deleteAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pratiche-admin"] });
      toast({ title: "Tutte le pratiche eliminate" });
      setConfirmDeletePraticheMode(null);
      setSelectedPraticheIds(new Set());
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const deleteSelectedPraticheMutation = useMutation({
    mutationFn: () => praticheService.deleteSelected([...selectedPraticheIds]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pratiche-admin"] });
      toast({ title: `${selectedPraticheIds.size} pratiche eliminate` });
      setConfirmDeletePraticheMode(null);
      setSelectedPraticheIds(new Set());
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const [confirmDeletePratiche, setConfirmDeletePratiche] = useState(null);

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
                    ? "style={{backgroundColor:'#71BAED'}}/15 style={{borderColor:'#71BAED'}}/30"
                    : "bg-white/[0.05] border-white/[0.08]"
                  }`}
                >
                  <p className={`font-heading font-bold text-2xl ${k.accent ? "style={{color:'#71BAED'}}" : "text-white"}`}>
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
                    activeTab === id ? "style={{backgroundColor:'#71BAED'}}/10 style={{color:'#71BAED'}}" : "bg-muted text-muted-foreground"
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
              {selectedPraticheIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeletePraticheMode("selected")}
                  className="h-11 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-xl"
                >
                  <Trash2 className="w-4 h-4" /> Elimina selezionati ({selectedPraticheIds.size})
                </Button>
              )}
              {filteredPratiche.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeletePraticheMode("all")}
                  className="h-11 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-xl"
                >
                  <Trash2 className="w-4 h-4" /> Elimina tutto
                </Button>
              )}
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
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border cursor-pointer"
                            checked={filteredPratiche.length > 0 && filteredPratiche.every(p => selectedPraticheIds.has(p.id))}
                            onChange={e => {
                              if (e.target.checked) setSelectedPraticheIds(new Set(filteredPratiche.map(p => p.id)));
                              else setSelectedPraticheIds(new Set());
                            }}
                          />
                        </th>
                        {["Codice", "Cliente", "Veicolo", "Stato", "Agente", "Operatore", "Data", ""].map((h, i) => (
                          <th key={i} className={`text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider ${
                            i === 2 ? "hidden md:table-cell" :
                            i === 4 || i === 5 || i === 6 ? "hidden lg:table-cell" :
                            i === 7 ? "text-right" : ""
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
                            className={`hover:bg-muted/30 transition-colors group ${selectedPraticheIds.has(p.id) ? "bg-destructive/5" : ""}`}
                          >
                            {/* Checkbox */}
                            <td className="px-4 py-3.5 w-10">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border cursor-pointer"
                                checked={selectedPraticheIds.has(p.id)}
                                onChange={e => {
                                  const next = new Set(selectedPraticheIds);
                                  if (e.target.checked) next.add(p.id); else next.delete(p.id);
                                  setSelectedPraticheIds(next);
                                }}
                              />
                            </td>
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

                            {/* Operatore */}
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              {p.operatore_nome
                                ? <span className="font-medium text-foreground text-sm">{p.operatore_nome}</span>
                                : <span className="italic text-muted-foreground/40 text-xs">Non assegnata</span>
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

                    {/* ── Promo button / form ── */}
                    {promoEditId === o.id ? (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-orange-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Imposta Promozione
                          </p>
                          <button onClick={() => setPromoEditId(null)} className="text-orange-400 hover:text-orange-600 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Segmento */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Visibile a</label>
                          <div className="flex gap-1.5">
                            {[
                              { value: "entrambi", label: "Entrambi" },
                              { value: "piva",     label: "P.IVA" },
                              { value: "privati",  label: "Privati" },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPromoSegment(opt.value)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  promoSegment === opt.value
                                    ? "bg-orange-500 text-white border-orange-500"
                                    : "bg-white text-orange-600 border-orange-200 hover:bg-orange-100"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sconto % */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Sconto %</label>
                          <Input
                            type="number"
                            min="1"
                            max="99"
                            value={promoDiscount}
                            onChange={e => setPromoDiscount(e.target.value)}
                            className="h-8 text-sm rounded-lg"
                          />
                        </div>

                        {/* Servizi aggiuntivi */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Servizi aggiuntivi</label>
                          <textarea
                            value={promoServices}
                            onChange={e => setPromoServices(e.target.value)}
                            placeholder="es. I primi 3 mesi sono gratis"
                            rows={2}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        {/* Scade il */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Scade il</label>
                          <Input
                            type="datetime-local"
                            value={promoExpires}
                            onChange={e => setPromoExpires(e.target.value)}
                            className="h-8 text-sm rounded-lg"
                          />
                          <div className="flex gap-1.5 flex-wrap">
                            {[1, 3, 7, 10, 15, 30].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => quickDays(n)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer border border-orange-200"
                              >
                                +{n}g
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Azioni */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            disabled={!promoExpires || !promoDiscount || savePromo.isPending}
                            onClick={() => savePromo.mutate({
                              id: o.id,
                              promo_expires_at:  new Date(promoExpires).toISOString(),
                              promo_discount_pct: parseFloat(promoDiscount),
                              promo_segment:  promoSegment === "piva" ? "P.IVA" : promoSegment === "privati" ? "Privati" : null,
                              promo_services: promoServices.trim() || null,
                            })}
                          >
                            {savePromo.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salva Promo"}
                          </Button>
                          {(o.promo_expires_at || o.promo_discount_pct) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={removePromo.isPending}
                              onClick={() => removePromo.mutate(o.id)}
                            >
                              Rimuovi
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openPromoEdit(o)}
                        className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                          o.promo_expires_at && new Date(o.promo_expires_at) > new Date()
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {o.promo_expires_at && new Date(o.promo_expires_at) > new Date()
                          ? `🔥 Promo attiva -${Math.round(o.promo_discount_pct)}%`
                          : "Aggiungi Promo"}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: STATISTICHE ── */}
        {activeTab === "team" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <AdminTeam />
          </motion.div>
        )}

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

      {(confirmDeletePraticheMode || confirmDeletePratiche) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-center mb-2">
              {confirmDeletePraticheMode === "selected"
                ? `Elimina ${selectedPraticheIds.size} pratiche`
                : "Elimina tutte le pratiche"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {confirmDeletePraticheMode === "selected"
                ? `Stai per eliminare ${selectedPraticheIds.size} pratiche selezionate. Questa azione non può essere annullata.`
                : `Stai per eliminare ${pratiche.length} pratiche. Questa azione non può essere annullata.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setConfirmDeletePraticheMode(null); setConfirmDeletePratiche(null); }} className="flex-1">Annulla</Button>
              <Button
                onClick={() => confirmDeletePraticheMode === "selected" ? deleteSelectedPraticheMutation.mutate() : deleteAllPraticheMutation.mutate()}
                disabled={deleteAllPraticheMutation.isPending || deleteSelectedPraticheMutation.isPending}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2"
              >
                {(deleteAllPraticheMutation.isPending || deleteSelectedPraticheMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmDeletePraticheMode === "selected" ? "Elimina selezionati" : "Elimina tutto"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
