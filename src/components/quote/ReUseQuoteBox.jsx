import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Info, CheckCircle2, Shield, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offersService } from "@/services/offers";
import {
  ADVANCE_BRACKETS,
  formatAdvanceAmount,
  formatDisplayedRent,
  computeNetMonthlyRent,
} from "@/lib/vehiclePricing";

const TEAL = "#0d9488";
const TEAL_ACCENT = "#5eead4";
const NAVY = "#2D2E82";

const STOCK_DURATIONS = [12, 24];
const STOCK_KM = [10000, 20000];

const ALL_DURATIONS = [12, 24, 36, 48, 60];
const ALL_KM = [10000, 15000, 20000, 25000, 30000];

const STEPS = [
  { n: 1, label: "Durata" },
  { n: 2, label: "Chilometri" },
  { n: 3, label: "Anticipo" },
];

function isStockConfig(c) {
  return (
    STOCK_DURATIONS.includes(c.duration_months) &&
    STOCK_KM.includes(c.annual_km) &&
    Number(c.advance_payment ?? 0) === 0
  );
}

function StepLabel({ n, children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span
        className="size-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
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
    <button type="button"
      onClick={onClick}
      disabled={!available}
      className={`relative py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer ${cls}`}
      style={selected ? { backgroundColor: TEAL, borderColor: TEAL_ACCENT, boxShadow: "0 4px 6px -1px rgba(13,148,136,0.2)" } : {}}
    >
      {children}
      <span
        className="absolute -top-1 -right-1 size-2.5 rounded-full transition-opacity duration-150"
        style={{ backgroundColor: TEAL_ACCENT, opacity: selected ? 1 : 0, pointerEvents: "none" }}
      />
    </button>
  );
}

/* ── Card UI (solo stock) ──────────────────────────────────────────────────── */

