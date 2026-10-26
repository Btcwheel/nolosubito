import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import VehicleCard from "../vehicles/VehicleCard";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { useHomeSegment } from "./HomeSegmentContext";
import { useNow } from "@/lib/NowContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 9;
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

const matchesHeroAdvance = (advance, amount) => {
  if (advance === "zero") return amount === 0;
  if (advance === "with") return amount > 0;
  return true;
};

// ── Main component ────────────────────────────────────────────────────────────
// Matcher per la tipologia scelta nella hero
const HERO_CATEGORY_MATCHERS = {
  suv: (v) => /suv|crossover/i.test(v.category ?? ""),
  "citycar-ibride": (v) => /city/i.test(v.category ?? "") && v.fuel_type === "Hybrid",
  "pronta-consegna": (v) => v.is_ready_delivery === true,
  commerciali: (v) => /commerc|furgon|van|pick/i.test(`${v.category ?? ""} ${(v.segments ?? []).join(" ")}`),
};

const matchesHeroBudget = (budget, p) => {
  if (budget === "0-250") return p < 250;
  if (budget === "250-350") return p >= 250 && p < 350;
  if (budget === "350-500") return p >= 350 && p < 500;
  if (budget === "500+") return p >= 500;
  return true;
};

// ── Main component ────────────────────────────────────────────────────────────
// I filtri della hero (testo, budget, anticipo, categoria) arrivano da Home; il segmento Privati/P.IVA dalla Navbar.
export default function FeaturedVehicles({ searchText = "", heroBudget = "all", heroAdvance = "all", heroCategory = "all", resultsRef }) {
  const { segment: tipologia } = useHomeSegment();
  const [prontoConsegna, setProntoConsegna] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const observerRef = useRef(null);

  const { data: vehicles = [], isLoading, isError, refetch } = useHomeCatalog();
  const now = useNow();

  const MOTO_CATS = ["Moto", "Scooter", "Moto e Scooter"];

  const filtered = useMemo(() => {
    return vehicles
      .filter(v => {
        // Filtro tipologia (segmento); i commerciali hanno segmenti propri
        if (tipologia === "all" || heroCategory === "commerciali") return true;
        const cat = v.category?.trim();
        if (tipologia === "Moto") return MOTO_CATS.includes(cat);
        // P.IVA e Privati: escludi moto, filtra per segmento
        if (MOTO_CATS.includes(cat)) return false;
        if (!v.segments || !Array.isArray(v.segments)) return tipologia === "P.IVA"; // default
        return v.segments.includes(tipologia);
      })
      .filter(v => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return `${v.make ?? ""} ${v.model ?? ""}`.toLowerCase().includes(q);
      })
      .filter(v => matchesHeroBudget(heroBudget, v.monthly_rent ?? 0))
      .filter(v => matchesHeroAdvance(heroAdvance, Number(v.advance_payment) || 0))
      .filter(v => heroCategory === "all" || (HERO_CATEGORY_MATCHERS[heroCategory]?.(v) ?? true))
      .filter(v => !prontoConsegna || v.is_ready_delivery === true)
      .sort((a, b) => {
        const aPromo = a.promo_expires_at && new Date(a.promo_expires_at).getTime() > now ? 1 : 0;
        const bPromo = b.promo_expires_at && new Date(b.promo_expires_at).getTime() > now ? 1 : 0;
        return bPromo - aPromo;
      });
  }, [vehicles, tipologia, prontoConsegna, searchText, heroBudget, heroAdvance, heroCategory, now]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // Ref per leggere hasMore dentro il callback senza ricreare l'observer
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const resetPage = useCallback(() => setVisibleCount(PAGE_SIZE), []);

  useEffect(() => { resetPage(); }, [tipologia, searchText, heroBudget, heroAdvance, heroCategory, resetPage]);

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


  return (
    <section className="bg-[#F8F9FA]">

      {/* ── Results ──────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy">
            Migliori Offerte Noleggio Lungo Termine
          </h2>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#2477A8] font-medium">Solo pronta consegna</span>
              <Toggle checked={prontoConsegna} onChange={setProntoConsegna} />
            </div>
            <div className="h-[20px] min-w-[110px]">
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
            {isError ? (
              <>
                <p className="text-lg font-semibold mb-2 text-gray-600">Impossibile caricare i veicoli</p>
                <p className="text-sm mb-4">Controlla la connessione e riprova</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy/90 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Riprova
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold mb-2">Nessun veicolo trovato</p>
                <p className="text-sm">Prova a modificare i filtri di ricerca</p>
              </>
            )}
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
