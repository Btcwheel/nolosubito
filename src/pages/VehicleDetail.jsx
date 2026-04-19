import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuoteBox from "../components/quote/QuoteBox";
import LeadForm from "../components/lead/LeadForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Fuel, Gauge, Zap, Leaf, ShieldCheck, Wrench, FileText, Lock, Zap as ZapIcon, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetail() {
  const { make, model } = useParams();
  const location = useLocation();
  const decodedMake = decodeURIComponent(make);
  const decodedModel = decodeURIComponent(model);
  const segmentFromState = location.state?.segment;

  const [quoteConfig, setQuoteConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [make, model]);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: () => base44.entities.offers.list("-created_date", 500),
  });

  const vehicleOffers = useMemo(() => {
    return offers.filter(o => o.make === decodedMake && o.model === decodedModel);
  }, [offers, decodedMake, decodedModel]);

  const bestOffer = useMemo(() => {
    if (!vehicleOffers.length) return null;
    // Filter by segment if provided in state
    const filtered = segmentFromState 
      ? vehicleOffers.filter(o => o.segment === segmentFromState)
      : vehicleOffers;
    if (!filtered.length) return vehicleOffers[0]; // fallback
    return filtered.reduce((best, curr) =>
      curr.monthly_rent < best.monthly_rent ? curr : best
    );
  }, [vehicleOffers, segmentFromState]);

  const handleRequestQuote = (config) => {
    setQuoteConfig(config);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="bg-navy pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 bg-white/10 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-video rounded-2xl bg-white/10" />
            <Skeleton className="h-96 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!bestOffer) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl font-heading">Veicolo non trovato</p>
          <Link to="/offers">
            <Button variant="ghost" className="text-electric mt-4 cursor-pointer">
              ← Torna alle Offerte
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const FuelIcon = bestOffer.fuel_type === "Electric" ? Zap : Fuel;

  // Image fallbacks (same as VehicleCard)
  const MAKE_FALLBACKS = {
    "Audi": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    "BMW": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "Mercedes": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    "Tesla": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
    "Volkswagen": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
    "Volvo": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    "Fiat": "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80",
    "Peugeot": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "Ford": "https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&q=80",
    "Renault": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
    "Iveco": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80",
    "Opel": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    "Citroën": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    "Citroen": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    "Toyota": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80",
    "Nissan": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  };
  const CATEGORY_FALLBACKS = {
    "Commercial Van": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  };
  const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80";
  const fallbackSrc = CATEGORY_FALLBACKS[bestOffer.category] || MAKE_FALLBACKS[decodedMake] || DEFAULT_FALLBACK;

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${decodedMake} ${decodedModel}`,
    "brand": { "@type": "Brand", "name": decodedMake },
    "model": decodedModel,
    "fuelType": bestOffer.fuel_type || "Unknown",
    "vehicleTransmission": bestOffer.transmission || "Unknown",
    "offers": vehicleOffers.map(o => ({
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": o.monthly_rent,
      "description": `${o.duration_months} months, ${o.annual_km?.toLocaleString()} km/year, €${o.advance_payment?.toLocaleString()} advance`,
      "eligibleDuration": { "@type": "QuantitativeValue", "value": o.duration_months, "unitCode": "MON" },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
          <Link to="/offers" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors duration-200 mb-6">
            <ChevronLeft className="w-4 h-4" /> Torna alle Offerte
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16">
            {/* Left — Vehicle Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 mb-6">
                <img
                  src={bestOffer.vehicle_image || fallbackSrc}
                  alt={`${decodedMake} ${decodedModel}`}
                  className="w-full h-full object-cover"
                  width={800}
                  height={450}
                  onError={(e) => { e.target.src = fallbackSrc; }}
                />
                <Badge className="absolute top-4 left-4 bg-electric text-white border-0">
                  {bestOffer.category}
                </Badge>
              </div>

              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
                {decodedMake} {decodedModel}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {bestOffer.fuel_type && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <FuelIcon className="w-4 h-4 text-electric" /> {bestOffer.fuel_type}
                  </span>
                )}
                {bestOffer.power_hp && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <Gauge className="w-4 h-4 text-electric" /> {bestOffer.power_hp} HP
                  </span>
                )}
                {bestOffer.transmission && (
                  <span className="text-sm text-white/60">{bestOffer.transmission}</span>
                )}
                {bestOffer.co2_emissions && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <Leaf className="w-4 h-4 text-electric" /> {bestOffer.co2_emissions} g/km CO₂
                  </span>
                )}
              </div>

              {/* Features */}
              {bestOffer.features && bestOffer.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-heading font-semibold text-white text-sm mb-3">Caratteristiche Principali</h3>
                  <div className="flex flex-wrap gap-2">
                    {bestOffer.features.map((f, i) => (
                      <Badge key={i} variant="outline" className="border-white/20 text-white/70 text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tax Info — Only for business, not private */}
              {bestOffer.segment !== "Privati" && (
                <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-electric" />
                    Vantaggi Fiscali B2B
                  </h3>
                  <div className="space-y-3 text-sm text-white/60">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Deduzione P.IVA:</strong> Fino al 70% dei costi deducibili per veicoli ad uso aziendale (Art. 164 TUIR). 100% per agenti.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Detrazione IVA:</strong> 40% di detrazione IVA sui canoni di noleggio (100% per uso esclusivamente aziendale).</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Fringe Benefit:</strong> Tassazione agevolata per i dipendenti con auto aziendale in base alle emissioni di CO₂.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits for private individuals */}
              {bestOffer.segment === "Privati" && (
                <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
                    <Lock className="w-5 h-5 text-electric" />
                    Vantaggi del Noleggio
                  </h3>
                  <div className="space-y-3 text-sm text-white/60">
                    <div className="flex items-start gap-2">
                      <ZapIcon className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Zero Preoccupazioni:</strong> Manutenzione, assistenza e coperture assicurative incluse nel canone mensile.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Canone Fisso:</strong> Nessuna sorpresa—importo prevedibile ogni mese senza costi nascosti.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                      <p><strong className="text-white/80">Sempre Aggiornato:</strong> Guida sempre un'auto moderna con le ultime tecnologie di sicurezza.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right — Quote Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <QuoteBox
                fixedMake={decodedMake}
                fixedModel={decodedModel}
                onRequestQuote={handleRequestQuote}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lead Form Section */}
      {showForm && (
        <div id="lead-form" className="bg-background py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
                Richiedi la Tua Offerta Business
              </h2>
              <p className="text-muted-foreground mb-6">
                Inserisci i tuoi dati e ti invieremo un preventivo personalizzato entro 24 ore.
              </p>
              <Separator className="mb-6" />
              <LeadForm prefilledConfig={quoteConfig} />
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}