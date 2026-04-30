import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calculator, Info, CheckCircle2, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offersService } from "@/services/offers";
import { ADVANCE_BRACKETS, formatAdvanceAmount } from "@/lib/vehiclePricing";

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_DURATIONS = [24, 36, 48, 60];
const ALL_KM = [10000, 15000, 20000, 25000, 30000, 40000];
const NAVY = "#2D2E82";
const ACCENT = "#71BAED";

const STEPS = [
  { n: 1, label: "Durata" },
  { n: 2, label: "Chilometri" },
  { n: 3, label: "Anticipo" },
];

const SELECTED_STYLE = {
  backgroundColor: NAVY,
  borderColor: ACCENT,
  boxShadow: "0 4px 6px -1px rgba(45,46,130,0.2)",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StepLabel({ n, children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span
        className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
        style={{ backgroundColor: ACCENT }}
      >
        {n}
      </span>
      <label className="text-xs font-semibold text-foreground">{children}</label>
    </div>
  );
}

function OptionButton({ selected, available = true, onClick, children, layoutId }) {
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
      style={selected ? SELECTED_STYLE : {}}
    >
      {children}
      {selected && layoutId && (
        <motion.span
          layoutId={layoutId}
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: ACCENT }}
        />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuoteBox({ fixedMake, fixedModel, segment, onRequestQuote }) {
  const [selectedMake, setSelectedMake] = useState(fixedMake || "");
  const [selectedModel, setSelectedModel] = useState(fixedModel || "");
  const [duration, setDuration] = useState(36);
  const [annualKm, setAnnualKm] = useState(15000);
  const [advance, setAdvance] = useState(3000);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: vehicles = [] } = useQuery({
    queryKey: ["offers-list"],
    queryFn: offersService.list,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allConfigs = [] } = useQuery({
    queryKey: ["offer-configs-all"],
    queryFn: offersService.getAllConfigs,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived state ─────────────────────────────────────────────────────────
  const makes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);

  const models = useMemo(() => {
    if (!selectedMake) return [];
    return [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();
  }, [vehicles, selectedMake]);

  const vehicleConfigs = useMemo(() => {
    if (!selectedMake || !selectedModel) return [];
    return allConfigs.filter(
      c =>
        c.make === selectedMake &&
        c.model === selectedModel &&
        c.is_active &&
        (!segment || c.segment === segment),
    );
  }, [allConfigs, selectedMake, selectedModel, segment]);

  const availableDurations = useMemo(
    () => new Set(vehicleConfigs.map(c => c.duration_months)),
    [vehicleConfigs],
  );

  const availableKm = useMemo(
    () => new Set(vehicleConfigs.filter(c => c.duration_months === duration).map(c => c.annual_km)),
    [vehicleConfigs, duration],
  );

  const exactConfig = useMemo(
    () => vehicleConfigs.find(c => c.duration_months === duration && c.annual_km === annualKm) ?? null,
    [vehicleConfigs, duration, annualKm],
  );

  const computedRent = useMemo(() => {
    if (!exactConfig) return null;
    const diff = advance - Number(exactConfig.advance_payment ?? 0);
    return Math.max(Math.round(Number(exactConfig.monthly_rent) - diff / duration), 50);
  }, [exactConfig, advance, duration]);

  const rentWithVat = computedRent ? Math.round(computedRent * 1.22) : null;

  const netCostPiva = computedRent
    ? Math.round(computedRent - computedRent * 0.22 * 0.4 - computedRent * 0.8 * 0.3)
    : null;
  const risparmioMensile = rentWithVat && netCostPiva ? rentWithVat - netCostPiva : null;

  // ── Auto-select effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (vehicleConfigs.length && !availableKm.has(annualKm)) {
      const first = ALL_KM.find(k => availableKm.has(k));
      if (first) setAnnualKm(first);
    }
  }, [duration, availableKm]); // eslint-disable-line

  useEffect(() => {
    if (vehicleConfigs.length && !availableDurations.has(duration)) {
      const sorted = [...availableDurations].sort((a, b) => a - b);
      if (sorted[0]) setDuration(sorted[0]);
    }
  }, [vehicleConfigs]); // eslint-disable-line

  useEffect(() => { if (fixedMake) setSelectedMake(fixedMake); }, [fixedMake]);
  useEffect(() => { if (fixedModel) setSelectedModel(fixedModel); }, [fixedModel]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMakeChange = useCallback(e => {
    setSelectedMake(e.target.value);
    if (!fixedModel) setSelectedModel("");
  }, [fixedModel]);

  const handleRequestQuote = useCallback(() => {
    onRequestQuote?.({
      make: selectedMake,
      model: selectedModel,
      segment: exactConfig?.segment ?? segment,
      duration,
      annualKm,
      advance,
      monthlyRent: computedRent,
    });
  }, [onRequestQuote, selectedMake, selectedModel, exactConfig, segment, duration, annualKm, advance, computedRent]);

  const vehicleLink = selectedMake && selectedModel
    ? `/vehicle/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}`
    : null;

  const displayRent = segment === "Privati" ? rentWithVat : computedRent;
  const isModifiedAdvance = exactConfig && advance !== Number(exactConfig.advance_payment ?? 0);
  const isListPrice = exactConfig && !isModifiedAdvance;

  const ctaClass = "w-full h-13 font-bold rounded-xl text-base py-3.5 cursor-pointer transition-all duration-200";
  const ctaStyle = { backgroundColor: ACCENT, color: "#FFFFFF", boxShadow: `0 4px 6px -1px ${ACCENT}40` };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">

      {/* Header */}
      <div className="relative overflow-hidden px-5 sm:px-6 pt-5 pb-6" style={{ backgroundColor: NAVY }}>
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ backgroundColor: `${ACCENT}20`, filter: "blur(24px)" }}
        />
        <div className="flex items-center gap-2.5 mb-1 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
            <Calculator className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">Configura il Canone</h3>
        </div>
        <p className="text-white/40 text-sm relative z-10">
          {fixedMake ? `${selectedMake} ${selectedModel}` : "Scegli veicolo e configurazione"}
        </p>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mt-4 relative z-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}40`, borderWidth: 1 }}
                >
                  <span className="text-[10px] font-bold" style={{ color: ACCENT }}>{s.n}</span>
                </div>
                <span className="text-[11px] text-white/40">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10 mx-2" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">

        {/* Make & Model — only when not fixed */}
        {!fixedMake && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Marca</label>
              <select
                value={selectedMake}
                onChange={handleMakeChange}
                className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#71BAED]/50"
                style={{ "--tw-ring-color": `${ACCENT}30` }}
              >
                <option value="">Seleziona marca</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Modello</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none disabled:opacity-40"
              >
                <option value="">Seleziona modello</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Duration */}
        <div>
          <StepLabel n={1}>Durata contratto</StepLabel>
          <div className="grid grid-cols-4 gap-2">
            {ALL_DURATIONS.map(d => {
              const available = !vehicleConfigs.length || availableDurations.has(d);
              return (
                <OptionButton
                  key={d}
                  selected={duration === d}
                  available={available}
                  onClick={() => available && setDuration(d)}
                  layoutId="duration-dot"
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
          <div className="grid grid-cols-3 gap-2">
            {ALL_KM.map(k => {
              const available = !vehicleConfigs.length || availableKm.has(k);
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
            {isModifiedAdvance && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: `${ACCENT}B3` }}>
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
            style={{ background: `linear-gradient(to bottom right, ${NAVY}, hsl(220,100%,12%))` }}
          >
            {computedRent ? (
              <div className="p-5">
                {/* Main price */}
                <div className="text-center mb-4">
                  <p className="text-white/40 text-xs mb-1">Canone mensile</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading font-bold text-5xl text-white tracking-tight">
                      €{displayRent.toLocaleString("it-IT")}
                    </span>
                    <span className="text-white/40 text-sm">/mese</span>
                  </div>
                  <p className="text-white/30 text-[11px] mt-1">
                    {segment === "Privati" ? "IVA 22% inclusa" : "+ IVA 22%"}
                  </p>
                </div>



                {/* Config summary */}
                <div className="flex items-center justify-center gap-3 text-[11px] text-white/30 mb-2">
                  <span>{duration} mesi</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{annualKm.toLocaleString("it-IT")} km/anno</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>anticipo €{advance.toLocaleString("it-IT")}</span>
                </div>

                {isListPrice && (
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-[10px] font-medium">Prezzo di listino confermato</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-white/40 text-sm">
                  {!selectedMake || !selectedModel
                    ? "Seleziona marca e modello"
                    : vehicleConfigs.length === 0
                      ? "Nessuna offerta disponibile"
                      : "Seleziona una combinazione"}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        {onRequestQuote ? (
          <Button
            onClick={handleRequestQuote}
            disabled={!computedRent}
            className={`${ctaClass} disabled:opacity-40`}
            style={ctaStyle}
          >
            Richiedi Offerta Personalizzata <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : vehicleLink ? (
          <Link to={vehicleLink} className="block">
            <Button className={ctaClass} style={ctaStyle}>
              Vedi Dettagli e Prezzi <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Link to="/contact">
            <Button className={ctaClass} style={ctaStyle}>
              Richiedi Offerta <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}

        {/* Trust micro-copy */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" /> Risposta entro 24h
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Shield className="w-3 h-3" /> Nessun impegno
          </span>
        </div>
      </div>
    </div>
  );
}
