import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleCard from "../vehicles/VehicleCard";
import { offersService } from "@/services/offers";

export default function FeaturedVehicles() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["offers-featured"],
    queryFn: () => offersService.listWithMinPrice(),
    select: (data) => {
      const featured = data.filter(v => v.is_featured);
      return featured.length > 0 ? featured.slice(0, 8) : data.slice(0, 8);
    },
  });

  return (
    <section className="relative overflow-hidden border-y border-electric/10 bg-[linear-gradient(180deg,rgba(45,46,130,0.06)_0%,rgba(243,244,246,0.96)_16%,rgba(243,244,246,0.78)_100%)] py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between border-b border-border/40 pb-6">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-electric">Catalogo Noleggio Lungo Termine</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Veicoli in Evidenza
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Le nostre offerte Noleggio Lungo Termine più richieste per aziende e professionisti
            </p>
          </div>
          <Link to="/offers" className="hidden sm:block">
            <Button variant="ghost" className="text-electric font-semibold cursor-pointer">
              Vedi Tutte <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className={`bg-card rounded-2xl border border-border/50 overflow-hidden ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-24 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {vehicles.map((v, i) => (
              <div key={v.id} className={i === 0 ? "sm:col-span-2 xl:col-span-1" : ""}>
                <VehicleCard vehicle={v} index={i} compact />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/offers">
            <Button variant="ghost" className="text-electric font-semibold cursor-pointer">
              Vedi Tutte le Offerte <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
