import React, { useState, useMemo } from "react";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function CommercialOffers() {
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");

  const { data: rawVehicles = [], isLoading } = useQuery({
    queryKey: ["offers-commercial"],
    queryFn: () => offersService.listWithMinPrice(),
  });

  const vehicles = useMemo(() =>
    rawVehicles.filter(v => v.category === "Commercial Van"),
    [rawVehicles]
  );

  const fuelTypes = useMemo(() => [...new Set(vehicles.map(o => o.fuel_type).filter(Boolean))], [vehicles]);

  const filtered = useMemo(() => {
    let result = vehicles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => `${v.make} ${v.model}`.toLowerCase().includes(q));
    }
    if (fuelFilter !== "all") {
      result = result.filter(v => v.fuel_type === fuelFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "price_asc") return (a.monthly_rent || 0) - (b.monthly_rent || 0);
      if (sortBy === "price_desc") return (b.monthly_rent || 0) - (a.monthly_rent || 0);
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
    });
    return result;
  }, [vehicles, search, fuelFilter, sortBy]);

  return (
    <div className="bg-navy">
      <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6">
            <Truck className="w-4 h-4 text-electric" />
            <span className="text-sm text-white/70">Veicoli Commerciali</span>
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Furgoni & Van Commerciali
          </h1>
          <p className="mt-2 text-white/50 max-w-xl">
            Furgoni, van cargo e veicoli commerciali leggeri in noleggio a lungo termine. Manutenzione e assicurazione incluse.
          </p>
        </motion.div>
      </div>

      <div className="bg-background rounded-t-3xl min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca furgoni…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={fuelFilter} onValueChange={setFuelFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11">
                <SelectValue placeholder="Carburante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i carburanti</SelectItem>
                {fuelTypes.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-44 h-11">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_asc">Prezzo: crescente</SelectItem>
                <SelectItem value="price_desc">Prezzo: decrescente</SelectItem>
                <SelectItem value="name">Nome A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nessun veicolo commerciale disponibile.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {vehicles.length === 0
                  ? "Aggiungi veicoli con categoria 'Commercial Van' nel database."
                  : "Prova a modificare i filtri di ricerca."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v, i) => (
                <VehicleCard key={`${v.make}-${v.model}`} vehicle={v} index={i} segment="Fleet" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}