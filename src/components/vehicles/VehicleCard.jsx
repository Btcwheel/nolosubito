import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Zap, ArrowRight, Flame, Sparkles, Leaf } from "lucide-react";
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

function BrandLogo({ make }) {
  const [failed, setFailed] = React.useState(false);
  const logo = BRAND_LOGOS[make];
  if (!logo || failed) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
        <span className="text-[10px] font-bold text-muted-foreground">
          {make?.slice(0, 2).toUpperCase() ?? "?"}
        </span>
      </div>
    );
  }
  return (
    <img src={logo} alt={make} className="w-8 h-8 object-contain"
      onError={() => setFailed(true)} />
  );
}

export default function VehicleCard({ vehicle, index, segment }) {
  const isPrivate = segment === "Privati";
  const FuelIcon   = vehicle.fuel_type === "Electric" ? Zap : Fuel;
  const imgSrc     = getVehicleImage(vehicle);
  const imgPos     = getVehicleImagePosition(vehicle);
  const fuelClass  = FUEL_COLORS[vehicle.fuel_type] ?? "bg-muted text-muted-foreground";
  const isPopular  = POPULAR.includes(vehicle.model);
  const isNew      = NEW_TAG.includes(vehicle.model);

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
        <div className="h-full bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/8 hover:border-electric/25 hover:-translate-y-1">

          {/* ── Image ── */}
          <div className="relative aspect-[5/4] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92)_42%,_rgba(226,232,240,0.82)_100%)]">
            <div className="absolute inset-x-6 bottom-5 h-10 rounded-full bg-navy/10 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-navy/5" />
            <img
              src={imgSrc}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ objectPosition: imgPos }}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0"; }}
            />

            {/* Top badges */}
            <div className="absolute top-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
              <Badge className="bg-white/90 text-navy border border-white/70 text-[11px] backdrop-blur-sm px-2 py-0.5 shadow-sm">
                {vehicle.category}
              </Badge>
              {isPopular && (
                <Badge className="bg-electric text-white border-0 text-[11px] px-2 py-0.5 font-bold flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5" /> Più richiesto
                </Badge>
              )}
              {isNew && !isPopular && (
                <Badge className="bg-electric/90 text-white border-0 text-[11px] px-2 py-0.5 font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Novità
                </Badge>
              )}
            </div>

            {/* Top-right EV/Hybrid badge */}
            {vehicle.fuel_type === "Electric" && (
              <Badge className="absolute top-3 right-3 z-20 bg-fuel-ev/90 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Zap className="w-2.5 h-2.5" /> 0 CO₂
              </Badge>
            )}
            {vehicle.fuel_type === "Hybrid" && (
              <Badge className="absolute top-3 right-3 z-20 bg-fuel-hybrid/90 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Leaf className="w-2.5 h-2.5" /> Ibrido
              </Badge>
            )}
          </div>

          {/* ── Body ── */}
          <div className="p-4">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.24em] leading-none mb-1.5">
                {vehicle.make}
              </p>
              <h3 className="font-heading font-bold text-xl text-foreground leading-tight [text-wrap:balance]">
                {vehicle.model}
              </h3>
            </div>

            {/* Specs row & Logo */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {vehicle.fuel_type && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${fuelClass}`}>
                    <FuelIcon className="w-2.5 h-2.5" />
                    {vehicle.fuel_type}
                  </span>
                )}
                {vehicle.power_hp && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    <Gauge className="w-2.5 h-2.5" />
                    {vehicle.power_hp} CV
                  </span>
                )}
                {vehicle.transmission && (
                  <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    {vehicle.transmission}
                  </span>
                )}
              </div>
              <div className="shrink-0">
                <BrandLogo make={vehicle.make} />
              </div>
            </div>

            {/* Price block */}
            <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-3.5 flex items-center justify-between gap-3">
              <div>
                {vehicle.monthly_rent ? (
                  <>
                    <p className="text-[10px] text-white/50 leading-none mb-1">Da</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-heading font-bold text-2xl text-white leading-none">
                        €{isPrivate
                          ? Math.round(vehicle.monthly_rent * 1.22).toLocaleString("it-IT")
                          : Math.round(vehicle.monthly_rent).toLocaleString("it-IT")}
                      </span>
                      <span className="text-white/50 text-xs ml-0.5">/mese</span>
                    </div>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {isPrivate ? "IVA inclusa" : "+ IVA"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-white/70">Su richiesta</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0 group-hover:bg-electric/80">
                Configura
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
