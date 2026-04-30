import React, { useState, useMemo, useCallback } from "react";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import VehicleCard from "../components/vehicles/VehicleCard";
import { PageHeader, FilterBar, NativeSelect, CardSkeleton, Pagination } from "@/components/layout/ListingLayout";

const PAGE_SIZE = 12;

export default function CommercialOffers() {
  const [search,      setSearch]      = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [fuelFilter,  setFuelFilter]  = useState("all");
  const [sortBy,      setSortBy]      = useState("price_asc");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: rawVehicles = [], isLoading } = useQuery({
    queryKey: ["offers-commercial"],
    queryFn:  () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const vehicles = useMemo(() => rawVehicles.filter(v => v.category === "Commercial Van"), [rawVehicles]);

  const brands    = useMemo(() => [...new Set(vehicles.map(v => v.make?.trim().toUpperCase()).filter(Boolean))].sort(), [vehicles]);
  const fuelTypes = useMemo(() => [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))], [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...vehicles]
      .filter(v => !q || `${v.make} ${v.model}`.toLowerCase().includes(q))
      .filter(v => brandFilter === "all" || v.make?.trim().toUpperCase() === brandFilter)
      .filter(v => fuelFilter === "all"  || v.fuel_type === fuelFilter)
      .sort((a, b) => {
        if (sortBy === "price_asc")  return (a.monthly_rent ?? 0) - (b.monthly_rent ?? 0);
        if (sortBy === "price_desc") return (b.monthly_rent ?? 0) - (a.monthly_rent ?? 0);
        return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
      });
  }, [vehicles, search, brandFilter, fuelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  const reset = useCallback((setter) => (val) => { setter(val); setCurrentPage(1); }, []);

  return (
    <div className="bg-surface min-h-screen">
      <PageHeader
        eyebrow="Noleggio a Lungo Termine"
        title="Veicoli Commerciali"
        description="Furgoni, van cargo e veicoli commerciali leggeri in noleggio a lungo termine. Manutenzione e assicurazione incluse nel canone mensile."
      />

      <FilterBar
        searchValue={search}
        onSearch={reset(setSearch)}
        searchPlaceholder="Cerca furgoni e van…"
        resultCount={filtered.length}
      >
        <NativeSelect
          label="Marca"
          value={brandFilter}
          options={[{ value: "all", label: "Tutte le marche" }, ...brands.map(b => ({ value: b, label: b }))]}
          onChange={reset(setBrandFilter)}
        />
        <NativeSelect
          label="Alimentazione"
          value={fuelFilter}
          options={[{ value: "all", label: "Tutti" }, ...fuelTypes.map(f => ({ value: f, label: f }))]}
          onChange={reset(setFuelFilter)}
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
                <VehicleCard key={v.id} vehicle={v} index={i} segment="Commerciale" />
              ))}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
          </>
        )}
      </div>
    </div>
  );
}
