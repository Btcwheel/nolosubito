import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Zap, ArrowRight, Flame, Sparkles, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { getVehicleImage, BRAND_LOGOS } from "@/lib/vehicleFallbacks";

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

export default function VehicleCard({ vehicle, index }) {
  const FuelIcon   = vehicle.fuel_type === "Electric" ? Zap : Fuel;
  const imgSrc     = getVehicleImage(vehicle);
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
        className="group block h-full"
      >
        <div className="h-full bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/8 hover:border-electric/25 hover:-translate-y-1">

          {/* ── Image ── */}
          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
            <img
              src={imgSrc}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0"; }}
            />

            {/* Permanent bottom gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge className="bg-navy/80 text-white border-0 text-[11px] backdrop-blur-sm px-2 py-0.5">
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
              <Badge className="absolute top-3 right-3 bg-fuel-ev/90 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> 0 CO₂
              </Badge>
            )}
            {vehicle.fuel_type === "Hybrid" && (
              <Badge className="absolute top-3 right-3 bg-fuel-hybrid/90 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1">
                <Leaf className="w-2.5 h-2.5" /> Ibrido
              </Badge>
            )}

            {/* Bottom-left: make + model over image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-0.5">
                  {vehicle.make}
                </p>
                <h3 className="font-heading font-bold text-lg text-white leading-tight drop-shadow">
                  {vehicle.model}
                </h3>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-4">

            {/* Specs row & Logo */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-1.5 hover:opacity-100">
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
                        €{Math.round(vehicle.monthly_rent).toLocaleString("it-IT")}
                      </span>
                      <span className="text-white/50 text-xs ml-0.5">/mese</span>
                    </div>
                    <p className="text-[10px] text-white/35 mt-0.5">+ IVA 22%</p>
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
