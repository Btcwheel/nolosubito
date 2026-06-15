import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Car, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import VehicleCard from "../vehicles/VehicleCard";
import { offersService } from "@/services/offers";
import { supabase } from "@/lib/supabase";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 9;
const DEFAULT_HERO_IMG = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=533&q=80&auto=format&fit=crop&crop=center";

const TIPOLOGIA_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "P.IVA", label: "Business / P.IVA" },
  { value: "Privati", label: "Privati" },
  { value: "Moto", label: "Moto & Scooter" },
];

const BUDGET_OPTIONS = [
  { value: "all", label: "Tutti i prezzi" },
  { value: "0-200", label: "Fino a €200/mese" },
  { value: "200-400", label: "€200 – €400/mese" },
  { value: "400-600", label: "€400 – €600/mese" },
  { value: "600+", label: "Oltre €600/mese" },
];

const QUICK_FILTERS = ["SUV", "Berlina", "Moto", "Scooter", "Elettriche", "Ibride"];

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[11px] font-bold text-[#2D2E82] uppercase tracking-wide px-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Mostra solo auto in pronta consegna"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${checked ? "bg-electric" : "bg-gray-200"
        }`}
    >
      <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform duration-200 mt-1 ${checked ? "translate-x-6" : "translate-x-1"
        }`} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FeaturedVehicles() {
  const [tipologia, setTipologia] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState(null);
  const [prontoConsegna, setProntoConsegna] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const resultsRef = useRef(null);
  const observerRef = useRef(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-home-catalog"],
    queryFn: () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
  });

  // Hero image da CMS (fallback a Unsplash)
  const { data: heroImg } = useQuery({
    queryKey: ["hero-image"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_image")
        .single();
      return data?.value?.url || DEFAULT_HERO_IMG;
    },
    staleTime: 10 * 60 * 1000,
  });

  const heroImage = heroImg || DEFAULT_HERO_IMG;

  const categories = useMemo(
    () => [...new Set(vehicles.map(v => v.category?.trim()).filter(Boolean))].sort(),
    [vehicles],
  );

  const brands = useMemo(
    () => [...new Set(vehicles.map(v => v.make?.trim().toUpperCase()).filter(Boolean))].sort(),
    [vehicles],
  );

  const MOTO_CATS = ["Moto", "Scooter", "Moto e Scooter"];

  const filtered = useMemo(() => {
    return vehicles
      .filter(v => {
        // Filtro tipologia (segmento)
        if (tipologia === "all") return true;
        const cat = v.category?.trim();
        if (tipologia === "Moto") return MOTO_CATS.includes(cat);
        // P.IVA e Privati: escludi moto, filtra per segmento
        if (MOTO_CATS.includes(cat)) return false;
        if (!v.segments || !Array.isArray(v.segments)) return tipologia === "P.IVA"; // default
        return v.segments.includes(tipologia);
      })
      .filter(v => makeFilter === "all" || v.make?.trim().toUpperCase() === makeFilter)
      .filter(v => categoryFilter === "all" || v.category?.trim() === categoryFilter)
      .filter(v => {
        if (budgetFilter === "all") return true;
        const p = v.monthly_rent ?? 0;
        if (budgetFilter === "0-200") return p < 200;
        if (budgetFilter === "200-400") return p >= 200 && p < 400;
        if (budgetFilter === "400-600") return p >= 400 && p < 600;
        if (budgetFilter === "600+") return p >= 600;
        return true;
      })
      .filter(v => {
        if (!quickFilter) return true;
        const cat = v.category?.trim();
        // Moto → matcha "Moto", "Moto e Scooter"
        if (quickFilter === "Moto") return ["Moto", "Moto e Scooter"].includes(cat);
        // Scooter → matcha "Scooter", "Moto e Scooter"
        if (quickFilter === "Scooter") return ["Scooter", "Moto e Scooter"].includes(cat);
        if (quickFilter === "SUV" || quickFilter === "Berlina") return cat === quickFilter;
        if (quickFilter === "Ibride") return v.fuel_type === "Hybrid";
        if (quickFilter === "Elettriche") return v.fuel_type === "Electric";
        return true;
      })
      .filter(v => !prontoConsegna || v.is_ready_delivery === true)
      .sort((a, b) => {
        const now = new Date();
        const aPromo = a.promo_expires_at && new Date(a.promo_expires_at) > now ? 1 : 0;
        const bPromo = b.promo_expires_at && new Date(b.promo_expires_at) > now ? 1 : 0;
        return bPromo - aPromo;
      });
  }, [vehicles, makeFilter, tipologia, categoryFilter, budgetFilter, quickFilter, prontoConsegna]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // Ref per leggere hasMore dentro il callback senza ricreare l'observer
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const resetPage = useCallback(() => setVisibleCount(PAGE_SIZE), []);

  // Callback ref: il sentinel viene montato solo quando hasMore diventa true
  // (cioè dopo il caricamento dei dati). Un useEffect con deps fisse non
  // vedrebbe questo mount tardivo, quindi creiamo/distruggiamo l'observer
  // direttamente quando il nodo del sentinel monta/smonta.
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasMoreRef.current) {
            setVisibleCount(c => c + PAGE_SIZE);
          }
        },
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    }
  }, []);

  const handleTipologia = (v) => { setTipologia(v); resetPage(); };
  const handleMake = (v) => { setMakeFilter(v); resetPage(); };
  const handleCategory = (v) => { setCategoryFilter(v); resetPage(); };
  const handleBudget = (v) => { setBudgetFilter(v); resetPage(); };
  const handleQuick = (v) => { setQuickFilter(prev => prev === v ? null : v); resetPage(); };

  const scrollToResults = () => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <section className="bg-surface min-h-screen">

      {/* ── HERO ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-4">
        <div className="flex flex-col sm:block relative w-full">

          {/* ── Immagine & Testo ── */}
          <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg h-[300px] sm:h-[400px]">
            <img
              src={heroImage}
              alt="Noleggio Lungo Termine"
              width="1280"
              height="533"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
              fetchpriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />

            <div className="absolute bottom-0 inset-x-0 px-5 sm:px-8 lg:px-10 pb-10 sm:pb-6 z-10">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white drop-shadow-md"
              >
                Noleggiamo il Futuro
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-1.5 sm:mt-2 max-w-md text-sm sm:text-base text-white/85 drop-shadow-md"
              >
                Canone chiaro, tutto incluso: zero pensieri, dovrai solo pensare a guidare.
              </motion.p>
            </div>
          </div>

          {/* ── Barra filtri ── */}
          <div className="relative sm:absolute sm:top-0 sm:inset-x-0 sm:pt-12 px-2 sm:px-8 lg:px-10 z-20 mt-3 sm:mt-0">
            <div className="bg-white sm:bg-white/65 sm:backdrop-blur-xl rounded-2xl sm:rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 sm:border-white/60 p-4 sm:px-5 sm:py-4">

              {/* MOBILE TOGGLE HEADER */}
              <div
                className="sm:hidden flex items-center justify-between cursor-pointer"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-[#2D2E82]/10 flex items-center justify-center">
                    <Search className="size-4 text-[#2D2E82]" />
                  </div>
                  <span className="text-sm font-bold text-[#2D2E82]">Ricerca avanzata veicoli</span>
                </div>
                <ChevronDown className={`size-5 text-gray-500 transition-transform ${isMobileFiltersOpen ? 'rotate-180' : ''}`} />
              </div>

              <div className={`grid grid-cols-2 gap-3 sm:flex sm:flex-row items-end sm:gap-2.5 mt-4 sm:mt-0 ${isMobileFiltersOpen ? 'block' : 'hidden sm:flex'}`}>

                {/* Tipologia */}
                <div className="col-span-2 sm:col-span-1 w-full sm:w-36 shrink-0">
                  <FilterSelect
                    label="Tipologia"
                    value={tipologia}
                    options={TIPOLOGIA_OPTIONS}
                    onChange={handleTipologia}
                  />
                </div>

                {/* Filtro marca */}
                <div className="col-span-2 w-full sm:flex-1 min-w-0">
                  <FilterSelect
                    label="Marca"
                    value={makeFilter}
                    options={[
                      { value: "all", label: "Tutte le marche" },
                      ...brands.map(b => ({ value: b, label: b })),
                    ]}
                    onChange={handleMake}
                  />
                </div>

                {/* Categoria */}
                <div className="col-span-1 w-full sm:w-44 shrink-0">
                  <FilterSelect
                    label="Categoria"
                    value={categoryFilter}
                    options={[
                      { value: "all", label: "Tutti i veicoli" },
                      ...categories.map(c => ({ value: c, label: c })),
                    ]}
                    onChange={handleCategory}
                  />
                </div>

                {/* Budget */}
                <div className="col-span-1 w-full sm:w-40 shrink-0">
                  <FilterSelect
                    label="Budget Mensile"
                    value={budgetFilter}
                    options={BUDGET_OPTIONS}
                    onChange={handleBudget}
                  />
                </div>

                {/* CTA */}
                <div className="col-span-2 w-full sm:w-auto shrink-0 flex flex-col gap-1 mt-1 sm:mt-0">
                  <div className="h-[19px] hidden sm:block" /> {/* spacer per allineamento */}
                  <button
                    type="button"
                    onClick={() => { resetPage(); setIsMobileFiltersOpen(false); scrollToResults(); }}
                    className="flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 text-white font-bold rounded-xl px-5 py-2.5 text-sm transition-colors cursor-pointer whitespace-nowrap shadow-md"
                  >
                    <Car className="size-4" />
                    Trova Offerte
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Filtri rapidi + toggle ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 font-medium">Filtri rapidi:</span>
              {QUICK_FILTERS.map(f => (
                <button type="button"
                  key={f}

                  onClick={() => handleQuick(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${quickFilter === f
                    ? "bg-electric text-white border-electric"
                    : "bg-white text-gray-600 border-gray-200 hover:border-electric/50 hover:text-navy"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#2477A8] font-medium">Mostra solo auto in pronta consegna</span>
              <Toggle checked={prontoConsegna} onChange={setProntoConsegna} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3 min-h-[64px]">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy">
            Migliori Offerte Noleggio Lungo Termine
          </h2>
          <div className="h-[20px] shrink-0">
            {!isLoading && (
              <AnimatePresence mode="wait">
                <motion.p
                  key={filtered.length}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-600"
                >
                  Trovati <strong className="text-gray-700">{filtered.length}</strong> risultati
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col">
                <Skeleton className="h-[200px] w-full shrink-0 rounded-none" />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 mb-6">
                    <Skeleton className="h-[56px] w-full" />
                    <Skeleton className="h-[56px] w-full" />
                    <Skeleton className="h-[56px] w-full" />
                  </div>
                  <div className="flex items-end justify-between gap-3 mt-auto">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                    <Skeleton className="size-12 rounded-xl shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold mb-2">Nessun veicolo trovato</p>
            <p className="text-sm">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} segment={tipologia === "all" ? undefined : tipologia} />
            ))}
          </div>
        )}

        {/* Sentinel infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-navy/30 border-t-navy animate-spin" />
          </div>
        )}
      </div>
    </section>
  );
}
