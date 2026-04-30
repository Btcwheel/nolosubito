import React, { useMemo } from "react";
import { offersService } from "@/services/offers";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Leaf, Zap, TrendingDown, Globe } from "lucide-react";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/ListingLayout";

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
    <div className="bg-surface">
      <PageHeader
        eyebrow="Flotta Sostenibile"
        title="Guida Green, Risparmia di Più"
        description="Veicoli elettrici e ibridi per aziende lungimiranti. Costi ridotti, zero emissioni, massimi benefici fiscali."
      />

      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="bg-white border border-frame rounded-2xl p-4 text-center shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]"
              >
                <s.icon className="w-5 h-5 text-electric mx-auto mb-2" />
                <p className="font-heading font-bold text-xl text-navy">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <h2 className="font-heading font-bold text-2xl text-navy mb-8">
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
                <VehicleCard key={`${v.make}-${v.model}`} vehicle={v} index={i} segment="P.IVA" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}