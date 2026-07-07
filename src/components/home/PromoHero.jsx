import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Tag, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import { useCountdown } from "@/hooks/useCountdown";
import { usePageVisible } from "@/hooks/usePageVisible";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { formatDisplayedRent, resolvePricingSegment } from "@/lib/vehiclePricing";
import { Skeleton } from "@/components/ui/skeleton";

function PromoHeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 items-center animate-pulse">
      {/* Left: contenuto */}
      <div className="space-y-5 sm:space-y-6 z-10">
        <div className="flex items-center gap-2">
          <div className="size-1.5 sm:w-2 sm:h-2 rounded-full bg-white/20" />
          <Skeleton className="h-3 w-44 bg-white/10" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 sm:h-3.5 w-20 bg-white/10" />
          <Skeleton className="h-12 sm:h-14 lg:h-16 w-full max-w-md bg-white/10" />
          <Skeleton className="h-3 sm:h-3.5 w-40 bg-white/10" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20 bg-white/10" />
            <Skeleton className="h-14 sm:h-16 w-52 bg-white/10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-12 sm:h-14 w-44 bg-white/10" />
            <Skeleton className="h-2.5 w-36 bg-white/10" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Skeleton className="h-9 sm:h-10 w-32 bg-white/10 rounded-xl" />
          <Skeleton className="h-9 sm:h-10 w-40 bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Right: immagine */}
      <div className="relative h-[240px] sm:h-[320px] lg:h-[400px] overflow-hidden rounded-2xl bg-white/5" />

      {/* Dot navigation placeholder */}
      <div className="col-span-1 lg:col-span-2 flex justify-center gap-2 mt-6 sm:mt-8">
        <Skeleton className="h-2 w-5 bg-white/20 rounded-full" />
        <Skeleton className="h-2 w-2 bg-white/10 rounded-full" />
        <Skeleton className="h-2 w-2 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

function DigitBlock({ value, label }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={padded}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y:  24,  opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="tabular-nums font-bold text-white leading-none text-3xl sm:text-4xl lg:text-5xl"
          >
            {padded}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
    </div>
  );
}

