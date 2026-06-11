import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Settings2, Fuel, Zap, Gauge, Leaf, Flame, RefreshCw, Truck, Tag, Calendar, Route,
} from "lucide-react";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { getVehicleCardSrcSet, getOptimizedSrc } from "@/lib/imageUtils";
import { formatDisplayedRent, formatAdvanceAmount, isVatIncludedForDisplay, resolvePricingSegment } from "@/lib/vehiclePricing";
import { useCountdown } from "@/hooks/useCountdown";

const FUEL_IT = {
  Electric: "Elettrica",
  Hybrid:   "Ibrido",
  Diesel:   "Diesel",
  Petrol:   "Benzina",
};

const TRANSMISSION_IT = {
  Automatic: "Automatico",
  Manual: "Manuale",
};

const SEGMENT_LABEL = {
  "P.IVA":    "BUSINESS EXCLUSIVE",
  "Privati":  "PRIVATI NLT",
  "Moto":     "MOTO NLT",
  "Veicoli Commerciali": "VEICOLI COMMERCIALI",
};

function SpecBox({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-spec rounded-[8px] p-2 min-h-[56px]">
      <Icon className="size-4 text-navy/60" />
      <span className="text-[10px] font-bold text-[#464651] leading-none text-center">{label}</span>
    </div>
  );
}

function BrandLogo({ make }) {
  const [failed, setFailed] = React.useState(false);
  if (!make || failed) return null;
  const logoName = make.trim().toLowerCase().replace(/\s+/g, '-');
  return (
    <img
      src={`/brands/${logoName}.svg`}
      alt={make}
      className="size-8 object-contain opacity-80"
      onError={() => setFailed(true)}
    />
  );
}

