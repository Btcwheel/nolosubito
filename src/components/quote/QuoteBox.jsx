import React, { useState, useEffect, useMemo } from "react";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Info, CheckCircle2, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ALL_DURATIONS = [24, 36, 48, 60];
const ALL_KM        = [10000, 15000, 20000, 25000, 30000, 40000];
const ALL_ADVANCES  = [0, 1500, 3000, 5000, 7500, 10000];

const STEPS = [
  { n: 1, label: "Durata" },
  { n: 2, label: "Chilometri" },
  { n: 3, label: "Anticipo" },
];

export default function QuoteBox({ fixedMake, fixedModel, segment, onRequestQuote }) {
  const [selectedMake,  setSelectedMake]  = useState(fixedMake  || "");
  const [selectedModel, setSelectedModel] = useState(fixedModel || "");
  const [duration,  setDuration]  = useState(36);
  const [annualKm,  setAnnualKm]  = useState(15000);
  const [advance,   setAdvance]   = useState(3000);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["offers-list"],
    queryFn:  () => offersService.list(),
  });

  const { data: allConfigs = [] } = useQuery({
    queryKey: ["offer-configs-all"],
    queryFn:  () => offersService.getAllConfigs(),
  });

  const makes  = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);
  const models = useMemo(() => {
    if (!selectedMake) return [];
    return [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();
  }, [vehicles, selectedMake]);

  const vehicleConfigs = useMemo(() => {
    if (!selectedMake || !selectedModel) return [];
    return allConfigs.filter(c =>
      c.make === selectedMake &&
      c.model === selectedModel &&
      c.is_active &&
      (segment ? c.segment === segment : true)
    );
  }, [allConfigs, selectedMake, selectedModel, segment]);

  const availableDurations = useMemo(() => new Set(vehicleConfigs.map(c => c.duration_months)), [vehicleConfigs]);
  const availableKm        = useMemo(
    () => new Set(vehicleConfigs.filter(c => c.duration_months === duration).map(c => c.annual_km)),
    [vehicleConfigs, duration]
  );

  const exactConfig = useMemo(
    () => vehicleConfigs.find(c => c.duration_months === duration && c.annual_km === annualKm) || null,
    [vehicleConfigs, duration, annualKm]
  );

  const computedRent = useMemo(() => {
    if (!exactConfig) return null;
    const diff = advance - Number(exactConfig.advance_payment ?? 0);
    return Math.max(Math.round(Number(exactConfig.monthly_rent) - diff / duration), 50);
  }, [exactConfig, advance, duration]);

  const rentWithVat = computedRent ? Math.round(computedRent * 1.22) : null;

  // P.IVA net cost: canone - (IVA detraibile 40%) - (deduzione 80% * aliquota 30%)
  const netCostPiva = computedRent
    ? Math.round(computedRent - (computedRent * 0.22 * 0.40) - (computedRent * 0.80 * 0.30))
    : null;
  const risparmioMensile = rentWithVat && netCostPiva ? rentWithVat - netCostPiva : null;

  useEffect(() => {
    if (vehicleConfigs.length > 0 && !availableKm.has(annualKm)) {
      const first = ALL_KM.find(k => availableKm.has(k));
      if (first) setAnnualKm(first);
    }
  }, [duration, availableKm]);

  useEffect(() => {
    if (vehicleConfigs.length > 0 && !availableDurations.has(duration)) {
      const sorted = [...availableDurations].sort((a, b) => a - b);
      if (sorted[0]) setDuration(sorted[0]);
    }
  }, [vehicleConfigs]);

  useEffect(() => { if (fixedMake)  setSelectedMake(fixedMake);  }, [fixedMake]);
  useEffect(() => { if (fixedModel) setSelectedModel(fixedModel); }, [fixedModel]);

  const vehicleLink = selectedMake && selectedModel
    ? `/vehicle/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}`
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">

      {/* ── Header ── */}
      <div className="relative bg-navy overflow-hidden px-5 sm:px-6 pt-5 pb-6">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-electric/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-1 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-electric" />
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
                <div className="w-5 h-5 rounded-full bg-electric/20 border border-electric/40 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-electric">{s.n}</span>
                </div>
                <span className="text-[11px] text-white/40">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-white/10 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">

        {/* Make & Model — solo se non fixed */}
        {!fixedMake && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Marca</label>
              <select
                value={selectedMake}
                onChange={e => { setSelectedMake(e.target.value); if (!fixedModel) setSelectedModel(""); }}
                className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
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
                className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50 disabled:opacity-40"
              >
                <option value="">Seleziona modello</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 1: Duration ── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-4 h-4 rounded-full bg-electric text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
            <label className="text-xs font-semibold text-foreground">Durata contratto</label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ALL_DURATIONS.map(d => {
              const available = vehicleConfigs.length === 0 || availableDurations.has(d);
              const selected  = duration === d;
              return (
                <button key={d} onClick={() => available && setDuration(d)} disabled={!available}
                  className={`relative py-3 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer
                    ${selected
                      ? "bg-navy border-electric text-white shadow-md shadow-navy/20"
                      : available
                      ? "border-border text-foreground hover:border-electric/50 hover:bg-electric/5"
                      : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"}`}
                >
                  {d}<span className="text-[10px] font-normal opacity-70">m</span>
                  {selected && (
                    <motion.span
                      layoutId="duration-dot"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-electric rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 2: KM ── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-4 h-4 rounded-full bg-electric text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
            <label className="text-xs font-semibold text-foreground">Chilometri annui</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_KM.map(k => {
              const available = vehicleConfigs.length === 0 || availableKm.has(k);
              const selected  = annualKm === k;
              return (
                <button key={k} onClick={() => available && setAnnualKm(k)} disabled={!available}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer
                    ${selected
                      ? "bg-navy border-electric text-white shadow-md shadow-navy/20"
                      : available
                      ? "border-border text-foreground hover:border-electric/50 hover:bg-electric/5"
                      : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"}`}
                >
                  {k >= 1000 ? `${k / 1000}k` : k}
                  <span className="text-[10px] font-normal opacity-70"> km</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 3: Advance ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-electric text-white text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
              <label className="text-xs font-semibold text-foreground">Anticipo iniziale</label>
            </div>
            {exactConfig && advance !== Number(exactConfig.advance_payment ?? 0) && (
              <span className="text-[10px] text-electric/70 flex items-center gap-1">
                <Info className="w-3 h-3" /> Canone ricalcolato
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_ADVANCES.map(a => (
              <button key={a} onClick={() => setAdvance(a)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer
                  ${advance === a
                    ? "bg-navy border-electric text-white shadow-md shadow-navy/20"
                    : "border-border text-foreground hover:border-electric/50 hover:bg-electric/5"}`}
              >
                {a === 0 ? "€0" : `€${(a / 1000).toFixed(a % 1000 === 0 ? 0 : 1)}k`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Price display ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${rentWithVat}-${duration}-${annualKm}-${advance}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl bg-gradient-to-br from-navy to-[hsl(220,100%,12%)] overflow-hidden"
          >
            {rentWithVat ? (
              <div className="p-5">
                {/* Main price */}
                <div className="text-center mb-4">
                  <p className="text-white/40 text-xs mb-1">Canone mensile</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading font-bold text-5xl text-white tracking-tight">
                      €{rentWithVat.toLocaleString("it-IT")}
                    </span>
                    <span className="text-white/40 text-sm">/mese</span>
                  </div>
                  <p className="text-white/30 text-[11px] mt-1">IVA 22% inclusa</p>
                </div>

                {/* P.IVA net saving */}
                {netCostPiva && risparmioMensile && (
                  <div className="bg-electric/10 border border-electric/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-white/50 leading-none mb-0.5">Costo netto stimato P.IVA</p>
                        <p className="text-white font-bold text-lg">€{netCostPiva.toLocaleString("it-IT")}/mese</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-electric/70 leading-none mb-0.5">Risparmio fiscale</p>
                        <p className="text-electric font-bold text-lg">-€{risparmioMensile.toLocaleString("it-IT")}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/25 mt-2">* Stima con IVA 40% + deduzione 80% · aliquota 30%</p>
                  </div>
                )}

                {/* Config summary */}
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

        {/* ── CTA ── */}
        {onRequestQuote ? (
          <Button
            onClick={() => onRequestQuote({
              make: selectedMake, model: selectedModel,
              segment: exactConfig?.segment || segment,
              duration, annualKm, advance, monthlyRent: computedRent,
            })}
            disabled={!rentWithVat}
            className="w-full h-13 bg-electric hover:bg-electric/90 text-white font-bold rounded-xl text-base cursor-pointer disabled:opacity-40 shadow-lg shadow-electric/25 py-3.5 transition-all duration-200"
          >
            Richiedi Offerta Personalizzata
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : vehicleLink ? (
          <Link to={vehicleLink} className="block">
            <Button className="w-full h-13 bg-electric hover:bg-electric/90 text-white font-bold rounded-xl text-base cursor-pointer shadow-lg shadow-electric/25 py-3.5">
              Vedi Dettagli e Prezzi <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Link to="/contact">
            <Button className="w-full h-13 bg-electric hover:bg-electric/90 text-white font-bold rounded-xl text-base cursor-pointer shadow-lg shadow-electric/25 py-3.5">
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
