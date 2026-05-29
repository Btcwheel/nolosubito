import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calculator, Info, CheckCircle2, Shield, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offersService } from "@/services/offers";
import {
  ADVANCE_BRACKETS,
  formatAdvanceAmount,
  formatDisplayedRent,
} from "@/lib/vehiclePricing";

const DURATION_OPTIONS = [12, 24, 36, 48, 60];
const KM_OPTIONS = [10000, 15000, 20000, 25000, 30000];
const TEAL = "#0d9488";
const TEAL_LIGHT = "#14b8a6";
const TEAL_ACCENT = "#5eead4";

const STEPS = [
  { n: 1, label: "Durata" },
  { n: 2, label: "Chilometri" },
  { n: 3, label: "Anticipo" },
];

function StepLabel({ n, children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span
        className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
        style={{ backgroundColor: TEAL_ACCENT }}
      >
        {n}
      </span>
      <label className="text-xs font-semibold text-foreground">{children}</label>
    </div>
  );
}

function OptionButton({ selected, available = true, onClick, children }) {
  const cls = selected
    ? "text-white shadow-md"
    : available
      ? "border-border text-foreground hover:opacity-80"
      : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through";

  return (
    <button
      onClick={onClick}
      disabled={!available}
      className={`relative py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer ${cls}`}
      style={selected ? { backgroundColor: TEAL, borderColor: TEAL_ACCENT, boxShadow: "0 4px 6px -1px rgba(13,148,136,0.2)" } : {}}
    >
      {children}
      <span
        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full transition-opacity duration-150"
        style={{ backgroundColor: TEAL_ACCENT, opacity: selected ? 1 : 0, pointerEvents: "none" }}
      />
    </button>
  );
}

