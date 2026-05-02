import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Settings2, Fuel, Zap, Gauge, Leaf, Flame, RefreshCw, Truck,
} from "lucide-react";
import { getVehicleImage, getVehicleImagePosition } from "@/lib/vehicleFallbacks";
import { getVehicleCardSrcSet, getOptimizedSrc } from "@/lib/imageUtils";

const FUEL_IT = {
  Electric: "Elettrica",
  Hybrid:   "Ibrido",
  Diesel:   "Diesel",
  Petrol:   "Benzina",
};

const SEGMENT_LABEL = {
  "P.IVA":    "BUSINESS EXCLUSIVE",
  "Privati":  "PRIVATI NLT",
  "Moto":     "MOTO NLT",
  "Commerciale": "VEICOLI COMMERCIALI",
};

function SpecBox({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-spec rounded-[8px] p-2 min-h-[56px]">
      <Icon className="w-4 h-4 text-navy/60" />
      <span className="text-[10px] font-bold text-[#464651] leading-none text-center">{label}</span>
    </div>
  );
}

export default function VehicleCard({ vehicle, index = 0, segment, compact = false }) {
  const imgSrc    = getVehicleImage(vehicle);
  const imgPos    = getVehicleImagePosition(vehicle);
  const isPrivate = segment === "Privati";
  const isElectric = vehicle.fuel_type === "Electric";
  const isHybrid   = vehicle.fuel_type === "Hybrid";
  const isReUse    = vehicle.segments?.includes("ReUse");

  const displayPrice = vehicle.monthly_rent
    ? (isPrivate
        ? Math.round(vehicle.monthly_rent * 1.22)
        : Math.round(vehicle.monthly_rent))
    : null;

  // Segment label (above title)
  const segmentLabel = segment
    ? (SEGMENT_LABEL[segment] ?? segment.toUpperCase())
    : (vehicle.category?.toUpperCase() ?? "NOLEGGIO NLT");

  // 3 spec boxes
  const FuelIcon = isElectric ? Zap : Fuel;
  const specs = [
    vehicle.transmission && { icon: Settings2, label: vehicle.transmission === "Automatico" ? "Autom." : "Manuale" },
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
    if (isReUse)                   return { icon: RefreshCw, text: "Re-Use certificato",          color: "text-teal-600",    border: "border-teal-200" };
    if (isElectric)                return { icon: Zap,       text: "0 Emissioni CO₂",             color: "text-green-700",   border: "border-green-200" };
    if (isHybrid)                  return { icon: Leaf,      text: "Ibrido plug-in",              color: "text-lime-700",    border: "border-lime-200" };
    return null;
  })();

  const imgH = compact ? "h-[170px]" : "h-[200px]";

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
        <div className="h-full flex flex-col bg-white border border-frame rounded-2xl shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)]">

          {/* ── Image ── */}
          <div className={`relative bg-[#f8fafc] overflow-hidden ${imgH}`}>
            <img
              src={getOptimizedSrc(imgSrc, 800)}
              srcSet={getVehicleCardSrcSet(imgSrc)}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ objectPosition: imgPos }}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0"; }}
            />

            {badge && (
              <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border ${badge.border} rounded-[8px] px-3 py-[5px] max-w-[calc(100%-24px)]`}>
                <badge.icon className={`w-3 h-3 shrink-0 ${badge.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${badge.color} truncate`}>
                  {badge.text}
                </span>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex-1 flex flex-col justify-between p-6">

            {/* Label + Title + Subtitle */}
            <div className="mb-4">
              <p className="text-[12px] font-bold text-[#777682] uppercase tracking-[1.2px] leading-none mb-[5px]">
                {segmentLabel}
              </p>
              <h3 className="text-[20px] font-bold text-navy-dark leading-7">
                {vehicle.make} {vehicle.model}
              </h3>
              {(vehicle.version || vehicle.fuel_type) && (
                <p className="text-[15px] text-[#464651] leading-snug mt-0.5">
                  {vehicle.version || [FUEL_IT[vehicle.fuel_type], vehicle.transmission].filter(Boolean).join(" ")}
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
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#777682] leading-none mb-1">Da soli</p>
                <div className="flex items-baseline gap-0.5 flex-wrap">
                  <span className="text-[28px] sm:text-[32px] font-bold text-navy-dark leading-none">
                    {displayPrice ? `${displayPrice.toLocaleString("it-IT")}€` : "Su richiesta"}
                  </span>
                  {displayPrice && (
                    <span className="text-[14px] font-medium text-[#464651]">/mese</span>
                  )}
                </div>
                <p className="text-[10px] italic text-[#777682] mt-1">
                  {isPrivate ? "IVA Inclusa" : "IVA Esclusa"} · Anticipo 0€
                </p>
              </div>

              <div className="w-12 h-12 bg-electric rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-electric/85">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
