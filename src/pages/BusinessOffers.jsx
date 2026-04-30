import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { offersService } from "@/services/offers";
import { PageHeader, FilterBar, NativeSelect, CardSkeleton, Pagination } from "@/components/layout/ListingLayout";

const PAGE_SIZE = 12;
const SEGMENT = "P.IVA";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BusinessOffers() {
  const [search, setSearch]               = useState("");
  const [brandFilter, setBrandFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fuelFilter, setFuelFilter]       = useState("all");
  const [sortBy, setSortBy]               = useState("price_asc");
  const [currentPage, setCurrentPage]     = useState(1);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-business"],
    queryFn: () => offersService.listWithMinPrice(SEGMENT),
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived lists ──────────────────────────────────────────────────────────
  const brands     = useMemo(() => [...new Set(vehicles.map(v => v.make?.trim().toUpperCase()).filter(Boolean))].sort(), [vehicles]);
  const categories = useMemo(() => [...new Set(vehicles.map(v => v.category).filter(Boolean))], [vehicles]);
  const fuelTypes  = useMemo(() => [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))], [vehicles]);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...vehicles]
      .filter(v => !search || `${v.make} ${v.model}`.toLowerCase().includes(q))
      .filter(v => brandFilter === "all" || v.make?.trim().toUpperCase() === brandFilter)
      .filter(v => categoryFilter === "all" || v.category === categoryFilter)
      .filter(v => fuelFilter === "all" || v.fuel_type === fuelFilter)
      .sort((a, b) => {
        if (sortBy === "price_asc")  return (a.monthly_rent ?? 0) - (b.monthly_rent ?? 0);
        if (sortBy === "price_desc") return (b.monthly_rent ?? 0) - (a.monthly_rent ?? 0);
        return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
      });
  }, [vehicles, search, brandFilter, categoryFilter, fuelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const activeFilters = [brandFilter, categoryFilter, fuelFilter].filter(f => f !== "all").length;

  const clearFilters = useCallback(() => {
    setBrandFilter("all");
    setCategoryFilter("all");
    setFuelFilter("all");
    setSortBy("price_asc");
    setCurrentPage(1);
  }, []);

  // Reset page when filters change
  const handleFilterChange = useCallback((setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <PageHeader
        eyebrow="Noleggio a Lungo Termine"
        title="Offerte per Aziende e P.IVA"
        description="Gamma completa NLT per P.IVA e aziende. Assicurazione, manutenzione e soccorso stradale inclusi nel canone mensile."
      />

      <FilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Cerca marca o modello…"
        resultCount={filtered.length}
      >
        <NativeSelect
          label="Marca"
          value={brandFilter}
          options={[{ value: "all", label: "Tutte le marche" }, ...brands.map(b => ({ value: b, label: b }))]}
          onChange={handleFilterChange(setBrandFilter)}
        />
        <NativeSelect
          label="Categoria"
          value={categoryFilter}
          options={[{ value: "all", label: "Tutte le categorie" }, ...categories.map(c => ({ value: c, label: c }))]}
          onChange={handleFilterChange(setCategoryFilter)}
        />
        <NativeSelect
          label="Ordina per"
          value={sortBy}
          options={[
            { value: "price_asc",  label: "Prezzo: crescente" },
            { value: "price_desc", label: "Prezzo: decrescente" },
            { value: "name",       label: "Nome A–Z" },
          ]}
          onChange={handleFilterChange(setSortBy)}
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
                <VehicleCard key={v.id} vehicle={v} index={i} segment={SEGMENT} />
              ))}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
          </>
        )}
      </div>
    </div>
  );
}