function PromoCountdownBadge({ expiresAt, discountPct, compact = false }) {
  const cd = useCountdown(expiresAt);
  if (!cd || cd.expired) return null;
  const label = cd.days > 0 ? `${cd.days}g ${cd.hours}h` : `${cd.hours}h ${cd.minutes}m`;

  if (compact) {
    return (
      <span className="text-[11px] font-semibold text-red-700 tabular-nums">
        Scade in {label}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-600 text-white rounded-[8px] px-2.5 py-[5px] shadow-lg shadow-red-600/30"
    >
      <Tag className="size-3 shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
        {discountPct > 0 ? `-${Math.round(discountPct)}% · ` : ""}{label}
      </span>
    </motion.div>
  );
}

const VehicleCard = memo(function VehicleCard({ vehicle, index = 0, segment, compact = false }) {
  const imgSrc    = getVehicleImage(vehicle);
  const imgPos    = getVehicleImagePosition(vehicle);
  const effectiveSegment = resolvePricingSegment({
    segment,
    vehicleCategory: vehicle.category,
    vehicleSegments: vehicle.segments || [],
  });
  const isElectric = vehicle.fuel_type === "Electric";
  const isHybrid   = vehicle.fuel_type === "Hybrid";
  const isReUse    = vehicle.segments?.includes("ReUse");

  const displayPrice = vehicle.monthly_rent
    ? formatDisplayedRent(vehicle.monthly_rent, {
        segment: effectiveSegment,
        vehicleCategory: vehicle.category,
        vehicleSegments: vehicle.segments || [],
      })
    : null;

  // Segment label (above title)
  const segmentLabel = segment
    ? (SEGMENT_LABEL[segment] ?? segment.toUpperCase())
    : (vehicle.category?.toUpperCase() ?? "NOLEGGIO NLT");

  // 3 spec boxes
  const FuelIcon = isElectric ? Zap : Fuel;
  const specs = [
    vehicle.transmission && { icon: Settings2, label: (TRANSMISSION_IT[vehicle.transmission] || vehicle.transmission) === "Automatico" ? "Autom." : "Manuale" },
    vehicle.fuel_type    && { icon: FuelIcon,  label: FUEL_IT[vehicle.fuel_type] ?? vehicle.fuel_type },
    vehicle.power_hp
      ? { icon: Gauge, label: `${vehicle.power_hp} CV` }
      : vehicle.category
        ? { icon: Leaf, label: vehicle.category }
        : null,
  ].filter(Boolean).slice(0, 3);

  // Top-right badge
  const badge = (() => {
    if (vehicle.is_ready_delivery) return { icon: Truck,     text: "Pronta Consegna",            color: "text-emerald-700", border: "border-emerald-200" };
    if (vehicle.is_featured)       return { icon: Flame,     text: "Top Seller questa settimana", color: "text-[#ba1a1a]",   border: "border-[rgba(186,26,26,0.2)]" };
    if (isReUse)                   return { icon: RefreshCw, text: "Re-Use certificato",          color: "text-teal-700",    border: "border-teal-200" };
    if (isElectric)                return { icon: Zap,       text: "0 Emissioni CO₂",             color: "text-green-700",   border: "border-green-200" };
    if (isHybrid)                  return { icon: Leaf,      text: "Ibrido plug-in",              color: "text-lime-700",    border: "border-lime-200" };
    return null;
  })();

  const imgH = compact ? "h-[170px]" : "h-[200px]";

  // Promo
  const isInPromo = !!(
    vehicle.promo_expires_at &&
    new Date(vehicle.promo_expires_at) > new Date()
  );
  const discountPct = Number(vehicle.promo_discount_pct);
  const promoRent = isInPromo && vehicle.monthly_rent && discountPct > 0
    ? Math.round(vehicle.monthly_rent * (1 - discountPct / 100))
    : null;
  const promoDisplay = promoRent
    ? formatDisplayedRent(promoRent, {
        segment: effectiveSegment,
        vehicleCategory: vehicle.category,
        vehicleSegments: vehicle.segments || [],
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="h-full"
    >
      <Link
        to={`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`}
        state={{ segment }}
        className="group block h-full"
      >
        <div className={`h-full flex flex-col bg-white border rounded-2xl shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)] ${
          isInPromo ? "border-red-300 ring-1 ring-red-300/50" : "border-frame"
        }`}>

          {/* ── Image ── */}
          <div className={`relative bg-[#f8fafc] overflow-hidden ${imgH}`}>
            <img
              src={getOptimizedSrc(imgSrc, 600)}
              srcSet={getVehicleCardSrcSet(imgSrc)}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              alt={`${vehicle.make} ${vehicle.model}`}
              width="600"
              height="400"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ objectPosition: imgPos }}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0"; }}
            />

            {vehicle.promo_expires_at && new Date(vehicle.promo_expires_at) > new Date() && (
              <PromoCountdownBadge
                expiresAt={vehicle.promo_expires_at}
                discountPct={vehicle.promo_discount_pct}
              />
            )}

            {badge && (
              <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border ${badge.border} rounded-[8px] px-3 py-[5px] max-w-[calc(100%-24px)]`}>
                <badge.icon className={`size-3 shrink-0 ${badge.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${badge.color} truncate`}>
                  {badge.text}
                </span>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className={`flex-1 flex flex-col justify-between p-6 ${isInPromo ? "pb-0" : ""}`}>

            {/* Label + Title + Subtitle */}
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-[5px]">
                <p className="text-[12px] font-bold text-[#55545e] uppercase tracking-[1.2px] leading-none">
                  {segmentLabel}
                </p>
                <BrandLogo make={vehicle.make} />
              </div>
              <h3 className="text-[20px] font-bold text-navy-dark leading-7">
                {vehicle.make} {vehicle.model}
              </h3>
              {(vehicle.version || vehicle.fuel_type) && (
                <p className="text-[15px] text-[#464651] leading-snug mt-0.5">
                  {vehicle.version || [FUEL_IT[vehicle.fuel_type], TRANSMISSION_IT[vehicle.transmission] || vehicle.transmission].filter(Boolean).join(" ")}
                </p>
              )}
            </div>

            {/* Spec boxes */}
            {specs.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {specs.map(({ icon: Icon, label }, i) => (
                  <SpecBox key={i} icon={Icon} label={label} />
                ))}
              </div>
            )}

            {/* Price + CTA */}
            <div className={`flex items-end justify-between gap-3 ${isInPromo ? "mb-4" : ""}`}>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#55545e] leading-none mb-1">Da soli</p>
                <div className="flex items-baseline gap-0.5 flex-wrap">
                  <span className={`font-bold leading-none ${isInPromo && promoDisplay ? "text-[22px] sm:text-[24px] text-[#999] line-through" : "text-[28px] sm:text-[32px] text-navy-dark"}`}>
                    {displayPrice ? `${displayPrice.toLocaleString("it-IT")}€` : "Su richiesta"}
                  </span>
                  {displayPrice && !(isInPromo && promoDisplay) && (
                    <span className="text-[14px] font-medium text-[#464651]">/mese</span>
                  )}
                </div>
                {isInPromo && promoDisplay && (
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[28px] sm:text-[32px] font-bold text-red-600 leading-none">
                      {promoDisplay.toLocaleString("it-IT")}€
                    </span>
                    <span className="text-[14px] font-medium text-red-600">/mese</span>
                  </div>
                )}
                <p className="text-[10px] italic text-[#55545e] mt-1">
                  {isVatIncludedForDisplay({
                    segment: effectiveSegment,
                    vehicleCategory: vehicle.category,
                    vehicleSegments: vehicle.segments || [],
                  }) ? "IVA Inclusa" : "IVA Esclusa"} · Anticipo {formatAdvanceAmount(vehicle.advance_payment ?? 0)}
                </p>
                {(vehicle.duration_months || vehicle.annual_km) && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {vehicle.duration_months && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#55545e] bg-spec rounded-md px-2 py-[3px]">
                        <Calendar className="size-[10px]" />
                        {vehicle.duration_months} mesi
                      </span>
                    )}
                    {vehicle.annual_km && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#55545e] bg-spec rounded-md px-2 py-[3px]">
                        <Route className="size-[10px]" />
                        {(vehicle.annual_km / 1000).toLocaleString("it-IT")}k km/anno
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="size-12 bg-electric rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-electric/85">
                <ArrowRight className="size-4 text-[#0f0f23]" />
              </div>
            </div>

            {/* Strip promo in fondo alla card */}
            {isInPromo && (
              <div className="-mx-6 bg-red-50 border-t border-red-100">
                <div className="flex items-center justify-between gap-2 px-6 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 uppercase tracking-wide">
                    <Tag className="size-3 shrink-0" />
                    {vehicle.promo_discount_pct > 0 ? `-${Math.round(vehicle.promo_discount_pct)}% Offerta` : "Offerta Speciale"}
                  </span>
                  <PromoCountdownBadge
                    expiresAt={vehicle.promo_expires_at}
                    discountPct={vehicle.promo_discount_pct}
                    compact
                  />
                </div>
                {vehicle.promo_services && (
                  <p className="px-6 pb-2.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 border-t border-red-100/60">
                    🎁 {vehicle.promo_services}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default VehicleCard;
