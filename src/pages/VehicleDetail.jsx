import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import QuoteBox from "../components/quote/QuoteBox";
import LeadForm from "../components/lead/LeadForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, Fuel, Gauge, Zap, Leaf, ShieldCheck,
  Wrench, FileText, Lock, TrendingDown, CheckCircle2, ArrowDown
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicleImage } from "@/lib/vehicleFallbacks";

const FUEL_PILL = {
  Electric: "bg-fuel-ev/20 text-fuel-ev border-fuel-ev/30",
  Hybrid:   "bg-fuel-hybrid/20 text-fuel-hybrid border-fuel-hybrid/30",
  Diesel:   "bg-fuel-diesel/15 text-fuel-diesel border-fuel-diesel/25",
  Petrol:   "bg-fuel-petrol/20 text-fuel-petrol border-fuel-petrol/30",
};

export default function VehicleDetail() {
  const { make, model } = useParams();
  const location = useLocation();
  const decodedMake  = decodeURIComponent(make);
  const decodedModel = decodeURIComponent(model);
  const segmentFromState = location.state?.segment;

  const [quoteConfig, setQuoteConfig] = useState(null);
  const [showForm, setShowForm]       = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [make, model]);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["offer", decodedMake, decodedModel],
    queryFn:  () => offersService.getByMakeModel(decodedMake, decodedModel),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["offer-configs", decodedMake, decodedModel],
    queryFn:  () => offersService.getConfigs(decodedMake, decodedModel),
    enabled:  !!vehicle,
  });

  const bestOffer = useMemo(() => {
    if (!vehicle) return null;
    const filtered = segmentFromState
      ? configs.filter(c => c.segment === segmentFromState)
      : configs;
    const minPrice = filtered.length ? Math.min(...filtered.map(c => Number(c.monthly_rent))) : null;
    return { ...vehicle, monthly_rent: minPrice };
  }, [vehicle, configs, segmentFromState]);

  const vehicleOffers = configs;

  const handleRequestQuote = (config) => {
    setQuoteConfig(config);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="bg-navy pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Skeleton className="h-6 w-36 bg-white/10 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[4/3] rounded-2xl bg-white/10" />
            <Skeleton className="h-[500px] rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!bestOffer) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white text-xl font-heading font-bold mb-2">Veicolo non trovato</p>
          <p className="text-white/50 text-sm mb-6">Il veicolo richiesto non è disponibile.</p>
          <Link to="/offers">
            <Button className="bg-electric hover:bg-electric/90 text-white">← Torna alle Offerte</Button>
          </Link>
        </div>
      </div>
    );
  }

  const FuelIcon   = bestOffer.fuel_type === "Electric" ? Zap : Fuel;
  const fuelPill   = FUEL_PILL[bestOffer.fuel_type] ?? "bg-muted/20 text-white/60 border-white/20";
  const imgSrc     = bestOffer.vehicle_image || getVehicleImage(bestOffer);
  const isElectric = bestOffer.fuel_type === "Electric";
  const isHybrid   = bestOffer.fuel_type === "Hybrid";

  // schema.org
  const schemaData = {
    "@context": "https://schema.org", "@type": "Car",
    "name": `${decodedMake} ${decodedModel}`,
    "brand": { "@type": "Brand", "name": decodedMake },
    "model": decodedModel,
    "fuelType": bestOffer.fuel_type || "Unknown",
    "vehicleTransmission": bestOffer.transmission || "Unknown",
    "offers": vehicleOffers.map(o => ({
      "@type": "Offer", "priceCurrency": "EUR", "price": o.monthly_rent,
      "description": `${o.duration_months} mesi, ${o.annual_km?.toLocaleString()} km/anno`,
      "eligibleDuration": { "@type": "QuantitativeValue", "value": o.duration_months, "unitCode": "MON" },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <div className="bg-navy min-h-screen">

        {/* ── Hero image — full bleed ── */}
        <div className="relative w-full h-[55vw] max-h-[520px] min-h-[280px] overflow-hidden">
          <img
            src={imgSrc}
            alt={`${decodedMake} ${decodedModel}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = getVehicleImage({ make: decodedMake }); }}
          />
          {/* Multi-layer gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-navy/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 via-transparent to-transparent" />

          {/* Back button */}
          <div className="absolute top-0 left-0 right-0 pt-24 sm:pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Link
              to="/offers"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Tutte le Offerte
            </Link>
          </div>

          {/* Title over image */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-navy/70 text-white border-white/20 backdrop-blur-sm text-xs">
                  {bestOffer.category}
                </Badge>
                {isElectric && (
                  <Badge className="bg-fuel-ev/80 text-white border-0 text-xs backdrop-blur-sm flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 0 emissioni
                  </Badge>
                )}
                {isHybrid && (
                  <Badge className="bg-fuel-hybrid/80 text-white border-0 text-xs backdrop-blur-sm flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Ibrido Plug-in
                  </Badge>
                )}
              </div>
              <p className="text-electric text-xs font-bold uppercase tracking-widest mb-1">{decodedMake}</p>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white leading-tight">
                {decodedModel}
              </h1>
              {bestOffer.monthly_rent && (
                <p className="text-white/50 text-sm mt-2">
                  Da <span className="text-white font-semibold text-lg">€{Math.round(bestOffer.monthly_rent).toLocaleString("it-IT")}</span>/mese + IVA
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* ── Left panel ── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-8"
            >
              {/* Spec pills */}
              <div className="flex flex-wrap gap-2">
                {bestOffer.fuel_type && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${fuelPill}`}>
                    <FuelIcon className="w-3.5 h-3.5" /> {bestOffer.fuel_type}
                  </span>
                )}
                {bestOffer.power_hp && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/5 text-white/70 border-white/10">
                    <Gauge className="w-3.5 h-3.5 text-electric" /> {bestOffer.power_hp} CV
                  </span>
                )}
                {bestOffer.transmission && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/5 text-white/70 border-white/10">
                    {bestOffer.transmission}
                  </span>
                )}
                {bestOffer.co2_emissions !== undefined && bestOffer.co2_emissions !== null && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/5 text-white/70 border-white/10">
                    <Leaf className="w-3.5 h-3.5 text-green-400" />
                    {bestOffer.co2_emissions === 0 ? "0 CO₂" : `${bestOffer.co2_emissions} g/km`}
                  </span>
                )}
              </div>

              {/* Description */}
              {bestOffer.description && (
                <p className="text-white/60 text-[15px] leading-relaxed border-l-2 border-electric/40 pl-4">
                  {bestOffer.description}
                </p>
              )}

              {/* Features */}
              {bestOffer.features?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                    Dotazioni principali
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bestOffer.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 text-electric shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Included in rent */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                  Incluso nel canone
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: ShieldCheck, label: "Assicurazione RCA + Kasko" },
                    { icon: Wrench,      label: "Manutenzione ordinaria" },
                    { icon: Zap,         label: "Soccorso stradale H24" },
                    { icon: FileText,    label: "Gestione bollo" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm text-white/60">
                      <div className="w-7 h-7 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-electric" />
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax benefits */}
              <div className="rounded-2xl bg-electric/5 border border-electric/15 p-5">
                <h3 className="text-xs font-bold text-electric/70 uppercase tracking-widest mb-4">
                  Vantaggi fiscali P.IVA
                </h3>
                <div className="space-y-3">
                  {[
                    { pct: "80%",  label: "Canone deducibile", sub: "Art. 164 TUIR — uso promiscuo" },
                    { pct: "40%",  label: "IVA detraibile",    sub: "100% per uso esclusivo aziendale" },
                    { pct: "100%", label: "Agenti di commercio", sub: "Deduzione e IVA integrali" },
                  ].map(({ pct, label, sub }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="font-heading font-bold text-lg text-electric w-14 shrink-0">{pct}</span>
                      <div>
                        <p className="text-sm font-semibold text-white/80 leading-none">{label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Right panel — QuoteBox ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:sticky lg:top-28 self-start"
            >
              <QuoteBox
                fixedMake={decodedMake}
                fixedModel={decodedModel}
                onRequestQuote={handleRequestQuote}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Lead Form ── */}
      {showForm && (
        <div id="lead-form" className="bg-background py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowDown className="w-4 h-4 text-electric" />
                <p className="text-xs font-bold text-electric uppercase tracking-widest">Passo finale</p>
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-1">
                Richiedi il tuo preventivo
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {decodedMake} {decodedModel} · Risposta entro 24 ore · Nessun impegno
              </p>
              <LeadForm prefilledConfig={quoteConfig} />
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}
