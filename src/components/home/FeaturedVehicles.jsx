import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import VehicleCard from "../vehicles/VehicleCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedVehicles() {
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: () => base44.entities.offers.list("-created_date", 500),
  });

  const featuredVehicles = useMemo(() => {
    const vehicleMap = new Map();
    offers.forEach(o => {
      const key = `${o.make}-${o.model}`;
      if (!vehicleMap.has(key) || o.monthly_rent < vehicleMap.get(key).monthly_rent) {
        vehicleMap.set(key, o);
      }
    });
    return Array.from(vehicleMap.values()).slice(0, 6);
  }, [offers]);

  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Veicoli in Evidenza
            </h2>
            <p className="mt-2 text-muted-foreground">
              Le nostre offerte NLT più popolari per aziende e professionisti
            </p>
          </div>
          <Link to="/offers" className="hidden sm:block">
            <Button variant="ghost" className="text-electric font-semibold cursor-pointer">
              Vedi Tutte le Offerte <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((v, i) => (
              <VehicleCard key={`${v.make}-${v.model}`} vehicle={v} index={i} />
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