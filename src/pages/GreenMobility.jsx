import React, { useMemo } from "react";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Leaf, Zap, TrendingDown, Globe } from "lucide-react";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  { icon: Leaf, value: "0g/km", label: "Emissioni Scarico" },
  { icon: Zap, value: "100%", label: "Autonomia Elettrica" },
  { icon: TrendingDown, value: "-40%", label: "Costi di Gestione" },
  { icon: Globe, value: "100%", label: "Energia Verde" },
];

export default function GreenMobility() {
  const { data: allVehicles = [], isLoading } = useQuery({
    queryKey: ["offers-green"],
    queryFn: () => offersService.listWithMinPrice(),
  });

  const greenVehicles = useMemo(() =>
    allVehicles.filter(v => v.fuel_type === "Electric" || v.fuel_type === "Hybrid"),
    [allVehicles]
  );

  return (
    <div className="bg-navy">
      <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300">Flotta Sostenibile</span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white max-w-3xl mx-auto">
            Guida Green, <span className="text-green-400">Risparmia di Più</span>
          </h1>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto text-lg">
            Veicoli elettrici e ibridi per aziende lungimiranti. Costi ridotti, zero emissioni, massimi benefici fiscali.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <s.icon className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="font-heading font-bold text-xl text-white">{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-background rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-8">
            Veicoli Elettrici e Ibridi
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : greenVehicles.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nessun veicolo elettrico o ibrido attualmente disponibile.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {greenVehicles.map((v, i) => (
                <VehicleCard key={`${v.make}-${v.model}`} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}