export default function ReUseQuoteBox({ fixedMake, fixedModel, onRequestQuote }) {
  const [duration, setDuration] = useState(12);
  const [annualKm, setAnnualKm] = useState(10000);
  const [advance, setAdvance] = useState(0);
  const featuredInitialized = React.useRef(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["offer-configs", fixedMake, fixedModel, "ReUse"],
    queryFn: () => offersService.getConfigs(fixedMake, fixedModel),
    enabled: !!fixedMake && !!fixedModel,
    staleTime: 5 * 60 * 1000,
  });

  const reuseConfigs = useMemo(
    () => configs.filter(c => c.segment === "ReUse" && c.is_active),
    [configs],
  );

  const activeConfigs = reuseConfigs;

  const availableDurations = useMemo(
    () => new Set(activeConfigs.map(c => c.duration_months)),
    [activeConfigs],
  );

  const availableKm = useMemo(
    () => new Set(activeConfigs.filter(c => c.duration_months === duration).map(c => c.annual_km)),
    [activeConfigs, duration],
  );

  const exactConfig = useMemo(
    () => activeConfigs.find(c => c.duration_months === duration && c.annual_km === annualKm) ?? null,
    [activeConfigs, duration, annualKm],
  );

  const computedRent = useMemo(() => {
    if (!exactConfig) return null;
    const diff = advance - Number(exactConfig.advance_payment ?? 0);
    return Math.max(Math.round(Number(exactConfig.monthly_rent) - diff / duration), 50);
  }, [exactConfig, advance, duration]);

  const displayRent = computedRent
    ? formatDisplayedRent(computedRent, {
        segment: "ReUse",
        vehicleCategory: null,
        vehicleSegments: ["ReUse"],
      })
    : null;

  useEffect(() => {
    if (activeConfigs.length && !availableKm.has(annualKm)) {
      const first = KM_OPTIONS.find(k => availableKm.has(k));
      if (first) setAnnualKm(first);
    }
  }, [duration, availableKm]);

  useEffect(() => {
    if (activeConfigs.length && !availableDurations.has(duration)) {
      const sorted = [...availableDurations].sort((a, b) => a - b);
      if (sorted[0]) setDuration(sorted[0]);
    }
  }, [activeConfigs, availableDurations, duration]);

  useEffect(() => {
    if (featuredInitialized.current) return;
    const featured = activeConfigs.find(c => c.is_featured);
    if (featured) {
      setDuration(featured.duration_months);
      setAnnualKm(featured.annual_km);
      setAdvance(Number(featured.advance_payment ?? 0));
      featuredInitialized.current = true;
    }
  }, [activeConfigs]);

  useEffect(() => {
    setDuration(12);
    setAnnualKm(10000);
    setAdvance(0);
    featuredInitialized.current = false;
  }, [fixedMake, fixedModel]);

  const handleRequestQuote = useCallback(() => {
    if (!computedRent) return;
    onRequestQuote?.({
      make: fixedMake,
      model: fixedModel,
      segment: "ReUse",
      duration,
      annualKm,
      advance,
      monthlyRent: computedRent,
    });
  }, [onRequestQuote, fixedMake, fixedModel, duration, annualKm, advance, computedRent]);

  const hasAny = reuseConfigs.length > 0;

  const ctaClass = "w-full h-13 font-bold rounded-xl text-base py-3.5 cursor-pointer transition-all duration-200";

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden px-5 sm:px-6 pt-5 pb-6" style={{ background: `linear-gradient(135deg, ${TEAL}, #0f766e)` }}>
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", filter: "blur(24px)" }}
        />
        <div className="flex items-center gap-2.5 mb-1 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">Re-Use Certificato</h3>
        </div>
        <p className="text-white/60 text-sm relative z-10">
          {fixedMake} {fixedModel} · Canone vincolato
        </p>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mt-4 relative z-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)", borderWidth: 1 }}
                >
                  <span className="text-[10px] font-bold text-white">{s.n}</span>
                </div>
                <span className="text-[11px] text-white/50">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/15 mx-2" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {isLoading ? (
          <div className="space-y-5 animate-pulse">
            <div className="space-y-2.5">
              <div className="h-4 w-24 bg-muted/40 rounded" />
              <div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted/40 rounded-xl" />)}</div>
            </div>
            <div className="space-y-2.5">
              <div className="h-4 w-32 bg-muted/40 rounded" />
              <div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted/40 rounded-xl" />)}</div>
            </div>
            <div className="space-y-2.5">
              <div className="h-4 w-20 bg-muted/40 rounded" />
              <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted/40 rounded-xl" />)}</div>
            </div>
          </div>
        ) : !hasAny ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Nessuna offerta Re-Use disponibile per questo veicolo.</p>
          </div>
        ) : (
          <>
            {/* Step 1: Duration */}
            <div>
              <StepLabel n={1}>Durata contratto</StepLabel>
              <div className="grid grid-cols-5 gap-2">
                {DURATION_OPTIONS.map(d => {
                  const available = availableDurations.has(d);
                  return (
                    <OptionButton
                      key={d}
                      selected={duration === d}
                      available={available}
                      onClick={() => available && setDuration(d)}
                    >
                      {d}<span className="text-[10px] font-normal opacity-70">m</span>
                    </OptionButton>
                  );
                })}
              </div>
            </div>

            {/* Step 2: KM */}
            <div>
              <StepLabel n={2}>Chilometri annui</StepLabel>
              <div className="grid grid-cols-5 gap-2">
                {KM_OPTIONS.map(k => {
                  const available = availableKm.has(k);
                  return (
                    <OptionButton
                      key={k}
                      selected={annualKm === k}
                      available={available}
                      onClick={() => available && setAnnualKm(k)}
                    >
                      {k.toLocaleString("it-IT")}
                      <span className="text-[10px] font-normal opacity-70"> km</span>
                    </OptionButton>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Advance */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <StepLabel n={3}>Anticipo</StepLabel>
                {exactConfig && advance !== Number(exactConfig.advance_payment ?? 0) && (
                  <span className="text-[10px] flex items-center gap-1" style={{ color: `${TEAL_ACCENT}B3` }}>
                    <Info className="w-3 h-3" /> Canone ricalcolato
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ADVANCE_BRACKETS.map(a => (
                  <OptionButton key={a} selected={advance === a} onClick={() => setAdvance(a)}>
                    {formatAdvanceAmount(a)}
                  </OptionButton>
                ))}
              </div>
            </div>

            {/* Price display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${computedRent}-${duration}-${annualKm}-${advance}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: `linear-gradient(to bottom right, ${TEAL}, #0f766e)` }}
              >
                {computedRent ? (
                  <div className="p-5">
                    <div className="text-center mb-4">
                      <p className="text-white/40 text-xs mb-1">Canone mensile</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-heading font-bold text-5xl text-white tracking-tight">
                          €{displayRent?.toLocaleString("it-IT")}
                        </span>
                        <span className="text-white/40 text-sm">/mese</span>
                      </div>
                      <p className="text-white/30 text-[11px] mt-1">+ IVA 22%</p>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-[11px] text-white/30 mb-2">
                      <span>{duration} mesi</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{annualKm.toLocaleString("it-IT")} km/anno</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>anticipo €{advance.toLocaleString("it-IT")}</span>
                    </div>

                    {exactConfig && advance === Number(exactConfig.advance_payment ?? 0) && (
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-[10px] font-medium">Prezzo di listino confermato</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-white/40 text-sm">
                      {reuseConfigs.length === 0
                        ? "Nessuna offerta disponibile"
                        : "Seleziona una combinazione"}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <Button
              onClick={handleRequestQuote}
              disabled={!computedRent}
              className={`${ctaClass} disabled:opacity-40`}
              style={computedRent ? { backgroundColor: TEAL, color: "#fff", boxShadow: `0 4px 6px -1px ${TEAL}40` } : {}}
            >
              Richiedi Offerta Personalizzata <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" /> Risposta entro 24h
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="w-3 h-3" /> Nessun impegno
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