function StockCardView({ reuseConfigs, options, fixedMake, fixedModel, onRequestQuote, reuseSegment = "ReUse" }) {
  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    setSelected(null);
  }, [fixedMake, fixedModel]);

  // Segmento "logico" per IVA derivato dal segmento della config (non dal tab).
  // ReUse-Privati -> Privati (IVA inclusa), ReUse-Business -> P.IVA (+IVA), ReUse -> +IVA
  const logicalFromConfigSeg = (seg) =>
    seg === "ReUse-Privati" ? "Privati" :
    seg === "ReUse-Business" ? "P.IVA" :
    seg;

  const handleSelect = (duration, km) => {
    setSelected({ duration, km });
  };

  const handleRequestQuote = () => {
    if (!selected) return;
    const config = options[`${selected.duration}|${selected.km}`];
    onRequestQuote?.({
      make: fixedMake,
      model: fixedModel,
      segment: reuseSegment,
      duration: selected.duration,
      annualKm: selected.km,
      advance: 0,
      monthlyRent: config?.monthly_rent ?? null,
      baseMonthlyRent: config?.monthly_rent ?? null,
    });
  };

  const selectedConfig = selected ? options[`${selected.duration}|${selected.km}`] : null;
  const selectedRent = selectedConfig?.monthly_rent ?? null;

  const displayRent = selectedRent != null
    ? formatDisplayedRent(Number(selectedRent), {
        segment: logicalFromConfigSeg(selectedConfig?.segment ?? reuseSegment),
        vehicleCategory: null,
        vehicleSegments: [logicalFromConfigSeg(selectedConfig?.segment ?? reuseSegment)],
      })
    : null;

  return (
    <>
      <p className="text-xs text-muted-foreground">Seleziona durata e chilometraggio:</p>

      <div className="space-y-3">
        {STOCK_DURATIONS.map(duration => (
          <div key={duration} className="grid grid-cols-2 gap-2.5">
            {STOCK_KM.map(km => {
              const config = options[`${duration}|${km}`];
              const available = !!config;
              const cardLogical = logicalFromConfigSeg(config?.segment ?? reuseSegment);
              const display = config
                ? formatDisplayedRent(Number(config.monthly_rent), {
                    segment: cardLogical,
                    vehicleCategory: null,
                    vehicleSegments: [cardLogical],
                  })
                : null;
              const isSelected = selected?.duration === duration && selected?.km === km;

              if (!available) return null;

              return (
                <motion.button
                  key={`${duration}-${km}`}
                  onClick={() => handleSelect(duration, km)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 shadow-md"
                      : "border-border hover:border-emerald-300"
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: "#f0fdfa", borderColor: TEAL, boxShadow: `0 4px 12px ${TEAL}20` }
                      : { backgroundColor: "#fff" }
                  }
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold leading-none" style={isSelected ? { color: TEAL } : { color: NAVY }}>
                      {duration} mesi · {km.toLocaleString("it-IT")} km/anno
                    </span>
                    {isSelected && <CheckCircle2 className="size-3.5" style={{ color: TEAL }} />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold leading-none ${isSelected ? "" : "text-foreground"}`} style={isSelected ? { color: TEAL } : {}}>
                      €{display?.toLocaleString("it-IT")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/mese</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Anticipo €0 · {cardLogical === "Privati" ? "IVA inclusa" : "+ IVA 22%"}
                  </p>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Price display */}
      {selectedRent && (
        <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(to bottom right, ${TEAL}, #0f766e)` }}>
          <div className="p-5 text-center">
            <p className="text-white/50 text-xs mb-1">Canone mensile</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-heading font-bold text-5xl text-white tracking-tight">
                €{displayRent?.toLocaleString("it-IT")}
              </span>
              <span className="text-white/40 text-sm">/mese</span>
            </div>
            <p className="text-white/30 text-[11px] mt-1">
              {logicalFromConfigSeg(selectedConfig?.segment ?? reuseSegment) === "Privati"
                ? "IVA inclusa · Anticipo €0"
                : "+ IVA 22% · Anticipo €0"}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={handleRequestQuote}
        disabled={!selected}
        className="w-full h-13 font-bold rounded-xl text-base py-3.5 cursor-pointer transition-all duration-200 disabled:opacity-40"
        style={selected ? { backgroundColor: TEAL, color: "#fff", boxShadow: `0 4px 12px ${TEAL}40` } : {}}
      >
        Richiedi informazioni <ArrowRight className="size-4 ml-2" />
      </Button>
    </>
  );
}

/* ── QuoteBox UI (config extra presenti) ───────────────────────────────────── */

function ConfigQuoteBoxView({ reuseConfigs, fixedMake, fixedModel, onRequestQuote, reuseSegment }) {
  const [duration, setDuration] = useState(12);
  const [annualKm, setAnnualKm] = useState(10000);
  const [advance, setAdvance] = useState(0);
  const featuredInitialized = React.useRef(false);

  const activeConfigs = reuseConfigs;

  // Quando i configs arrivano, posizionati sulla featured (o prima disponibile) — mai sul fallback hardcoded
  useEffect(() => {
    if (featuredInitialized.current) return;
    if (activeConfigs.length === 0) return;
    const target = activeConfigs.find(c => c.is_featured) || activeConfigs[0];
    setDuration(target.duration_months);
    setAnnualKm(target.annual_km);
    setAdvance(Number(target.advance_payment ?? 0));
    featuredInitialized.current = true;
  }, [activeConfigs]);

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

  // Segmento "logico" per IVA derivato dal segmento della config (non dal tab).
  // ReUse-Privati -> Privati (IVA inclusa), ReUse-Business -> P.IVA (+IVA), ReUse -> +IVA
  const logicalFromConfigSeg = (seg) =>
    seg === "ReUse-Privati" ? "Privati" :
    seg === "ReUse-Business" ? "P.IVA" :
    seg;

  const computedRent = useMemo(() => {
    if (!exactConfig) return null;
    return computeNetMonthlyRent(exactConfig.monthly_rent, advance, duration);
  }, [exactConfig, advance, duration]);

  const displayRent = computedRent
    ? formatDisplayedRent(computedRent, {
        segment: logicalFromConfigSeg(exactConfig?.segment ?? reuseSegment),
        vehicleCategory: null,
        vehicleSegments: [logicalFromConfigSeg(exactConfig?.segment ?? reuseSegment)],
      })
    : null;

  useEffect(() => {
    if (activeConfigs.length && !availableKm.has(annualKm)) {
      const first = ALL_KM.find(k => availableKm.has(k));
      if (first) setAnnualKm(first);
    }
  }, [duration, availableKm]);

  useEffect(() => {
    if (activeConfigs.length && !availableDurations.has(duration)) {
      const sorted = Array.from(availableDurations).sort((a, b) => a - b);
      if (sorted[0]) setDuration(sorted[0]);
    }
  }, [activeConfigs, availableDurations, duration]);

  useEffect(() => {
    featuredInitialized.current = false;
  }, [fixedMake, fixedModel]);

  const handleRequestQuote = useCallback(() => {
    if (!computedRent) return;
    onRequestQuote?.({
      make: fixedMake,
      model: fixedModel,
      segment: reuseSegment,
      duration,
      annualKm,
      advance,
      monthlyRent: computedRent,
      baseMonthlyRent: exactConfig?.monthly_rent ?? null,
    });
  }, [onRequestQuote, fixedMake, fixedModel, duration, annualKm, advance, computedRent, reuseSegment, exactConfig]);

  const ctaClass = "w-full h-13 font-bold rounded-xl text-base py-3.5 cursor-pointer transition-all duration-200";

  return (
    <>
      {/* Step indicators */}
      <div className="flex items-center gap-0 mt-4 relative z-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-1.5">
              <div
                className="size-5 rounded-full flex items-center justify-center"
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

      {/* Step 1: Duration */}
      <div>
        <StepLabel n={1}>Durata contratto</StepLabel>
        <div className="grid grid-cols-5 gap-2">
          {ALL_DURATIONS.map(d => {
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
          {ALL_KM.map(k => {
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
              <Info className="size-3" /> Canone ricalcolato
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
                <p className="text-white/30 text-[11px] mt-1">
                  {logicalFromConfigSeg(exactConfig?.segment ?? reuseSegment) === "Privati" ? "IVA inclusa" : "+ IVA 22%"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-[11px] text-white/30 mb-2">
                <span>{duration} mesi</span>
                <span className="size-1 rounded-full bg-white/20" />
                <span>{annualKm.toLocaleString("it-IT")} km/anno</span>
                <span className="size-1 rounded-full bg-white/20" />
                <span>anticipo €{advance.toLocaleString("it-IT")}</span>
              </div>

              {exactConfig && advance === Number(exactConfig.advance_payment ?? 0) && (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="size-3 text-green-400" />
                  <span className="text-green-400 text-[10px] font-medium">Prezzo di listino confermato</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-white/40 text-sm">Seleziona una combinazione</p>
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
        Richiedi Offerta Personalizzata <ArrowRight className="size-4 ml-2" />
      </Button>

      {/* Trust */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" /> Risposta entro 24h
        </span>
        <span className="size-1 rounded-full bg-border" />
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Shield className="size-3" /> Nessun impegno
        </span>
      </div>
    </>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

export default function ReUseQuoteBox({ fixedMake, fixedModel, onRequestQuote, segment: reuseSegment = "ReUse" }) {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["offer-configs", fixedMake, fixedModel, "ReUse"],
    queryFn: () => offersService.getConfigs(fixedMake, fixedModel),
    enabled: !!fixedMake && !!fixedModel,
    staleTime: 5 * 60 * 1000,
  });

  const reuseConfigs = useMemo(
    () => configs.filter(c => {
      if (!c.is_active) return false;
      if (c.segment === reuseSegment) return true;
      // Tolleranza: segmento "ReUse" (legacy) accetta anche le varianti ReUse-Privati / ReUse-Business
      if (reuseSegment === "ReUse" && (c.segment === "ReUse-Privati" || c.segment === "ReUse-Business")) return true;
      return false;
    }),
    [configs, reuseSegment],
  );

  const options = useMemo(() => {
    const map = {};
    reuseConfigs.forEach(c => {
      const key = `${c.duration_months}|${c.annual_km}`;
      map[key] = c;
    });
    return map;
  }, [reuseConfigs]);

  const hasNonStock = reuseConfigs.some(c => !isStockConfig(c));
  const hasAny = reuseConfigs.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden px-5 sm:px-6 pt-5 pb-6" style={{ background: `linear-gradient(135deg, ${TEAL}, #0f766e)` }}>
        <div
          className="absolute -top-8 -right-8 size-32 rounded-full pointer-events-none"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", filter: "blur(24px)" }}
        />
        <div className="flex items-center gap-2.5 mb-1 relative z-10">
          <div className="size-8 rounded-lg flex items-center justify-center bg-white/15">
            <RefreshCw className="size-4 text-white" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">Re-Use Certificato</h3>
        </div>
        <p className="text-white/60 text-sm relative z-10">
          {fixedMake} {fixedModel} · {hasNonStock ? "Configura il canone" : "Canone vincolato · Anticipo €0"}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted/40 rounded-xl" />
            ))}
          </div>
        ) : !hasAny ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Nessuna offerta Re-Use disponibile per questo veicolo.</p>
          </div>
        ) : (
          hasNonStock
            ? <ConfigQuoteBoxView reuseConfigs={reuseConfigs} fixedMake={fixedMake} fixedModel={fixedModel} onRequestQuote={onRequestQuote} reuseSegment={reuseSegment} />
            : <StockCardView reuseConfigs={reuseConfigs} options={options} fixedMake={fixedMake} fixedModel={fixedModel} onRequestQuote={onRequestQuote} reuseSegment={reuseSegment} />
        )}

        {/* Trust — solo per stock */}
        {!hasNonStock && hasAny && (
          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground">
            <RefreshCw className="size-3" /> Usato certificato NLT
          </div>
        )}
      </div>
    </div>
  );
}