function CountdownTimer({ expiresAt }) {
  const cd = useCountdown(expiresAt);
  if (!cd || cd.expired) return null;
  const urgencyColor =
    cd.days >= 3 ? "shadow-emerald-500/30" :
    cd.days >= 1 ? "shadow-amber-500/30"   :
    "shadow-red-500/30 animate-pulse";
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-white/20 shadow-xl ${urgencyColor}`}>
      <DigitBlock value={cd.days}    label="giorni"  />
      <span className="text-white/40 text-xl sm:text-2xl font-thin mb-4">:</span>
      <DigitBlock value={cd.hours}   label="ore"     />
      <span className="text-white/40 text-xl sm:text-2xl font-thin mb-4">:</span>
      <DigitBlock value={cd.minutes} label="minuti"  />
      <span className="text-white/40 text-xl sm:text-2xl font-thin mb-4">:</span>
      <DigitBlock value={cd.seconds} label="secondi" />
    </div>
  );
}

function PromoSlide({ promo, imgY }) {
  const imgSrc = getVehicleImage(promo);
  const imgPos = getVehicleImagePosition(promo);
  const effectiveSegment = resolvePricingSegment({
    segment: null,
    vehicleCategory: promo.category,
    vehicleSegments: promo.segments || [],
  });
  const originalRent  = promo.monthly_rent;
  const discountPct   = Number(promo.promo_discount_pct);
  const promoRent     = originalRent ? Math.round(originalRent * (1 - discountPct / 100)) : null;
  const originalDisplay = originalRent
    ? formatDisplayedRent(originalRent, { segment: effectiveSegment, vehicleCategory: promo.category, vehicleSegments: promo.segments || [] })
    : null;
  const promoDisplay = promoRent
    ? formatDisplayedRent(promoRent, { segment: effectiveSegment, vehicleCategory: promo.category, vehicleSegments: promo.segments || [] })
    : null;

  return (
    <motion.div
      key={promo.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{   opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 items-center"
    >
      {/* ── Left: contenuto ── */}
      <div className="space-y-4 sm:space-y-6 z-10">
        <div className="flex items-center gap-2">
          <div className="size-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            Offerta Esclusiva · Tempo Limitato
          </span>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold text-[#71BAED] uppercase tracking-widest mb-1">{promo.make}</p>
          <h2 className="font-bold text-white leading-none tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl">
            {promo.model}
          </h2>
          {promo.version && (
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/40 font-medium tracking-wide">{promo.version}</p>
          )}
        </div>

        {/* Countdown + prezzo su mobile: affiancati */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Scade tra</p>
            <CountdownTimer expiresAt={promo.promo_expires_at} />
          </div>

          {promoDisplay && (
            <div className="space-y-0.5">
              {originalDisplay && originalDisplay !== promoDisplay && (
                <div className="flex items-center gap-2">
                  <span className="text-white/30 line-through text-base sm:text-lg tabular-nums">
                    {originalDisplay.toLocaleString("it-IT")}€/mese
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                    <Tag className="size-2.5" />
                    -{discountPct}%
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-white tabular-nums text-4xl sm:text-5xl lg:text-6xl leading-none">
                  {promoDisplay.toLocaleString("it-IT")}€
                </span>
                <span className="text-white/50 text-base sm:text-lg font-medium">/mese</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-white/30">
                IVA{effectiveSegment === "Privati" ? " inclusa" : " esclusa"} · Anticipo 0€
              </p>
            </div>
          )}
        </div>

        {promo.promo_services && (
          <p className="text-xs sm:text-sm text-emerald-300 font-medium flex items-center gap-1.5">
            🎁 {promo.promo_services}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {originalDisplay && promoDisplay && discountPct > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: -3 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg shadow-orange-500/30"
            >
              Risparmia {Math.round(originalDisplay - promoDisplay).toLocaleString("it-IT")}€/mese
            </motion.div>
          )}

          <Link
            to={`/vehicle/${encodeURIComponent(promo.make)}/${encodeURIComponent(promo.model)}`}
            className="group inline-flex items-center gap-2 bg-[#71BAED] hover:bg-[#5aa8df] text-[#0f0f23] font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 text-sm sm:text-base"
          >
            Scopri l'offerta
            <ArrowRight className="size-4 text-[#0f0f23] transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ── Right: immagine (nascosta su mobile molto piccolo, visibile da sm) ── */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[400px] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-transparent to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f23] via-transparent to-transparent z-10 pointer-events-none lg:hidden" />
        <motion.img
          src={imgSrc}
          alt={`${promo.make} ${promo.model}`}
          style={{ y: imgY, objectPosition: imgPos }}
          className="w-full h-full object-cover scale-110"
          onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0.3"; }}
        />
        {discountPct > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: 12 }}
            animate={{ scale: 1, rotate: 12 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 240, damping: 16 }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 size-12 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-xl shadow-red-600/40"
          >
            <span className="text-[8px] sm:text-[10px] font-bold uppercase leading-none">PROMO</span>
            <span className="text-base sm:text-xl font-black leading-none">-{Math.round(discountPct)}%</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function PromoHero() {
  const containerRef = useRef(null);

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("promoHeroDismissed") === "1"
  );
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-home-catalog"],
    queryFn:  () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const promos = vehicles
    .filter(v => v.promo_expires_at && new Date(v.promo_expires_at) > new Date())
    .sort((a, b) => new Date(a.promo_expires_at) - new Date(b.promo_expires_at));

  // Auto-close dopo 30s dall'apertura
  useEffect(() => {
    if (dismissed || promos.length === 0) return;
    const id = setTimeout(dismiss, 30000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed, promos.length]);

  // Auto-slide carosello ogni 5s (in pausa quando il tab è in background)
  const visible = usePageVisible();
  useEffect(() => {
    if (paused || promos.length <= 1 || dismissed || !visible) return;
    const id = setInterval(() => setIdx(i => (i + 1) % promos.length), 5000);
    return () => clearInterval(id);
  }, [paused, promos.length, dismissed, visible]);

  // Reset indice se le promo cambiano
  useEffect(() => {
    setIdx(0);
  }, [promos.length]);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("promoHeroDismissed", "1");
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  if (dismissed) return null;

  if (isLoading) {
    return (
      <section
        aria-hidden="true"
        className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[540px] lg:min-h-[560px]"
        style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #0d1f3c 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-16">
          <PromoHeroSkeleton />
        </div>
      </section>
    );
  }

  if (promos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.section
          ref={containerRef}
          key="promo-hero"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16, height: 0, overflow: "hidden" }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[540px] lg:min-h-[560px]"
          style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #0d1f3c 100%)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
          />
          <div className="absolute top-0 left-1/4 size-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 size-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Pulsante chiusura X */}
          <button type="button"
            onClick={dismiss}
            aria-label="Chiudi offerta"
            className="absolute top-3 right-3 sm:right-4 z-30 size-9 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors duration-200 cursor-pointer"
          >
            <X className="size-4 text-white/70" />
          </button>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-16">
            <AnimatePresence mode="wait">
              <PromoSlide key={promos[idx]?.id} promo={promos[idx]} imgY={imgY} />
            </AnimatePresence>

            {/* Dot navigation (solo se più di una promo) */}
            {promos.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {promos.map((_, i) => (
                  <button type="button"
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Vai alla slide ${i + 1}`}
                    className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors duration-200"
                  >
                    <span className={`h-2 rounded-full transition-all duration-300 ${
                      i === idx ? "bg-white w-5" : "bg-white/30 w-2 hover:bg-white/50"
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.section>
    </AnimatePresence>
  );
}
