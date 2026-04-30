import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleCard from "../vehicles/VehicleCard";
import { offersService } from "@/services/offers";

const PAGE_SIZE = 9;

const TIPOLOGIA_OPTIONS = [
  { value: "all",     label: "Tutti" },
  { value: "P.IVA",   label: "Business / P.IVA" },
  { value: "Privati", label: "Privati" },
];

const BUDGET_OPTIONS = [
  { value: "all",     label: "Tutti i prezzi" },
  { value: "0-200",   label: "Fino a €200/mese" },
  { value: "200-400", label: "€200 – €400/mese" },
  { value: "400-600", label: "€400 – €600/mese" },
  { value: "600+",    label: "Oltre €600/mese" },
];

const QUICK_FILTERS = ["SUV", "Berlina", "Ibrido", "Elettrica"];

function NativeSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 pr-9 focus:outline-none focus:ring-2 focus:ring-[#2D2E82]/20 cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
        checked ? "bg-[#71BAED]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 mt-1 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function FeaturedVehicles() {
  const [tipologia,      setTipologia]      = useState("all");
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budgetFilter,   setBudgetFilter]   = useState("all");
  const [quickFilter,    setQuickFilter]    = useState(null);
  const [prontoConsegna, setProntoConsegna] = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-home-catalog"],
    queryFn:  () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => [...new Set(vehicles.map(v => v.category).filter(Boolean))].sort(),
    [vehicles],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles
      .filter(v => !q || `${v.make} ${v.model}`.toLowerCase().includes(q))
      .filter(v => {
        if (tipologia === "all") return true;
        // show vehicles that have a config for the selected segment
        return true; // listWithMinPrice() fetches all; tipologia acts as a UI label for now
      })
      .filter(v => categoryFilter === "all" || v.category === categoryFilter)
      .filter(v => {
        if (budgetFilter === "all") return true;
        const p = v.monthly_rent ?? 0;
        if (budgetFilter === "0-200")   return p < 200;
        if (budgetFilter === "200-400") return p >= 200 && p < 400;
        if (budgetFilter === "400-600") return p >= 400 && p < 600;
        if (budgetFilter === "600+")    return p >= 600;
        return true;
      })
      .filter(v => {
        if (!quickFilter) return true;
        if (quickFilter === "SUV" || quickFilter === "Berlina") return v.category === quickFilter;
        if (quickFilter === "Ibrido")    return v.fuel_type === "Hybrid";
        if (quickFilter === "Elettrica") return v.fuel_type === "Electric";
        return true;
      })
      .filter(v => !prontoConsegna || v.is_ready_delivery === true);
  }, [vehicles, search, tipologia, categoryFilter, budgetFilter, quickFilter, prontoConsegna]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const resetPage = useCallback(() => setCurrentPage(1), []);

  const handleTipologia = (v) => { setTipologia(v); resetPage(); };
  const handleSearch    = (v) => { setSearch(v);    resetPage(); };
  const handleCategory  = (v) => { setCategoryFilter(v); resetPage(); };
  const handleBudget    = (v) => { setBudgetFilter(v);   resetPage(); };
  const handleQuick     = (v) => { setQuickFilter(prev => prev === v ? null : v); resetPage(); };

  return (
    <section className="bg-[#F5F6FA] min-h-screen">
      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NativeSelect
              label="Tipologia"
              value={tipologia}
              options={TIPOLOGIA_OPTIONS}
              onChange={handleTipologia}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca / Modello</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca veicolo…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E82]/20"
                />
              </div>
            </div>

            <NativeSelect
              label="Categoria"
              value={categoryFilter}
              options={[
                { value: "all", label: "Tutte le auto" },
                ...categories.map(c => ({ value: c, label: c })),
              ]}
              onChange={handleCategory}
            />

            <NativeSelect
              label="Budget Mensile"
              value={budgetFilter}
              options={BUDGET_OPTIONS}
              onChange={handleBudget}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={resetPage}
              className="flex items-center gap-2 bg-[#2D2E82] hover:bg-[#2D2E82]/90 text-white font-bold rounded-xl px-6 py-2.5 text-sm transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Trova Offerta
            </button>
          </div>
        </div>

        {/* Quick filters + toggle */}
        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">Filtri rapidi:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => handleQuick(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  quickFilter === f
                    ? "bg-[#2D2E82] text-white border-[#2D2E82]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2D2E82]/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500">Mostra solo auto in pronta consegna</span>
            <Toggle checked={prontoConsegna} onChange={setProntoConsegna} />
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#2D2E82]">
            Migliori Offerte Noleggio
          </h2>
          {!isLoading && (
            <p className="text-sm text-gray-500">
              Trovati <strong className="text-gray-700">{filtered.length}</strong> risultati
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-8 w-24 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold mb-2">Nessun veicolo trovato</p>
            <p className="text-sm">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-white cursor-pointer transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  currentPage === n
                    ? "bg-[#2D2E82] text-white"
                    : "border border-gray-200 hover:bg-white text-gray-700"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-white cursor-pointer transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
