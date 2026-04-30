import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import QuoteBox from "../components/quote/QuoteBox";
import LeadForm from "../components/lead/LeadForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, X, Fuel, Gauge, Zap, Leaf, ShieldCheck,
  Wrench, FileText, Lock, TrendingDown, CheckCircle2, ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { splitVehicleDescription } from "@/lib/vehicleText";

// Mock gallery extras — in produzione sostituire con vehicle.gallery_images[] dal DB
const MOCK_GALLERY_EXTRAS = [
  { src: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200&q=85", label: "3/4 anteriore" },
  { src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85", label: "Laterale" },
  { src: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=85", label: "Interni" },
  { src: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=85", label: "Posteriore" },
];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgKey, setImgKey]             = useState(0);

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
    setQuoteConfig({ ...config, version: bestOffer.version || "", fuelType: bestOffer.fuel_type || "" });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="bg-background pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Skeleton className="h-6 w-36 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!bestOffer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-foreground text-xl font-heading font-bold mb-2">Veicolo non trovato</p>
          <p className="text-muted-foreground text-sm mb-6">Il veicolo richiesto non è disponibile.</p>
          <Link to="/offers">
            <Button className="bg-[#71BAED] hover:bg-[#71BAED]/90 text-white">← Torna alle Offerte</Button>
          </Link>
        </div>
      </div>
    );
  }

  const FuelIcon   = bestOffer.fuel_type === "Electric" ? Zap : Fuel;
  const fuelPill   = FUEL_PILL[bestOffer.fuel_type] ?? "bg-muted/20 text-white/60 border-white/20";
  const imgSrc     = bestOffer.vehicle_image || getVehicleImage(bestOffer);
  const imgPos     = getVehicleImagePosition(bestOffer);

  // Gallery: immagine principale + extra mock (o vehicle.gallery_images[] dal DB)
  const galleryImages = [
    { src: imgSrc, label: "Esterno" },
    ...(bestOffer.gallery_images?.map((s, i) => ({ src: s, label: `Foto ${i + 2}` })) ?? MOCK_GALLERY_EXTRAS),
  ];

  const handleThumb = (i) => {
    setCurrentIndex(i);
    setImgKey(k => k + 1);
    if (i > 0) {
      setTimeout(() => {
        document.getElementById("gallery-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };
  const isElectric = bestOffer.fuel_type === "Electric";
  const isHybrid   = bestOffer.fuel_type === "Hybrid";
  const descriptionParagraphs = splitVehicleDescription(bestOffer.description);

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

      <div className="bg-background min-h-screen">

        {/* ── Hero — sempre la prima foto, full-bleed con sfumatura ── */}
        <div className="relative w-full h-[55vw] max-h-[560px] min-h-[320px] overflow-hidden">
          <img
            src={galleryImages[0].src}
            alt={`${decodedMake} ${decodedModel}`}
            className="w-full h-full object-cover"
            style={{ objectPosition: imgPos }}
            onError={(e) => { e.target.src = getVehicleImage({ make: decodedMake }); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-navy/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/50 via-transparent to-transparent" />

          {/* Back */}
          <div className="absolute top-0 inset-x-0 pt-24 sm:pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Link
              to="/offers"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Tutte le Offerte
            </Link>
          </div>

          {/* Titolo overlaid in basso */}
          <div className="absolute bottom-0 inset-x-0 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge className="bg-navy/60 text-white border-white/20 backdrop-blur-sm text-xs">{bestOffer.category}</Badge>
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
              <p className="text-[#71BAED] text-xs font-bold uppercase tracking-widest mb-1">{decodedMake}</p>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white leading-tight">
                    {decodedModel}
                  </h1>
                  {bestOffer.version && (
                    <p className="text-white/55 text-base font-medium mt-1">{bestOffer.version}</p>
                  )}
                </div>
                {bestOffer.monthly_rent && (
                  <div className="text-right mb-1">
                    <p className="text-white/40 text-xs">a partire da</p>
                    <p className="font-heading font-bold text-2xl text-white leading-tight">
                      €{segmentFromState === "Privati"
                        ? Math.round(bestOffer.monthly_rent * 1.22).toLocaleString("it-IT")
                        : Math.round(bestOffer.monthly_rent).toLocaleString("it-IT")}
                      <span className="text-white/40 text-sm font-normal">
                        /mese {segmentFromState === "Privati" ? "IVA incl." : "+ IVA"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Thumbnail strip + sezione dettaglio ── */}
        <div className="border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleThumb(i)}
                  title={img.label}
                  className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                    w-[88px] h-[56px] sm:w-[108px] sm:h-[68px]
                    ${i === currentIndex && i > 0
                      ? "ring-2 ring-[#71BAED] ring-offset-2 ring-offset-background opacity-100"
                      : i === 0 && currentIndex === 0
                        ? "ring-2 ring-border ring-offset-2 ring-offset-background opacity-100"
                        : "opacity-40 hover:opacity-75"
                    }`}
                >
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 text-[9px] font-semibold text-white/80 text-center py-0.5 bg-black/50 leading-tight">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Sezione dettaglio — appare solo per le foto extra (index > 0) */}
            <AnimatePresence>
              {currentIndex > 0 && (
                <motion.div
                  id="gallery-detail"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.38, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="relative mt-3 rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-black/30">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={imgKey}
                        src={galleryImages[currentIndex].src}
                        alt={`${decodedMake} ${decodedModel} — ${galleryImages[currentIndex].label}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.03 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </AnimatePresence>

                    {/* Label */}
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                      {galleryImages[currentIndex].label}
                    </span>

                    {/* Chiudi */}
                    <button
                      onClick={() => setCurrentIndex(0)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-muted/60 text-foreground/70 border-border">
                    <Gauge className="w-3.5 h-3.5 text-[#71BAED]" /> {bestOffer.power_hp} CV
                  </span>
                )}
                {bestOffer.transmission && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-muted/60 text-foreground/70 border-border">
                    {bestOffer.transmission}
                  </span>
                )}
                {bestOffer.co2_emissions !== undefined && bestOffer.co2_emissions !== null && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-muted/60 text-foreground/70 border-border">
                    <Leaf className="w-3.5 h-3.5 text-green-500" />
                    {bestOffer.co2_emissions === 0 ? "0 CO₂" : `${bestOffer.co2_emissions} g/km`}
                  </span>
                )}
              </div>

              {/* Description */}
              {descriptionParagraphs.length > 0 && (
                <div className="space-y-3 border-l-2 border-[#71BAED]/40 pl-4">
                  {descriptionParagraphs.map((paragraph, i) => (
                    <p key={i} className="text-muted-foreground text-[15px] leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {/* Features */}
              {bestOffer.features?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Dotazioni principali
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bestOffer.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/70">
                        <CheckCircle2 className="w-4 h-4 text-[#71BAED] shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Included in rent */}
              <div className="rounded-2xl bg-muted/30 border border-border p-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  Incluso nel canone
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: ShieldCheck, label: "Assicurazione RCA + Kasko" },
                    { icon: Wrench,      label: "Manutenzione ordinaria" },
                    { icon: Zap,         label: "Soccorso stradale H24" },
                    { icon: FileText,    label: "Gestione bollo" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm text-foreground/70">
                      <div className="w-7 h-7 rounded-lg bg-[#71BAED]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#71BAED]" />
                      </div>
                      {label}
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
                segment={segmentFromState}
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
                <ArrowDown className="w-4 h-4 text-[#71BAED]" />
                <p className="text-xs font-bold text-[#71BAED] uppercase tracking-widest">Passo finale</p>
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
