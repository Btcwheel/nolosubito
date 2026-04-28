import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Zap, ArrowRight, Flame, Sparkles, Leaf, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { getVehicleImage, getVehicleImagePosition, BRAND_LOGOS } from "@/lib/vehicleFallbacks";

const POPULAR = ["Model Y", "Classe C", "5 Series"];
const NEW_TAG  = ["Q4 e-tron", "e-Expert"];

const FUEL_COLORS = {
  Electric: "bg-fuel-ev/15 text-fuel-ev border-fuel-ev/25",
  Hybrid:   "bg-fuel-hybrid/15 text-fuel-hybrid border-fuel-hybrid/25",
  Diesel:   "bg-fuel-diesel/10 text-fuel-diesel border-fuel-diesel/20",
  Petrol:   "bg-fuel-petrol/15 text-fuel-petrol border-fuel-petrol/25",
};

function BrandLogo({ make, compact }) {
  const [failed, setFailed] = React.useState(false);
  const logo = BRAND_LOGOS[make]
    ?? Object.entries(BRAND_LOGOS).find(([k]) => k.toLowerCase() === make?.toLowerCase())?.[1];
  const sz = compact ? "w-9 h-9" : "w-11 h-11";
  if (!logo || failed) {
    return (
      <div className={`${sz} rounded-full bg-muted flex items-center justify-center border border-border/50`}>
        <span className="text-[11px] font-bold text-muted-foreground">
          {make?.slice(0, 2).toUpperCase() ?? "?"}
        </span>
      </div>
    );
  }
  return (
    <img src={logo} alt={make} className={`${sz} object-contain`}
      onError={() => setFailed(true)} />
  );
}

export default function VehicleCard({ vehicle, index, segment, compact = false }) {
  const isPrivate = segment === "Privati";
  const FuelIcon   = vehicle.fuel_type === "Electric" ? Zap : Fuel;
  const imgSrc     = getVehicleImage(vehicle);
  const imgPos     = getVehicleImagePosition(vehicle);
  const fuelClass  = FUEL_COLORS[vehicle.fuel_type] ?? "bg-muted text-muted-foreground";
  const isPopular  = POPULAR.includes(vehicle.model);
  const isNew      = NEW_TAG.includes(vehicle.model);
  const isReUse    = vehicle.segments?.includes("ReUse");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`}
        state={{ segment }}
        className="group block h-full"
      >
        <div className={`h-full bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/8 hover:border-electric/25 hover:-translate-y-1 ${compact ? "rounded-[1.4rem]" : ""}`}>

          {/* ── Image ── */}
          <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92)_42%,_rgba(226,232,240,0.82)_100%)] ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
            <div className={`absolute inset-x-6 bottom-5 rounded-full bg-navy/10 blur-2xl ${compact ? "h-8" : "h-10"}`} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-navy/5" />
            <img
              src={imgSrc}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="relative z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ objectPosition: imgPos }}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0"; }}
            />

            {/* Top badges */}
            <div className={`absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 ${compact ? "right-3" : ""}`}>
              <Badge className={`bg-white/90 text-navy border border-white/70 backdrop-blur-sm shadow-sm ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}>
                {vehicle.category}
              </Badge>
              {isPopular && (
                <Badge className={`bg-electric text-white border-0 font-bold flex items-center gap-1 ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}>
                  <Flame className="h-2.5 w-2.5" /> Più richiesto
                </Badge>
              )}
              {isNew && !isPopular && (
                <Badge className={`bg-electric/90 text-white border-0 font-bold flex items-center gap-1 ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}>
                  <Sparkles className="h-2.5 w-2.5" /> Novità
                </Badge>
              )}
            </div>

            {/* Re-Use badge */}
            {isReUse && (
              <Badge className={`absolute left-3 bottom-3 z-20 bg-teal-500/90 text-white border-0 backdrop-blur-sm flex items-center gap-1 shadow-sm ${compact ? "px-1.5 py-0.5 text-[10px]" : "text-[11px]"}`}>
                <RefreshCw className="h-2.5 w-2.5" /> Re-Use
              </Badge>
            )}

            {/* Top-right EV/Hybrid badge */}
            {vehicle.fuel_type === "Electric" && (
              <Badge className={`absolute right-3 top-3 z-20 bg-fuel-ev/90 text-white border-0 backdrop-blur-sm flex items-center gap-1 shadow-sm ${compact ? "px-1.5 py-0.5 text-[10px]" : "text-[11px]"}`}>
                <Zap className="h-2.5 w-2.5" /> 0 CO₂
              </Badge>
            )}
            {vehicle.fuel_type === "Hybrid" && (
              <Badge className={`absolute right-3 top-3 z-20 bg-fuel-hybrid/90 text-white border-0 backdrop-blur-sm flex items-center gap-1 shadow-sm ${compact ? "px-1.5 py-0.5 text-[10px]" : "text-[11px]"}`}>
                <Leaf className="h-2.5 w-2.5" /> Ibrido
              </Badge>
            )}
          </div>

          {/* ── Body ── */}
          <div className={compact ? "p-3.5" : "p-4"}>
            {/* Make / Model + Logo */}
            <div className={`flex items-start justify-between gap-2 ${compact ? "mb-3" : "mb-4"}`}>
              <div className="min-w-0">
                <p className={`font-bold text-muted-foreground uppercase tracking-[0.24em] leading-none mb-1.5 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                  {vehicle.make}
                </p>
                <h3 className={`font-heading font-bold text-foreground leading-tight [text-wrap:balance] ${compact ? "text-lg" : "text-xl"}`}>
                  {vehicle.model}
                </h3>
              </div>
              <div className="shrink-0">
                <BrandLogo make={vehicle.make} compact={compact} />
              </div>
            </div>

            {/* Specs row */}
            <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mb-3" : "mb-4"}`}>
              {vehicle.fuel_type && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${fuelClass}`}>
                  <FuelIcon className="h-2.5 w-2.5" />
                  {vehicle.fuel_type}
                </span>
              )}
              {vehicle.power_hp && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Gauge className="h-2.5 w-2.5" />
                  {vehicle.power_hp} CV
                </span>
              )}
              {vehicle.transmission && (
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {vehicle.transmission}
                </span>
              )}
            </div>

            {/* Price block */}
            <div className={`flex items-center justify-between gap-3 rounded-xl bg-gradient-to-br from-navy to-navy-light ${compact ? "p-3" : "p-3.5"}`}>
              <div>
                {vehicle.monthly_rent ? (
                  <>
                    <p className="mb-1 leading-none text-[10px] text-white/50">Da</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`font-heading font-bold leading-none text-white ${compact ? "text-xl" : "text-2xl"}`}>
                        €{isPrivate
                          ? Math.round(vehicle.monthly_rent * 1.22).toLocaleString("it-IT")
                          : Math.round(vehicle.monthly_rent).toLocaleString("it-IT")}
                      </span>
                      <span className="ml-0.5 text-xs text-white/50">/mese</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/35">
                      {isPrivate ? "IVA inclusa" : "+ IVA"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-white/70">Su richiesta</p>
                )}
              </div>

              <div className={`flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-white transition-colors hover:bg-white/25 group-hover:bg-electric/80 ${compact ? "text-[11px]" : "text-xs"} font-bold`}>
                Configura
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
