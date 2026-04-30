import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usatoService } from "@/services/usato";
import { motion } from "framer-motion";
import { Search, Fuel, Gauge, Calendar, ExternalLink, Zap, Leaf, SlidersHorizontal, X, ArrowRight, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/ListingLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const FUEL_ICONS = {
  "Elettrico": Zap,
  "Ibrido":    Leaf,
};

function SpecBox({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-spec rounded-[8px] p-2 min-h-[56px]">
      <Icon className="w-4 h-4 text-navy/60" />
      <span className="text-[10px] font-bold text-[#464651] leading-none text-center">{label}</span>
    </div>
  );
}

function UsatoCard({ v, i }) {
  const FuelIcon = FUEL_ICONS[v.carburante] ?? Fuel;

  const badge = (() => {
    if (v.carburante === "Elettrico") return { icon: Zap,  text: "0 Emissioni CO₂", color: "text-green-700", border: "border-green-200" };
    if (v.carburante === "Ibrido")   return { icon: Leaf, text: "Ibrido",            color: "text-lime-700",  border: "border-lime-200" };
    if (v.targa_prova)               return { icon: null,  text: "Targa Prova",      color: "text-navy", border: "border-navy/20" };
    return null;
  })();

  const specs = [
    { icon: Calendar, label: String(v.anno) },
    { icon: Gauge,    label: `${v.km.toLocaleString("it-IT")} km` },
    { icon: FuelIcon, label: v.carburante },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
      className="h-full"
    >
      <div className="h-full flex flex-col bg-white border border-frame rounded-2xl shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)] group">

        {/* Image */}
        <div className="relative bg-[#f8fafc] overflow-hidden h-[200px]">
          <img
            src={v.immagine}
            alt={`${v.marca} ${v.modello}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Top-right badge */}
          {badge && (
            <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border ${badge.border} rounded-[8px] px-3 py-[5px] max-w-[calc(100%-24px)]`}>
              {badge.icon && <badge.icon className={`w-3 h-3 shrink-0 ${badge.color}`} />}
              <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${badge.color} truncate`}>
                {badge.text}
              </span>
            </div>
          )}

          {/* AS24 attribution */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-semibold bg-black/50 text-white/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600] inline-block shrink-0" />
              AutoScout24
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col justify-between p-6">

          {/* Label + Title + Subtitle */}
          <div className="mb-4">
            <p className="text-[12px] font-bold text-[#777682] uppercase tracking-[1.2px] leading-none mb-[5px]">
              USATO SICURO
            </p>
            <h3 className="text-[20px] font-bold text-navy-dark leading-7">
              {v.marca} {v.modello}
            </h3>
            {v.descrizione && (
              <p className="text-[14px] text-[#464651] leading-snug mt-0.5 line-clamp-1">
                {v.descrizione}
              </p>
            )}
          </div>

          {/* Spec boxes */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {specs.map(({ icon: Icon, label }, idx) => (
              <SpecBox key={idx} icon={Icon} label={label} />
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#777682] leading-none mb-1">Prezzo</p>
              <div className="flex items-baseline gap-0.5 flex-wrap">
                <span className="text-[28px] sm:text-[32px] font-bold text-navy-dark leading-none">
                  €{v.prezzo.toLocaleString("it-IT")}
                </span>
              </div>
              <p className="text-[10px] italic text-[#777682] mt-1">IVA inclusa · {v.potenza_cv} CV</p>
            </div>

            <a
              href={v.url_as24}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-12 h-12 bg-electric rounded-xl flex items-center justify-center shrink-0 transition-colors hover:bg-electric/85"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-frame rounded-2xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]">
      <Skeleton className="h-[200px] w-full" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function Usato() {
  const [search, setSearch]             = useState("");
  const [brandFilter, setBrandFilter]   = useState("tutti");
  const [filterFuel, setFilterFuel]     = useState("tutti");
  const [sortBy, setSortBy]             = useState("default");
  const [filterOpen, setFilterOpen]     = useState(false);

  const { data: veicoli = [], isLoading } = useQuery({
    queryKey: ["usato"],
    queryFn: () => usatoService.list(),
  });

  const brands = useMemo(() =>
    ["tutti", ...new Set(veicoli.map(v => v.marca?.trim().toUpperCase()).filter(Boolean))].sort(),
  [veicoli]);

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
      const matchBrand = brandFilter === "tutti" || v.marca?.trim().toUpperCase() === brandFilter;
      const matchFuel  = filterFuel === "tutti" || v.carburante === filterFuel;
      return matchSearch && matchBrand && matchFuel;
    });

    if (sortBy === "prezzo-asc")  list = [...list].sort((a, b) => a.prezzo - b.prezzo);
    if (sortBy === "prezzo-desc") list = [...list].sort((a, b) => b.prezzo - a.prezzo);
    if (sortBy === "km-asc")      list = [...list].sort((a, b) => a.km - b.km);
    if (sortBy === "anno-desc")   list = [...list].sort((a, b) => b.anno - a.anno);

    return list;
  }, [veicoli, search, brandFilter, filterFuel, sortBy]);

  const activeFilters = [brandFilter !== "tutti", filterFuel !== "tutti"].filter(Boolean).length;

  const FiltersContent = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Marca</p>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Tutte le marche" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte le marche</SelectItem>
            {brands.filter(b => b !== "tutti").map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Carburante</p>
        <Select value={filterFuel} onValueChange={setFilterFuel}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Tutti i carburanti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i carburanti</SelectItem>
            {carburanti.filter(f => f !== "tutti").map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ordina per</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Ordina per</SelectItem>
            <SelectItem value="prezzo-asc">Prezzo ↑</SelectItem>
            <SelectItem value="prezzo-desc">Prezzo ↓</SelectItem>
            <SelectItem value="km-asc">Km ↑</SelectItem>
            <SelectItem value="anno-desc">Anno più recente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeFilters > 0 && (
        <Button variant="ghost" onClick={() => { setBrandFilter("tutti"); setFilterFuel("tutti"); setSortBy("default"); }} className="w-full text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4 mr-1" /> Cancella filtri
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">

      <PageHeader
        eyebrow="Usato Garantito"
        title="Veicoli Usati"
        description="Selezione di usato garantito, verificato e pronto consegna."
      />

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
              className="pl-9 h-11"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop filters */}
          <div className="hidden sm:flex gap-3">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-44 h-11">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutte le marche</SelectItem>
                {brands.filter(b => b !== "tutti").map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterFuel} onValueChange={setFilterFuel}>
              <SelectTrigger className="w-44 h-11">
                <SelectValue placeholder="Carburante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti i carburanti</SelectItem>
                {carburanti.filter(f => f !== "tutti").map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-11">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Ordina per</SelectItem>
                <SelectItem value="prezzo-asc">Prezzo ↑</SelectItem>
                <SelectItem value="prezzo-desc">Prezzo ↓</SelectItem>
                <SelectItem value="km-asc">Km ↑</SelectItem>
                <SelectItem value="anno-desc">Anno più recente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile filter button */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden h-11 px-4 relative cursor-pointer">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtri
                {activeFilters > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-electric text-white text-[10px]">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left">Filtra veicoli</SheetTitle>
              </SheetHeader>
              <FiltersContent />
              <Button className="w-full mt-6 h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl cursor-pointer"
                onClick={() => setFilterOpen(false)}>
                Mostra {filtered.length} veicoli
              </Button>
            </SheetContent>
          </Sheet>
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
