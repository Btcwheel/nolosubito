import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, Zap, Shield, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function BusinessOffers() {
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fuelFilter, setFuelFilter]       = useState("all");
  const [sortBy, setSortBy]               = useState("price_asc");
  const [filterOpen, setFilterOpen]       = useState(false);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-business"],
    queryFn: () => offersService.listWithMinPrice("P.IVA"),
  });

  const categories = useMemo(() => [...new Set(vehicles.map(v => v.category).filter(Boolean))], [vehicles]);
  const fuelTypes  = useMemo(() => [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))], [vehicles]);

  const filtered = useMemo(() => {
    let result = [...vehicles];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => `${v.make} ${v.model}`.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") result = result.filter(v => v.category === categoryFilter);
    if (fuelFilter !== "all")     result = result.filter(v => v.fuel_type === fuelFilter);
    result.sort((a, b) => {
      if (sortBy === "price_asc")  return (a.monthly_rent ?? 0) - (b.monthly_rent ?? 0);
      if (sortBy === "price_desc") return (b.monthly_rent ?? 0) - (a.monthly_rent ?? 0);
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
    });
    return result;
  }, [vehicles, search, categoryFilter, fuelFilter, sortBy]);

  const activeFilters = [categoryFilter, fuelFilter].filter(f => f !== "all").length;

  const clearFilters = () => {
    setCategoryFilter("all");
    setFuelFilter("all");
    setSortBy("price_asc");
  };

  const FiltersContent = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categoria</p>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Tutte le categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alimentazione</p>
        <Select value={fuelFilter} onValueChange={setFuelFilter}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Tutti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            {fuelTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ordina per</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_asc">Prezzo: crescente</SelectItem>
            <SelectItem value="price_desc">Prezzo: decrescente</SelectItem>
            <SelectItem value="name">Nome A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeFilters > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4 mr-1" /> Cancella filtri
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-navy">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-electric/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-electric/5 blur-3xl pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative pt-24 sm:pt-28 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-electric tracking-widest uppercase bg-electric/10 border border-electric/20 rounded-full px-3 py-1 mb-4">
              <Zap className="w-3 h-3" /> Noleggio a Lungo Termine
            </span>
            <h1 className="font-heading font-bold text-3xl sm:text-5xl text-white leading-tight">
              Offerte Business
            </h1>
            <p className="mt-3 text-white/50 max-w-xl text-sm sm:text-base leading-relaxed">
              Gamma completa NLT per P.IVA e aziende.<br className="hidden sm:block" />
              Assicurazione, manutenzione e soccorso stradale inclusi nel canone.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon: Shield, label: "Kasko inclusa" },
                { icon: Wrench, label: "Manutenzione inclusa" },
                { icon: Zap,    label: "Auto sostitutiva H24" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Icon className="w-3 h-3 text-electric" /> {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-background rounded-t-3xl min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Search + Filter bar */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca marca o modello…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Desktop filters — inline */}
            <div className="hidden sm:flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44 h-11">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger className="w-36 h-11">
                  <SelectValue placeholder="Carburante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {fuelTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Prezzo ↑</SelectItem>
                  <SelectItem value="price_desc">Prezzo ↓</SelectItem>
                  <SelectItem value="name">Nome A–Z</SelectItem>
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
                <Button
                  className="w-full mt-6 h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl cursor-pointer"
                  onClick={() => setFilterOpen(false)}
                >
                  Mostra {filtered.length} veicoli
                </Button>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results count */}
          {!isLoading && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-lg text-foreground">{filtered.length}</span>
                <span className="text-sm text-muted-foreground">veicoli disponibili</span>
                {activeFilters > 0 && (
                  <span className="text-[11px] font-semibold bg-electric/10 text-electric px-2 py-0.5 rounded-full">
                    {activeFilters} filtri attivi
                  </span>
                )}
              </div>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs text-electric hover:underline cursor-pointer flex items-center gap-1">
                  <X className="w-3 h-3" /> Cancella filtri
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-heading font-semibold text-lg text-foreground">Nessun veicolo trovato</p>
              <p className="text-sm text-muted-foreground mt-1.5 mb-5">Prova a modificare i filtri di ricerca.</p>
              <button onClick={clearFilters} className="text-sm font-semibold text-electric hover:underline cursor-pointer">
                Rimuovi tutti i filtri
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
