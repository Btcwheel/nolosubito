import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import QuoteBox from "../components/quote/QuoteBox";
import LeadForm from "../components/lead/LeadForm";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Fuel, Gauge, Zap, Leaf, ShieldCheck,
  Wrench, FileText, Lock, TrendingDown, CheckCircle2, ArrowDown, Car,
  Settings2, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { getVehicleDetailSrcSet, getVehicleCardSrcSet, getOptimizedSrc } from "@/lib/imageUtils";
import { splitVehicleDescription } from "@/lib/vehicleText";
import { formatDisplayedRent, resolvePricingSegment } from "@/lib/vehiclePricing";

const MOCK_GALLERY_EXTRAS = [
  { src: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200&q=85", label: "3/4 anteriore" },
  { src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85", label: "Laterale" },
  { src: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=85", label: "Interni" },
];

const FUEL_IT = {
  Electric: "Elettrica",
  Hybrid:   "Ibrido",
  Diesel:   "Diesel",
  Petrol:   "Benzina",
};

const INCLUDED = [
  { icon: ShieldCheck, label: "Assicurazione RCA + Kasko" },
  { icon: Wrench,      label: "Manutenzione ordinaria e straordinaria" },
  { icon: Zap,         label: "Soccorso stradale H24" },
  { icon: FileText,    label: "Gestione bollo e tasse" },
  { icon: Lock,        label: "Furto e Incendio" },
];

export default function VehicleDetail() {
  const { make, model } = useParams();
  const location = useLocation();
  const decodedMake  = decodeURIComponent(make);
  const decodedModel = decodeURIComponent(model);
  const segmentFromState = location.state?.segment;

  const [quoteConfig,   setQuoteConfig]   = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [imgKey,        setImgKey]        = useState(0);
  const [showAllDesc,   setShowAllDesc]   = useState(false);

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

  const { data: allVehicles = [] } = useQuery({
    queryKey: ["offers-home-catalog"],
    queryFn:  () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const preferredSegment = useMemo(() => {
    if (!vehicle) return segmentFromState || null;
    return resolvePricingSegment({
      segment: segmentFromState || null,
      vehicleCategory: vehicle.category,
      vehicleSegments: vehicle.segments || [],
    });
  }, [vehicle, segmentFromState]);

  const bestOffer = useMemo(() => {
    if (!vehicle) return null;
    const filtered = preferredSegment
      ? configs.filter(c => c.segment === preferredSegment)
      : configs;
    const minPrice = filtered.length ? Math.min(...filtered.map(c => Number(c.monthly_rent))) : null;
    return { ...vehicle, monthly_rent: minPrice };
  }, [vehicle, configs, preferredSegment]);

  const similarVehicles = useMemo(() => {
    if (!bestOffer) return [];
    return allVehicles
      .filter(v => !(v.make === decodedMake && v.model === decodedModel))
      .filter(v => v.category === bestOffer.category || v.make === decodedMake)
      .slice(0, 3);
  }, [allVehicles, decodedMake, decodedModel, bestOffer]);

  const handleRequestQuote = (config) => {
    setQuoteConfig({ ...config, version: bestOffer.version || "", fuelType: bestOffer.fuel_type || "" });
    setShowForm(true);
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
      });
    }, 100);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="bg-background pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 mt-8">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="h-[480px] rounded-2xl" />
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
            <Button className="bg-electric hover:bg-electric/90 text-white">← Torna alle Offerte</Button>
          </Link>
        </div>
      </div>
    );
  }

  const imgSrc       = bestOffer.vehicle_image || getVehicleImage(bestOffer);
  const imgPos       = getVehicleImagePosition(bestOffer);
  const isElectric   = bestOffer.fuel_type === "Electric";
  const isHybrid     = bestOffer.fuel_type === "Hybrid";
  const descParagraphs = splitVehicleDescription(bestOffer.description);

  const galleryImages = [
    { src: imgSrc, label: "Esterno" },
    ...(bestOffer.gallery_images?.map((s, i) => ({ src: s, label: `Foto ${i + 2}` })) ?? MOCK_GALLERY_EXTRAS),
  ];

  const handleThumb = (i) => {
    setCurrentIndex(i);
    setImgKey(k => k + 1);
  };

  const schemaData = {
    "@context": "https://schema.org", "@type": "Car",
    "name": `${decodedMake} ${decodedModel}`,
    "brand": { "@type": "Brand", "name": decodedMake },
    "model": decodedModel,
    "fuelType": bestOffer.fuel_type || "Unknown",
    "vehicleTransmission": bestOffer.transmission || "Unknown",
    "offers": configs.map(o => ({
      "@type": "Offer", "priceCurrency": "EUR", "price": o.monthly_rent,
      "description": `${o.duration_months} mesi, ${o.annual_km?.toLocaleString()} km/anno`,
    })),
  };

  const displayPrice = bestOffer.monthly_rent
    ? formatDisplayedRent(bestOffer.monthly_rent, {
        segment: preferredSegment,
        vehicleCategory: bestOffer.category,
        vehicleSegments: bestOffer.segments || [],
      })
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <div className="bg-surface min-h-screen">

        {/* ── Header: breadcrumb + title ─────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
              <Link to="/" className="hover:text-navy transition-colors">Nolosubito</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/offers" className="hover:text-navy transition-colors">Offerte Noleggio</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">{decodedMake} {decodedModel}</span>
            </nav>

            {/* Title row */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-electric uppercase tracking-widest mb-1">{decodedMake}</p>
                  <h1 className="font-heading font-bold text-3xl sm:text-4xl text-navy leading-tight">
                    {decodedModel}
                    {bestOffer.version && (
                      <span className="block text-lg font-medium text-gray-400 mt-1">{bestOffer.version}</span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Noleggio a Lungo Termine
                    {displayPrice && (
                      <span className="ml-2 font-extrabold text-navy text-base">
                        · da €{displayPrice.toLocaleString("it-IT")}/mese
                      </span>
                    )}
                  </p>

                  {/* Quick-info pills */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {bestOffer.category && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spec text-navy text-xs font-semibold">
                        {bestOffer.category}
                      </span>
                    )}
                    {bestOffer.fuel_type && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spec text-navy text-xs font-semibold">
                        <Fuel className="w-3.5 h-3.5 opacity-70" />
                        {FUEL_IT[bestOffer.fuel_type] || bestOffer.fuel_type}
                      </span>
                    )}
                    {bestOffer.power_hp && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spec text-navy text-xs font-semibold">
                        <Gauge className="w-3.5 h-3.5 opacity-70" />
                        {bestOffer.power_hp} CV
                      </span>
                    )}
                    {bestOffer.transmission && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spec text-navy text-xs font-semibold">
                        {bestOffer.transmission}
                      </span>
                    )}
                    {bestOffer.year && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spec text-navy text-xs font-semibold">
                        {bestOffer.year}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Main grid ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

            {/* ── Left column ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-100 border border-gray-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imgKey}
                    src={getOptimizedSrc(galleryImages[currentIndex].src, 1200)}
                    srcSet={getVehicleDetailSrcSet(galleryImages[currentIndex].src)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 60vw, 800px"
                    alt={`${decodedMake} ${decodedModel}`}
                    className="w-full aspect-[16/9] object-cover"
                    style={{ objectPosition: imgPos }}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => { e.target.src = getVehicleImage({ make: decodedMake }); }}
                  />
                </AnimatePresence>

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-navy/80 text-white border-0 backdrop-blur-sm text-xs">
                    {bestOffer.category}
                  </Badge>
                  {isElectric && (
                    <Badge className="bg-fuel-ev/80 text-white border-0 backdrop-blur-sm text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3" /> 0 CO₂
                    </Badge>
                  )}
                  {isHybrid && (
                    <Badge className="bg-fuel-hybrid/80 text-white border-0 backdrop-blur-sm text-xs flex items-center gap-1">
                      <Leaf className="w-3 h-3" /> Ibrido
                    </Badge>
                  )}
                </div>

                {/* Gallery nav arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => handleThumb((currentIndex - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleThumb((currentIndex + 1) % galleryImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => handleThumb(i)}
                    className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 w-[88px] h-[58px] sm:w-[110px] sm:h-[72px] ${
                      i === currentIndex
                        ? "ring-2 ring-electric ring-offset-2 ring-offset-surface"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img
                      src={getOptimizedSrc(img.src, 200)}
                      srcSet={getVehicleCardSrcSet(img.src)}
                      sizes="110px"
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Specifiche tecniche */}
              <div className="bg-white rounded-2xl border border-frame shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] overflow-hidden">
                <div className="px-5 py-4 border-b border-frame">
                  <h3 className="text-xs font-bold text-electric uppercase tracking-widest">Specifiche Tecniche</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {[
                    { icon: isElectric ? Zap : isHybrid ? Leaf : Fuel, label: "Alimentazione", value: FUEL_IT[bestOffer.fuel_type] || bestOffer.fuel_type },
                    { icon: Gauge,    label: "Potenza",    value: bestOffer.power_hp ? `${bestOffer.power_hp} CV` : null },
                    { icon: Settings2, label: "Cambio",   value: bestOffer.transmission },
                    { icon: Leaf,     label: "CO₂",        value: bestOffer.co2_emissions != null ? (bestOffer.co2_emissions === 0 ? "0 g/km" : `${bestOffer.co2_emissions} g/km`) : null },
                    { icon: Car,      label: "Categoria",  value: bestOffer.category },
                    { icon: Calendar, label: "Anno",       value: bestOffer.year ? String(bestOffer.year) : null },
                  ].filter(s => s.value).map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 bg-spec rounded-xl p-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#e8e9f8]">
                        {React.createElement(icon, { className: "w-4 h-4 text-navy" })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-[#777682] uppercase tracking-wide leading-none mb-1">{label}</p>
                        <p className="text-sm font-bold text-navy-dark leading-snug truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servizi inclusi */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">I Servizi Inclusi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INCLUDED.map(({ label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-electric shrink-0" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Pack Servizi Optional */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-navy/10 flex items-center justify-center">
                      <TrendingDown className="w-3.5 h-3.5 text-navy" />
                    </div>
                    <p className="text-xs font-bold text-navy uppercase tracking-wider">Pack Servizi Optional</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: ShieldCheck, label: "Infortunio Conducente" },
                      { icon: Zap,         label: "Vettura Sostitutiva" },
                      { icon: Wrench,      label: "Servizio Pneumatici" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 text-center bg-navy/5 border border-navy/10 rounded-xl py-3 px-2">
                        <Icon className="w-4 h-4 text-navy" />
                        <span className="text-[11px] font-semibold text-navy leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">* Disponibili come aggiunta al pacchetto base su richiesta</p>
                </div>
              </div>

              {/* Description */}
              {descParagraphs.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Descrizione</h3>
                  <div className="space-y-3">
                    {(showAllDesc ? descParagraphs : descParagraphs.slice(0, 2)).map((p, i) => (
                      <p key={i} className="text-sm text-gray-600 leading-relaxed">{p}</p>
                    ))}
                  </div>
                  {descParagraphs.length > 2 && (
                    <button
                      onClick={() => setShowAllDesc(v => !v)}
                      className="mt-3 text-xs font-semibold text-electric hover:text-electric/80 cursor-pointer transition-colors"
                    >
                      {showAllDesc ? "Mostra meno" : "Mostra tutti i dettagli ↓"}
                    </button>
                  )}
                </div>
              )}

              {/* Features */}
              {bestOffer.features?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dotazioni principali</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bestOffer.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-electric shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Right column — QuoteBox ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:sticky lg:top-24 self-start"
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

        {/* ── Similar vehicles ──────────────────────────────────── */}
        {similarVehicles.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="border-t border-gray-200 pt-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-bold text-electric uppercase tracking-widest mb-1">Veicoli Selezionati</p>
                  <h2 className="font-heading font-bold text-2xl text-navy">Potrebbero interessarti</h2>
                </div>
                <Link
                  to="/offers"
                  className="text-sm font-semibold text-electric hover:text-electric/80 transition-colors hidden sm:block"
                >
                  Vedi tutti →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {similarVehicles.map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} segment={preferredSegment} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Lead Form ── */}
      {showForm && (
        <div id="lead-form" className="bg-white py-16 border-t border-gray-100">
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
