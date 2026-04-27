import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usatoService } from "@/services/usato";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Fuel, Gauge, Calendar, MapPin, ExternalLink, Zap, Leaf, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CARBURANTE_COLORS = {
  "Elettrico": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Ibrido":    "bg-teal-50 text-teal-700 border-teal-200",
  "Diesel":    "bg-slate-50 text-slate-600 border-slate-200",
  "Benzina":   "bg-orange-50 text-orange-600 border-orange-200",
};

const FUEL_ICONS = {
  "Elettrico": Zap,
  "Ibrido":    Leaf,
};

function UsatoCard({ v, i }) {
  const FuelIcon = FUEL_ICONS[v.carburante] ?? Fuel;
  const fuelClass = CARBURANTE_COLORS[v.carburante] ?? "bg-muted text-muted-foreground border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
      className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-black/8 hover:border-electric/25 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        <img
          src={v.immagine}
          alt={`${v.marca} ${v.modello}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Badges top */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="text-[11px] font-bold bg-[#2D2E82] text-white px-2.5 py-1 rounded-full">
            Usato
          </span>
          {v.targa_prova && (
            <span className="text-[11px] font-bold bg-electric text-white px-2.5 py-1 rounded-full">
              Targa prova
            </span>
          )}
        </div>

        {/* AS24 badge */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold bg-black/60 text-white/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600] inline-block" />
            AutoScout24
          </span>
        </div>

        {/* Make + model */}
        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{v.marca}</p>
          <h3 className="font-heading font-bold text-lg text-white leading-tight">{v.modello}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Specs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${fuelClass}`}>
            <FuelIcon className="w-2.5 h-2.5" />
            {v.carburante}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            <Calendar className="w-2.5 h-2.5" />
            {v.anno}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            <Gauge className="w-2.5 h-2.5" />
            {v.km.toLocaleString("it-IT")} km
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {v.potenza_cv} CV
          </span>
        </div>

        {/* Descrizione */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {v.descrizione}
        </p>

        {/* Price + CTA */}
        <div className="rounded-xl bg-gradient-to-br from-[#2D2E82] to-navy p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/50 leading-none mb-1">Prezzo</p>
            <div className="flex items-baseline gap-0.5">
              <span className="font-heading font-bold text-2xl text-white leading-none">
                €{v.prezzo.toLocaleString("it-IT")}
              </span>
            </div>
            <p className="text-[10px] text-white/35 mt-0.5">IVA inclusa</p>
          </div>

          <a
            href={v.url_as24}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0"
          >
            Vedi annuncio
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-14 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function Usato() {
  const [search, setSearch]         = useState("");
  const [filterFuel, setFilterFuel] = useState("tutti");
  const [sortBy, setSortBy]         = useState("default");

  const { data: veicoli = [], isLoading } = useQuery({
    queryKey: ["usato"],
    queryFn: () => usatoService.list(),
  });

  const carburanti = useMemo(() =>
    ["tutti", ...new Set(veicoli.map(v => v.carburante))],
  [veicoli]);

  const filtered = useMemo(() => {
    let list = veicoli.filter(v => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        v.marca.toLowerCase().includes(q) ||
        v.modello.toLowerCase().includes(q) ||
        v.colore.toLowerCase().includes(q);
      const matchFuel = filterFuel === "tutti" || v.carburante === filterFuel;
      return matchSearch && matchFuel;
    });

    if (sortBy === "prezzo-asc")  list = [...list].sort((a, b) => a.prezzo - b.prezzo);
    if (sortBy === "prezzo-desc") list = [...list].sort((a, b) => b.prezzo - a.prezzo);
    if (sortBy === "km-asc")      list = [...list].sort((a, b) => a.km - b.km);
    if (sortBy === "anno-desc")   list = [...list].sort((a, b) => b.anno - a.anno);

    return list;
  }, [veicoli, search, filterFuel, sortBy]);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2D2E82] via-[#252670] to-navy pt-28 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.25)_0%,_transparent_65%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* AS24 badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#FF6600]" />
            <span className="text-xs font-bold text-white/80 tracking-wide">Powered by AutoScout24</span>
          </div>

          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-3">
            Veicoli Usati
          </h1>
          <p className="text-white/50 text-lg max-w-xl">
            Selezione di usato garantito, verificato e pronto consegna.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { value: `${veicoli.length}`, label: "Veicoli disponibili" },
              { value: "Garantiti",         label: "Tutti certificati" },
              { value: "Pronta",            label: "Consegna" },
            ].map(s => (
              <div key={s.label} className="border-l-2 border-electric/40 pl-4">
                <p className="font-heading font-bold text-xl text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca marca, modello, colore…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fuel filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            {carburanti.map(f => (
              <button
                key={f}
                onClick={() => setFilterFuel(f)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterFuel === f
                    ? "bg-[#2D2E82] text-white"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f === "tutti" ? "Tutti" : f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-border/50 bg-background text-sm px-3 text-foreground cursor-pointer"
          >
            <option value="default">Ordina per</option>
            <option value="prezzo-asc">Prezzo ↑</option>
            <option value="prezzo-desc">Prezzo ↓</option>
            <option value="km-asc">Km ↑</option>
            <option value="anno-desc">Anno più recente</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-semibold text-foreground text-lg">Nessun veicolo trovato</p>
            <p className="text-muted-foreground text-sm mt-1">Prova a modificare i filtri</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              {filtered.length} veicol{filtered.length === 1 ? "o" : "i"} trovat{filtered.length === 1 ? "o" : "i"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v, i) => <UsatoCard key={v.id} v={v} i={i} />)}
            </div>
          </>
        )}

        {/* AS24 attribution */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <span className="w-2 h-2 rounded-full bg-[#FF6600]" />
          Annunci forniti da{" "}
          <a
            href="https://www.autoscout24.it/concessionari/nolosubito-srl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            AutoScout24 — Nolosubito S.r.l.
          </a>
          {" "}· I prezzi sono indicativi
        </div>
      </div>
    </div>
  );
}
