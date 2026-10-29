import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/lib/AppLink";
import { ChevronDown, Search } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useNow } from "@/lib/NowContext";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { useHomeSegment } from "./HomeSegmentContext";
import { formatDisplayedRent, resolvePricingSegment } from "@/lib/vehiclePricing";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { getOptimizedSrc } from "@/lib/imageUtils";
import { isPromoLive, promoMatchesSegment, matchesSegment } from "@/lib/homePromo";
import PromoExpiryBadge, { formatExpiryDate } from "@/components/vehicles/PromoExpiryBadge";

export const HOME_BUDGET_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "0-250", label: "Fino a 250€" },
  { value: "250-350", label: "250-350€" },
  { value: "350-500", label: "350-500€" },
  { value: "500+", label: "Oltre 500€" },
];

export const HOME_ADVANCE_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "zero", label: "Anticipo 0€" },
  { value: "with", label: "Con anticipo" },
];

export const HOME_CATEGORIES = [
  { value: "all", label: "Tutte le Offerte" },
  { value: "suv", label: "SUV & Crossover" },
  { value: "citycar-ibride", label: "Citycar Ibride" },
  { value: "commerciali", label: "Veicoli Commerciali" },
  { value: "moto", label: "Moto e Scooter" },
];

const MIN_SLIDES = 3;
const MAX_SLIDES = 6;
const SLIDE_MS = 6000;

// Le offerte a tempo del segmento scelto che scadono per prime; se sono meno di tre completa con le
// pronta consegna più convenienti dello stesso segmento (quando una promo finisce, scala il resto)
function pickLineup(vehicles, now, segment) {
  const promos = vehicles
    .filter((v) => isPromoLive(v, now) && promoMatchesSegment(v, segment) && v.monthly_rent)
    .sort((a, b) => new Date(a.promo_expires_at) - new Date(b.promo_expires_at))
    .slice(0, MAX_SLIDES);
  if (promos.length >= MIN_SLIDES) return promos;
  const taken = new Set(promos.map((v) => v.id));
  const fill = vehicles
    .filter((v) => !taken.has(v.id) && v.is_ready_delivery && v.monthly_rent && matchesSegment(v, segment))
    .sort((a, b) => a.monthly_rent - b.monthly_rent)
    .slice(0, MIN_SLIDES - promos.length);
  return [...promos, ...fill];
}

// Nome, canone (scontato se la promo è attiva) e prezzo di listino per segmento
function slideInfo(vehicle, segment) {
  const pricing = {
    segment: resolvePricingSegment({
      segment,
      vehicleCategory: vehicle.category,
      vehicleSegments: vehicle.segments || [],
    }),
    vehicleCategory: vehicle.category,
    vehicleSegments: vehicle.segments || [],
  };
  const discountPct = isPromoLive(vehicle) && promoMatchesSegment(vehicle, segment) ? Number(vehicle.promo_discount_pct) || 0 : 0;
  const listPrice = formatDisplayedRent(vehicle.monthly_rent, pricing);
  const price = discountPct > 0
    ? formatDisplayedRent(Math.round(vehicle.monthly_rent * (1 - discountPct / 100)), pricing)
    : listPrice;
  const name = `${vehicle.make} ${vehicle.model}`.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return { name, price, listPrice, discountPct };
}

const pad = (n) => String(n).padStart(2, "0");

// Una cifra del conto alla rovescia
function Unit({ value, label }) {
  return (
    <div className="text-center">
      <p className="min-w-[2.75rem] rounded-lg bg-white px-2 py-1 font-heading text-2xl font-black tabular-nums leading-none text-[#15146c] sm:min-w-[3.25rem] sm:text-3xl">
        {pad(value)}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-white">{label}</p>
    </div>
  );
}

