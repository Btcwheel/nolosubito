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
  Settings2, Calendar, Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { getVehicleDetailSrcSet, getVehicleCardSrcSet, getOptimizedSrc } from "@/lib/imageUtils";
import { splitVehicleDescription } from "@/lib/vehicleText";
import { formatDisplayedRent, resolvePricingSegment } from "@/lib/vehiclePricing";
import { useCountdown } from "@/hooks/useCountdown";

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

function PromoBadge({ discountPct }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-red-600/40 whitespace-nowrap"
    >
      <Tag className="size-3.5 shrink-0" />
      {discountPct > 0 ? `Offerta -${Math.round(discountPct)}% · Tempo limitato` : "Offerta Speciale · Tempo limitato"}
    </motion.div>
  );
}

function PromoDigit({ value, label }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={padded}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y:  16,  opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="font-bold text-navy-dark tabular-nums leading-none"
          style={{ fontSize: "1.4rem" }}
        >
          {padded}
        </motion.span>
      </AnimatePresence>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">{label}</span>
    </div>
  );
}

function PromoBox({ expiresAt, discountPct, baseRent, segment, vehicleCategory, vehicleSegments, promoServices }) {
  const cd = useCountdown(expiresAt);
  if (!cd || cd.expired) return null;

  const promoRent = baseRent ? Math.round(Number(baseRent) * (1 - Number(discountPct) / 100)) : null;
  const originalDisplay = baseRent
    ? formatDisplayedRent(Number(baseRent), { segment, vehicleCategory, vehicleSegments })
    : null;
  const promoDisplay = promoRent
    ? formatDisplayedRent(promoRent, { segment, vehicleCategory, vehicleSegments })
    : null;

  const urgencyBg =
    cd.days >= 3 ? "from-emerald-50 to-emerald-50/50 border-emerald-200" :
    cd.days >= 1 ? "from-amber-50 to-amber-50/50 border-amber-200"       :
    "from-red-50 to-red-50/50 border-red-200";

  const urgencyText = cd.days >= 3 ? "text-emerald-700" : cd.days >= 1 ? "text-amber-700" : "text-red-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border bg-gradient-to-br ${urgencyBg} p-4 space-y-3`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">🔥</span>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Offerta Speciale</p>
      </div>

      <div className="flex items-center justify-center gap-3 py-2">
        <PromoDigit value={cd.days}    label="giorni"  />
        <span className="text-gray-300 text-xl font-thin mb-3">:</span>
        <PromoDigit value={cd.hours}   label="ore"     />
        <span className="text-gray-300 text-xl font-thin mb-3">:</span>
        <PromoDigit value={cd.minutes} label="minuti"  />
        <span className="text-gray-300 text-xl font-thin mb-3">:</span>
        <PromoDigit value={cd.seconds} label="secondi" />
      </div>

      {promoDisplay && originalDisplay && discountPct > 0 && (
        <div className="text-center space-y-0.5">
          <p className="text-xs text-gray-400 line-through tabular-nums">
            {originalDisplay.toLocaleString("it-IT")}€/mese
          </p>
          <p className={`text-xl font-black tabular-nums ${urgencyText}`}>
            {promoDisplay.toLocaleString("it-IT")}€<span className="text-sm font-semibold">/mese</span>
          </p>
          <p className="text-[10px] text-gray-400">
            Sconto -{Math.round(discountPct)}% · applicato automaticamente
          </p>
        </div>
      )}
      {promoServices && (
        <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1 text-center justify-center">
          🎁 {promoServices}
        </p>
      )}
    </motion.div>
  );
}

