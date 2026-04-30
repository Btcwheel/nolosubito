import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import VehicleCard from "../components/vehicles/VehicleCard";
import { PageHeader, FilterBar, NativeSelect, CardSkeleton, Pagination } from "@/components/layout/ListingLayout";

const PAGE_SIZE = 12;

export default function ReuseOffers() {
  const [search,         setSearch]         = useState("");
  const [brandFilter,    setBrandFilter]    = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fuelFilter,     setFuelFilter]     = useState("all");
  const [sortBy,         setSortBy]         = useState("price_asc");
  const [currentPage,    setCurrentPage]    = useState(1);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-reuse"],
    queryFn:  () => offersService.listWithMinPrice("ReUse"),
    staleTime: 5 * 60 * 1000,
  });

  const brands     = useMemo(() => [...new Set(vehicles.map(v => v.make?.trim().toUpperCase()).filter(Boolean))].sort(), [vehicles]);
  const categories = useMemo(() => [...new Set(vehicles.map(v => v.category).filter(Boolean))].sort(), [vehicles]);
  const fuelTypes  = useMemo(() => [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))], [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...vehicles]
      .filter(v => !q || `${v.make} ${v.model}`.toLowerCase().includes(q))
      .filter(v => brandFilter === "all"    || v.make?.trim().toUpperCase() === brandFilter)
      .filter(v => categoryFilter === "all" || v.category === categoryFilter)
      .filter(v => fuelFilter === "all"     || v.fuel_type === fuelFilter)
      .sort((a, b) => {
        if (sortBy === "price_asc")  return (a.monthly_rent ?? 0) - (b.monthly_rent ?? 0);
        if (sortBy === "price_desc") return (b.monthly_rent ?? 0) - (a.monthly_rent ?? 0);
        return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
      });
  }, [vehicles, search, brandFilter, categoryFilter, fuelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  const reset = useCallback((setter) => (val) => { setter(val); setCurrentPage(1); }, []);

  return (
    <div className="bg-surface min-h-screen">
      <PageHeader
        eyebrow="Usato Certificato NLT"
        title="Offerte Re-Use"
        description="Veicoli usati selezionati e certificati in Noleggio Lungo Termine. La qualità del nuovo a condizioni vantaggiose."
      />

      <FilterBar
        searchValue={search}
        onSearch={reset(setSearch)}
        searchPlaceholder="Cerca marca o modello…"
        resultCount={filtered.length}
      >
        <NativeSelect
          label="Marca"
          value={brandFilter}
          options={[{ value: "all", label: "Tutte le marche" }, ...brands.map(b => ({ value: b, label: b }))]}
          onChange={reset(setBrandFilter)}
        />
        <NativeSelect
          label="Categoria"
          value={categoryFilter}
          options={[{ value: "all", label: "Tutte le categorie" }, ...categories.map(c => ({ value: c, label: c }))]}
          onChange={reset(setCategoryFilter)}
        />
        <NativeSelect
          label="Ordina per"
          value={sortBy}
          options={[
            { value: "price_asc",  label: "Prezzo: crescente" },
            { value: "price_desc", label: "Prezzo: decrescente" },
            { value: "name",       label: "Nome A–Z" },
          ]}
          onChange={reset(setSortBy)}
        />
      </FilterBar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold mb-1">Nessun veicolo trovato</p>
            <p className="text-sm">Prova a modificare i filtri di ricerca.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} segment="ReUse" />
              ))}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
          </>
        )}
      </div>
    </div>
  );
}