// Slide: foto a tutto banner, canone su una targa, conto alla rovescia in basso
function PromoSlide({ vehicle, segment, first }) {
  const cd = useCountdown(vehicle.promo_expires_at);
  // Timer e sconto solo se la promo vale per il segmento scelto; altrimenti è una normale pronta consegna
  const live = cd && !cd.expired && vehicle.promo_active !== false && promoMatchesSegment(vehicle, segment);
  const { name, price, listPrice, discountPct } = slideInfo(vehicle, segment);

  return (
    <Link
      to={`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#f8fafc] sm:aspect-[16/10]"
    >
      <img
        src={getOptimizedSrc(getVehicleImage(vehicle), 900)}
        alt={`${vehicle.make} ${vehicle.model}`}
        width="900"
        height="563"
        loading={first ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        style={{ objectPosition: getVehicleImagePosition(vehicle) }}
      />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" aria-hidden="true" />

      {live && (
        <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
          <PromoExpiryBadge expiresAt={vehicle.promo_expires_at} discountPct={discountPct} showTime={false} />
        </div>
      )}

      {/* Targa col canone mensile */}
      <div className="absolute right-4 top-4 flex items-stretch overflow-hidden rounded-md border-2 border-[#15146c] bg-white text-[#15146c]">
        <span className="flex w-6 flex-col items-center justify-center bg-[#2D2E82] text-[11px] font-bold text-white" aria-hidden="true">I</span>
        <p className="px-3 py-1 font-heading font-black leading-none tracking-tight">
          <span className="text-3xl sm:text-4xl">{price.toLocaleString("it-IT")}€</span>
          <span className="ml-0.5 text-sm font-semibold tracking-normal">/mese</span>
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 p-4 text-white sm:p-5">
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold sm:text-2xl">{name}</p>
          <p className="text-base font-medium">
            {discountPct > 0 ? (
              <>-{Math.round(discountPct)}%, prima <s>{listPrice.toLocaleString("it-IT")}€</s></>
            ) : live ? (
              `Kasko inclusa · fino al ${formatExpiryDate(vehicle.promo_expires_at)}`
            ) : (
              "Kasko inclusa"
            )}
          </p>
        </div>
        {live ? (
          <div>
            <p className="mb-1 text-[13px] font-semibold">L'offerta termina tra</p>
            <div className="flex gap-1.5">
              <Unit value={cd.days} label="giorni" />
              <Unit value={cd.hours} label="ore" />
              <Unit value={cd.minutes} label="min" />
              <Unit value={cd.seconds} label="sec" />
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-white px-3 py-1.5 text-base font-bold text-emerald-700">Pronta consegna</p>
        )}
      </div>
    </Link>
  );
}

// Carosello a tempo: le linee sotto sono le offerte, quella attiva si riempie e passa alla successiva
function Lineup({ vehicles, segment, loading }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const touchX = useRef(null);
  const count = vehicles.length;

  // Se cambiano le offerte (toggle Privati/P.IVA, promo scaduta) si riparte dalla prima
  const lineupKey = vehicles.map((v) => v.id).join(",");
  useEffect(() => { setIndex(0); }, [lineupKey]);

  if (loading && count === 0) {
    return <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200 sm:aspect-[16/10]" aria-hidden="true" />;
  }
  if (count === 0) return null;

  const autoplay = count > 1 && !reduceMotion;
  const goTo = (i) => setIndex(((i % count) + count) % count);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      role="region"
      aria-roledescription="carosello"
      aria-label="Offerte a scadenza"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="overflow-hidden rounded-2xl"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {vehicles.map((v, i) => (
            <div key={v.id} className="w-full shrink-0" aria-hidden={i !== index}>
              <PromoSlide vehicle={v} segment={segment} first={i === 0} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1 flex gap-2" role="group" aria-label="Scegli l'offerta">
        {vehicles.map((v, i) => {
          const { name, price } = slideInfo(v, segment);
          const active = i === index;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${name}, ${price}€ al mese`}
              aria-current={active}
              className="min-w-0 flex-1 cursor-pointer py-3 text-left"
            >
              <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
                <span
                  key={active ? `on-${index}` : `off-${i}`}
                  className={`block h-full origin-left bg-[#2D2E82] ${i < index || (active && !autoplay) ? "scale-x-100" : "scale-x-0"} ${active && autoplay ? "hero-progress" : ""}`}
                  style={active && autoplay ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                  onAnimationEnd={active && autoplay ? () => goTo(index + 1) : undefined}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="relative block min-w-0">
      <span className="mb-1 block text-sm font-medium text-[#464651]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-base font-semibold text-[#1A1F5E] transition-colors hover:border-[#1A1F5E]/40 focus-visible:outline-2 focus-visible:outline-[#2D2E82]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute bottom-3 right-3 size-4 text-slate-400" aria-hidden="true" />
    </label>
  );
}

export default function HomeHero({
  searchText, onSearchText, budget, onBudget, advance, onAdvance, category, onCategory, onSubmit,
}) {
  const { data: vehicles = [], isLoading } = useHomeCatalog();
  const { segment } = useHomeSegment();
  const startNow = useNow();
  // L'ora avanza da sola: una promo che scade mentre la pagina è aperta esce dal carosello
  const [now, setNow] = useState(startNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const lineup = useMemo(() => pickLineup(vehicles, now, segment), [vehicles, now, segment]);

  const isTabActive = (value) => category === value;
  const selectTab = (value) => onCategory(value);

  return (
    <section className="bg-[#F8F9FA] text-[#1A1F5E]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
          <div className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1 className="font-heading text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl xl:text-6xl">
              Noleggiamo il Futuro
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium text-slate-600">
              Canone chiaro, tutto incluso: zero pensieri, dovrai solo pensare a guidare.
            </p>
          </div>

          <div className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
            <Lineup vehicles={lineup} segment={segment} loading={isLoading} />
          </div>

          <div className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:self-start">
            {/* Ricerca: una barra unica, filtri sotto */}
            <form
              onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
              className="max-w-xl lg:mt-7"
            >
              <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_15px_40px_rgba(26,31,94,0.08)] focus-within:border-[#2D2E82]">
                <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Search className="size-5 shrink-0 text-slate-500" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => onSearchText(e.target.value)}
                    placeholder="Cerca marca o modello"
                    aria-label="Cerca per marca o modello"
                    className="w-full bg-transparent py-3 text-base font-medium text-[#1A1F5E] placeholder:text-slate-500 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="cursor-pointer whitespace-nowrap rounded-xl bg-[#1A1F5E] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#3B82F6]"
                >
                  Trova auto
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <SelectField label="Budget mensile" value={budget} onChange={onBudget} options={HOME_BUDGET_OPTIONS} />
                <SelectField label="Anticipo" value={advance} onChange={onAdvance} options={HOME_ADVANCE_OPTIONS} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Categorie rapide">
                {HOME_CATEGORIES.map((c) => {
                  const active = isTabActive(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectTab(c.value)}
                      className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                        active ? "border-[#1A1F5E] bg-[#1A1F5E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#1A1F5E]/40"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </form>
            <p className="mt-5 text-sm font-semibold text-slate-600">4.9/5 su Trustpilot</p>
          </div>
        </div>
      </div>
    </section>
  );
}
