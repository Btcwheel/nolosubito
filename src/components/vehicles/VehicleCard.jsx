import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { getVehicleImage, BRAND_LOGOS } from "@/lib/vehicleFallbacks";

function BrandLogo({ make }) {
  const [failed, setFailed] = React.useState(false);
  const logo = BRAND_LOGOS[make];
  if (!logo || failed) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border/50">
        <span className="text-[10px] font-bold text-muted-foreground">
          {make?.slice(0, 2).toUpperCase() ?? "?"}
        </span>
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={make}
      className="w-9 h-9 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

const FUEL_COLORS = {
  Electric: "bg-green-100 text-green-700 border-green-200",
  Hybrid:   "bg-teal-100 text-teal-700 border-teal-200",
  Diesel:   "bg-slate-100 text-slate-600 border-slate-200",
  Petrol:   "bg-orange-100 text-orange-700 border-orange-200",
};

export default function VehicleCard({ vehicle, index }) {
  const FuelIcon = vehicle.fuel_type === "Electric" ? Zap : Fuel;
  const imgSrc = getVehicleImage(vehicle);
  const fuelClass = FUEL_COLORS[vehicle.fuel_type] ?? "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`}
        className="group block"
      >
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-electric/20 hover:-translate-y-0.5">
          {/* Image */}
          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
            <img
              src={imgSrc}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { e.target.src = imgSrc; }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Badge className="absolute top-3 left-3 bg-navy/90 text-white border-0 text-xs backdrop-blur-sm">
              {vehicle.category}
            </Badge>
            {vehicle.fuel_type === "Electric" && (
              <Badge className="absolute top-3 right-3 bg-green-500/90 text-white border-0 text-xs backdrop-blur-sm">
                ⚡ Elettrico
              </Badge>
            )}
            {vehicle.fuel_type === "Hybrid" && (
              <Badge className="absolute top-3 right-3 bg-teal-500/90 text-white border-0 text-xs backdrop-blur-sm">
                🌿 Ibrido
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-electric uppercase tracking-widest">{vehicle.make}</p>
              <BrandLogo make={vehicle.make} />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground leading-tight">
              {vehicle.model}
            </h3>

            {/* Specs */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {vehicle.fuel_type && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${fuelClass}`}>
                  <FuelIcon className="w-3 h-3" />
                  {vehicle.fuel_type}
                </span>
              )}
              {vehicle.power_hp && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Gauge className="w-3 h-3" />
                  {vehicle.power_hp} CV
                </span>
              )}
              {vehicle.transmission && (
                <span className="text-xs text-muted-foreground">{vehicle.transmission}</span>
              )}
            </div>

            {/* Price */}
            <div className="mt-4 pt-4 border-t border-border/40 flex items-end justify-between">
              <div>
                {vehicle.monthly_rent ? (
                  <>
                    <p className="text-xs text-muted-foreground">Da</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-heading font-bold text-2xl text-foreground">
                        €{vehicle.monthly_rent.toLocaleString('it-IT')}
                      </span>
                      <span className="text-sm text-muted-foreground">/mese</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">Richiedi preventivo</p>
                )}
              </div>
              <span className="text-xs text-electric font-bold group-hover:translate-x-1 transition-transform duration-200">
                Configura →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
