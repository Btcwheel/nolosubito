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
    select: (data) => data.slice(0, 6),
  });

  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-electric text-sm font-bold uppercase tracking-widest mb-2">Catalogo NLT</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Veicoli in Evidenza
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Le nostre offerte NLT più richieste per aziende e professionisti
            </p>
          </div>
          <Link to="/offers" className="hidden sm:block">
            <Button variant="ghost" className="text-electric font-semibold cursor-pointer">
              Vedi Tutte <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-24 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
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