export default function VehicleDetail() {
  const { make, model } = useParams();
  const location = useLocation();
  const decodedMake  = decodeURIComponent(make);
  const decodedModel = decodeURIComponent(model);
  const segmentFromState = location.state?.segment;

  const [quoteConfig,    setQuoteConfig]    = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [imgKey,         setImgKey]         = useState(0);
  const [showAllDesc,    setShowAllDesc]    = useState(false);
  const [activeSegment,  setActiveSegment]  = useState(null); // controllato da tab header + QuoteBox

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

  // Inizializza activeSegment una sola volta quando preferredSegment è disponibile
  useEffect(() => {
    if (preferredSegment && !activeSegment) setActiveSegment(preferredSegment);
  }, [preferredSegment]);

  // Segmenti disponibili (P.IVA, Privati e/o ReUse) per mostrare i tab
  const availableSegments = useMemo(() => {
    const segs = vehicle?.segments || [];
    return ["P.IVA", "Privati", "ReUse"].filter(s => segs.includes(s));
  }, [vehicle]);

  const currentSegment = activeSegment || preferredSegment;

  const bestOffer = useMemo(() => {
    if (!vehicle) return null;
    const filtered = currentSegment
      ? configs.filter(c => c.segment === currentSegment && c.is_active !== false)
      : configs.filter(c => c.is_active !== false);
    // Preferisci il canone vetrina, fallback al minimo
    const featured = filtered.find(c => c.is_featured);
    const minPrice = filtered.length ? Math.min(...filtered.map(c => Number(c.monthly_rent))) : null;
    return { ...vehicle, monthly_rent: featured ? Number(featured.monthly_rent) : minPrice };
  }, [vehicle, configs, currentSegment]);

  const similarVehicles = useMemo(() => {
    if (!bestOffer) return [];
    return allVehicles
      .filter(v => !(v.make === decodedMake && v.model === decodedModel))
      .filter(v => v.category === bestOffer.category || v.make === decodedMake)
      .slice(0, 3);
  }, [allVehicles, decodedMake, decodedModel, bestOffer]);

  useEffect(() => {
    if (isLoading || bestOffer) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [isLoading, bestOffer]);

  // OG meta tags dinamici per social sharing
  useEffect(() => {
    if (!bestOffer) return;

    const title = `${decodedMake} ${decodedModel}${bestOffer.version ? ` ${bestOffer.version}` : ''} | Noleggio Lungo Termine`;
    const description = bestOffer.category
      ? `Noleggio a lungo termine ${decodedMake} ${decodedModel} · ${bestOffer.category} · ${bestOffer.fuel_type || ''}`
      : `Scopri l'offerta di noleggio per ${decodedMake} ${decodedModel}`;
    const image = bestOffer.vehicle_image || "https://nolosubito.it/og-image.png";
    const url = `https://nolosubito.it/vehicle/${encodeURIComponent(decodedMake)}/${encodeURIComponent(decodedModel)}`;

    const setMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const setTitle = (content) => {
      document.title = content;
      let meta = document.querySelector('meta[property="og:title"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setTitle(title);
    setMeta('og:description', description);
    setMeta('og:image', image);
    setMeta('og:url', url);
    setMeta('og:type', 'article');

    // Twitter Card
    let twCard = document.querySelector('meta[name="twitter:card"]');
    if (!twCard) {
      twCard = document.createElement('meta');
      twCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twCard);
    }
    twCard.setAttribute('content', 'summary_large_image');

    return () => {
      // Pulizia: rimuovi meta tag aggiunti dinamicamente
      document.querySelectorAll('meta[property="og:description"], meta[property="og:image"], meta[property="og:url"], meta[property="og:type"], meta[name="twitter:card"]').forEach(m => m.remove());
    };
  }, [bestOffer, decodedMake, decodedModel]);

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
        segment: currentSegment,
        vehicleCategory: bestOffer.category,
        vehicleSegments: bestOffer.segments || [],
      })
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <div className="bg-surface min-h-screen">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative bg-white overflow-hidden" style={{ borderBottom: "1px solid #f0f0f0" }}>
          {/* Sottile accent bar in cima */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #71BAED 40%, #2D2E82 70%, transparent)" }} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-7 tracking-wide">
              <Link to="/" className="hover:text-navy transition-colors duration-200">Nolosubito</Link>
              <ChevronRight className="size-3 opacity-40" />
              <Link to="/offers" className="hover:text-navy transition-colors duration-200">Offerte Noleggio</Link>
              <ChevronRight className="size-3 opacity-40" />
              <span className="text-gray-500">{decodedMake} {decodedModel}</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

                {/* ── Left: brand / model / specs ── */}
                <div className="space-y-4">
                  {/* Marca */}
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: "#71BAED" }}
                  >
                    {decodedMake}
                  </p>

                  {/* Modello + versione */}
                  <div>
                    <h1
                      className="font-heading font-bold leading-none tracking-tight"
                      style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#2D2E82" }}
                    >
                      {decodedModel}
                    </h1>
                    {bestOffer.version && (
                      <p className="mt-2 text-sm font-medium text-gray-400 tracking-wide">
                        {bestOffer.version}
                      </p>
                    )}
                  </div>

                  {/* Spec pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      bestOffer.category,
                      bestOffer.fuel_type ? FUEL_IT[bestOffer.fuel_type] || bestOffer.fuel_type : null,
                      bestOffer.power_hp ? `${bestOffer.power_hp} CV` : null,
                      bestOffer.transmission,
                      bestOffer.year,
                    ].filter(Boolean).map((spec, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase"
                        style={{ color: "#2D2E82" }}
                      >
                        {i > 0 && <span className="size-1 rounded-full bg-gray-300 mx-0.5" />}
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Right: prezzo + toggle segmento ── */}
                <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">

                  {/* Toggle P.IVA / Privati / ReUse */}
                  {availableSegments.length > 1 && (
                    <div
                      className="flex items-center p-1 rounded-xl gap-1"
                      style={{ backgroundColor: "#f4f4f6" }}
                    >
                      {availableSegments.map(seg => (
                        <button type="button"
                          key={seg}
                         
                          onClick={() => setActiveSegment(seg)}
                          className="relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                          style={currentSegment === seg
                            ? { backgroundColor: "#2D2E82", color: "#fff", boxShadow: "0 2px 8px rgba(45,46,130,0.25)" }
                            : { color: "#888", backgroundColor: "transparent" }
                          }
                        >
                          {seg === "P.IVA" ? "Azienda / P.IVA" : seg === "ReUse" ? "Re-Use Cert." : "Privati"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Prezzo */}
                  {displayPrice && (
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-0.5">
                        Noleggio a lungo termine · da
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-heading font-bold tracking-tight leading-none"
                          style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#2D2E82" }}
                        >
                          €{displayPrice.toLocaleString("it-IT")}
                        </span>
                        <span className="text-sm font-medium text-gray-400">/mese</span>
                      </div>
                      {currentSegment === "P.IVA" && (
                        <p className="text-[10px] text-gray-400 mt-0.5">+ IVA 22%</p>
                      )}
                      {(currentSegment === "Privati" || currentSegment === "ReUse") && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{currentSegment === "ReUse" ? "+ IVA 22%" : "IVA inclusa"}</p>
                      )}
                    </div>
                  )}
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
                      <Zap className="size-3" /> 0 CO₂
                    </Badge>
                  )}
                  {isHybrid && (
                    <Badge className="bg-fuel-hybrid/80 text-white border-0 backdrop-blur-sm text-xs flex items-center gap-1">
                      <Leaf className="size-3" /> Ibrido
                    </Badge>
                  )}
                </div>

                {/* Ribbon promo diagonale */}
                {bestOffer.promo_expires_at && new Date(bestOffer.promo_expires_at) > new Date() && (
                  <PromoBadge discountPct={bestOffer.promo_discount_pct} />
                )}

                {/* Gallery nav arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button type="button"
                      onClick={() => handleThumb((currentIndex - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button type="button"
                      onClick={() => handleThumb((currentIndex + 1) % galleryImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {galleryImages.map((img, i) => (
                  <button type="button"
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
                      <div className="size-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#e8e9f8]">
                        {React.createElement(icon, { className: "size-4 text-navy" })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-[#55545e] uppercase tracking-wide leading-none mb-1">{label}</p>
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
                      <CheckCircle2 className="size-4 text-electric shrink-0" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Pack Servizi Optional */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-6 rounded-lg bg-navy/10 flex items-center justify-center">
                      <TrendingDown className="size-3.5 text-navy" />
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
                        <Icon className="size-4 text-navy" />
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
                    <button type="button"
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
                        <CheckCircle2 className="size-4 text-electric shrink-0" />
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
              className="lg:sticky lg:top-24 self-start space-y-4"
            >
              {bestOffer.promo_expires_at && new Date(bestOffer.promo_expires_at) > new Date() && (
                <PromoBox
                  expiresAt={bestOffer.promo_expires_at}
                  discountPct={bestOffer.promo_discount_pct}
                  baseRent={bestOffer.monthly_rent}
                  segment={currentSegment}
                  vehicleCategory={bestOffer.category}
                  vehicleSegments={bestOffer.segments || []}
                  promoServices={bestOffer.promo_services}
                />
              )}
              <QuoteBox
                fixedMake={decodedMake}
                fixedModel={decodedModel}
                segment={currentSegment}
                onSegmentChange={setActiveSegment}
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
                <ArrowDown className="size-4 text-electric" />
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
