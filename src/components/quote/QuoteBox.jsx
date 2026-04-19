import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calculator, Info, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ALL_DURATIONS = [24, 36, 48, 60];
const ALL_KM = [10000, 15000, 20000, 25000, 30000, 40000];
const ALL_ADVANCES = [0, 1500, 3000, 5000, 7500, 10000];

export default function QuoteBox({ fixedMake, fixedModel, segment, onRequestQuote }) {
  const [selectedMake, setSelectedMake] = useState(fixedMake || "");
  const [selectedModel, setSelectedModel] = useState(fixedModel || "");
  const [duration, setDuration] = useState(36);
  const [annualKm, setAnnualKm] = useState(15000);
  const [advance, setAdvance] = useState(3000);

  const { data: allOffers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: () => base44.entities.offers.list("-created_date", 500),
  });

  const makes = useMemo(() => [...new Set(allOffers.map(o => o.make))].sort(), [allOffers]);
  const models = useMemo(() => {
    if (!selectedMake) return [];
    return [...new Set(allOffers.filter(o => o.make === selectedMake).map(o => o.model))].sort();
  }, [allOffers, selectedMake]);

  // Offers for this vehicle (filtered by segment if provided)
  const vehicleOffers = useMemo(() => {
    if (!selectedMake || !selectedModel) return [];
    return allOffers.filter(o =>
      o.make === selectedMake &&
      o.model === selectedModel &&
      (segment ? o.segment === segment : true)
    );
  }, [allOffers, selectedMake, selectedModel, segment]);

  // Which durations/km exist in DB for this vehicle
  const availableDurations = useMemo(() => new Set(vehicleOffers.map(o => o.duration_months)), [vehicleOffers]);
  const availableKm = useMemo(() => {
    return new Set(vehicleOffers.filter(o => o.duration_months === duration).map(o => o.annual_km));
  }, [vehicleOffers, duration]);

  // Exact offer match (duration + km)
  const exactOffer = useMemo(() => {
    return vehicleOffers.find(o => o.duration_months === duration && o.annual_km === annualKm) || null;
  }, [vehicleOffers, duration, annualKm]);

  // Computed rent: exact offer price + advance redistribution
  const computedRent = useMemo(() => {
    if (!exactOffer) return null;
    const baseRent = exactOffer.monthly_rent;
    const baseAdvance = exactOffer.advance_payment ?? 0;
    const advanceDiff = advance - baseAdvance;
    // Every €1 of advance difference redistributed over duration months
    const adjustment = advanceDiff / duration;
    return Math.max(Math.round(baseRent - adjustment), 50);
  }, [exactOffer, advance, duration]);

  const rentWithVat = computedRent ? Math.round(computedRent * 1.22) : null;

  // When duration changes, if current km is not available reset to first available
  useEffect(() => {
    if (vehicleOffers.length > 0 && !availableKm.has(annualKm)) {
      const firstAvailableKm = ALL_KM.find(k => availableKm.has(k));
      if (firstAvailableKm) setAnnualKm(firstAvailableKm);
    }
  }, [duration, availableKm]);

  // When make changes, reset model
  const handleMakeChange = (make) => {
    setSelectedMake(make);
    if (!fixedModel) setSelectedModel("");
  };

  // When model changes, auto-select first available duration/km
  useEffect(() => {
    if (vehicleOffers.length > 0) {
      const durations = [...new Set(vehicleOffers.map(o => o.duration_months))].sort((a, b) => a - b);
      if (!availableDurations.has(duration)) {
        setDuration(durations[0]);
      }
    }
  }, [vehicleOffers]);

  useEffect(() => {
    if (fixedMake) setSelectedMake(fixedMake);
    if (fixedModel) setSelectedModel(fixedModel);
  }, [fixedMake, fixedModel]);

  const vehicleLink = selectedMake && selectedModel
    ? `/vehicle/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}`
    : null;

  const isFixed = !!fixedMake;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="bg-navy p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <Calculator className="w-5 h-5 text-electric" />
          <h3 className="font-heading font-bold text-white text-lg">Configura il Canone</h3>
        </div>
        <p className="text-white/50 text-sm">
          {isFixed
            ? `${selectedMake} ${selectedModel} — seleziona la tua combinazione`
            : "Scegli veicolo e configurazione"}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-6">

        {/* Make & Model — only when not fixed */}
        {!fixedMake && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marca</label>
              <select
                value={selectedMake}
                onChange={(e) => handleMakeChange(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Seleziona marca</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Modello</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
              >
                <option value="">Seleziona modello</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Duration selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-3 block">Durata contratto</label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_DURATIONS.map(d => {
              const available = vehicleOffers.length === 0 || availableDurations.has(d);
              const selected = duration === d;
              return (
                <button
                  key={d}
                  onClick={() => available && setDuration(d)}
                  disabled={!available}
                  className={`relative py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer
                    ${selected
                      ? "bg-navy border-navy text-white shadow-sm"
                      : available
                        ? "border-border text-foreground hover:border-electric hover:text-electric"
                        : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                    }`}
                >
                  {d}m
                  {selected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-electric rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* KM selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-3 block">KM annui</label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_KM.map(k => {
              const available = vehicleOffers.length === 0 || availableKm.has(k);
              const selected = annualKm === k;
              return (
                <button
                  key={k}
                  onClick={() => available && setAnnualKm(k)}
                  disabled={!available}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer
                    ${selected
                      ? "bg-navy border-navy text-white shadow-sm"
                      : available
                        ? "border-border text-foreground hover:border-electric hover:text-electric"
                        : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                    }`}
                >
                  {k / 1000}k km
                </button>
              );
            })}
          </div>
        </div>

        {/* Advance selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-muted-foreground">Anticipo</label>
            {exactOffer && advance !== (exactOffer.advance_payment ?? 0) && (
              <span className="text-[10px] text-electric/70 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Calcolato sul canone
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_ADVANCES.map(a => {
              const selected = advance === a;
              return (
                <button
                  key={a}
                  onClick={() => setAdvance(a)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer
                    ${selected
                      ? "bg-navy border-navy text-white shadow-sm"
                      : "border-border text-foreground hover:border-electric hover:text-electric"
                    }`}
                >
                  {a === 0 ? "€0" : `€${(a / 1000).toFixed(a % 1000 === 0 ? 0 : 1)}k`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${rentWithVat}-${duration}-${annualKm}-${advance}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-5 text-center"
          >
            {rentWithVat ? (
              <>
                <p className="text-white/50 text-xs mb-1">Canone mensile</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-heading font-bold text-4xl text-white">
                    € {rentWithVat.toLocaleString('it-IT')}
                  </span>
                  <span className="text-white/50 text-sm">/mese</span>
                </div>
                <p className="text-white/40 text-[11px] mt-1.5">IVA 22% inclusa</p>
                <p className="text-white/30 text-[11px] mt-1">
                  {duration}m · {annualKm.toLocaleString('it-IT')} km/anno · anticipo €{advance.toLocaleString('it-IT')}
                </p>
                {exactOffer && advance === (exactOffer.advance_payment ?? 0) && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-[10px] font-medium">Offerta confermata in listino</span>
                  </div>
                )}
              </>
            ) : (
              <div>
                {!selectedMake || !selectedModel ? (
                  <p className="text-white/60 text-sm">Seleziona marca e modello</p>
                ) : vehicleOffers.length === 0 ? (
                  <p className="text-white/60 text-sm">Nessuna offerta disponibile</p>
                ) : (
                  <p className="text-white/60 text-sm">
                    Seleziona una combinazione disponibile
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        {onRequestQuote ? (
          <Button
            onClick={() => onRequestQuote({
              make: selectedMake,
              model: selectedModel,
              segment: exactOffer?.segment || segment,
              duration,
              annualKm,
              advance,
              monthlyRent: computedRent,
            })}
            disabled={!rentWithVat}
            className="w-full h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl text-base cursor-pointer disabled:opacity-50"
          >
            Richiedi Offerta Personalizzata
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : vehicleLink ? (
          <Link to={vehicleLink} className="block">
            <Button className="w-full h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl text-base cursor-pointer">
              Vedi Dettagli Veicolo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Link to="/contact">
            <Button className="w-full h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl text-base cursor-pointer">
              Richiedi Offerta Personalizzata
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}