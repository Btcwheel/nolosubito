import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
      <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-electric text-xs font-bold uppercase tracking-widest mb-2">Noleggio a Lungo Termine</p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">Offerte Business</h1>
          <p className="mt-2 text-white/50 max-w-xl text-sm sm:text-base">
            Gamma completa in NLT per P.IVA e aziende. Assicurazione, manutenzione e soccorso stradale inclusi.
          </p>
        </motion.div>
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
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> veicoli trovati
              </p>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs text-electric hover:underline cursor-pointer">
                  Cancella filtri
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
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Nessun veicolo trovato.</p>
              <button onClick={clearFilters} className="text-sm text-electric mt-2 hover:underline cursor-pointer">
                Rimuovi i filtri
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
