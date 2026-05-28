import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offersService } from "@/services/offers";
import { formatDisplayedRent } from "@/lib/vehiclePricing";

const NAVY = "#2D2E82";
const ACCENT = "#71BAED";
const REUSE_BG = "#0d9488";

const DURATION_OPTIONS = [12, 24];
const KM_OPTIONS = [10000, 20000];

export default function ReUseQuoteBox({ fixedMake, fixedModel, onRequestQuote }) {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["offer-configs", fixedMake, fixedModel, "ReUse"],
    queryFn: () => offersService.getConfigs(fixedMake, fixedModel),
    enabled: !!fixedMake && !!fixedModel,
    staleTime: 5 * 60 * 1000,
  });

  const reuseConfigs = useMemo(
    () => configs.filter(c => c.segment === "ReUse" && c.is_active),
    [configs],
  );

  const options = useMemo(() => {
    const map = {};
    reuseConfigs.forEach(c => {
      const key = `${c.duration_months}|${c.annual_km}`;
      map[key] = c;
    });
    return map;
  }, [reuseConfigs]);

  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    setSelected(null);
  }, [fixedMake, fixedModel]);

  const handleSelect = (duration, km) => {
    setSelected({ duration, km });
  };

  const handleRequestQuote = () => {
    if (!selected) return;
    const config = options[`${selected.duration}|${selected.km}`];
    onRequestQuote?.({
      make: fixedMake,
      model: fixedModel,
      segment: "ReUse",
      duration: selected.duration,
      annualKm: selected.km,
      advance: 0,
      monthlyRent: config?.monthly_rent ?? null,
    });
  };

  const selectedRent = selected
    ? options[`${selected.duration}|${selected.km}`]?.monthly_rent
    : null;

  const displayRent = selectedRent
    ? formatDisplayedRent(Number(selectedRent), {
        segment: "ReUse",
        vehicleCategory: null,
        vehicleSegments: ["ReUse"],
      })
    : null;

  const hasAny = reuseConfigs.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden px-5 sm:px-6 pt-5 pb-5" style={{ background: `linear-gradient(135deg, ${REUSE_BG}, #0f766e)` }}>
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", filter: "blur(24px)" }}
        />
        <div className="flex items-center gap-2.5 mb-1 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">Re-Use Certificato</h3>
        </div>
        <p className="text-white/60 text-sm relative z-10">
          {fixedMake} {fixedModel} · Canone vincolato · Anticipo €0
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted/40 rounded-xl" />
            ))}
          </div>
        ) : !hasAny ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Nessuna offerta Re-Use disponibile per questo veicolo.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Seleziona durata e chilometraggio:</p>

            <div className="space-y-3">
              {DURATION_OPTIONS.map(duration => (
                <div key={duration} className="grid grid-cols-2 gap-2.5">
                  {KM_OPTIONS.map(km => {
                    const config = options[`${duration}|${km}`];
                    const available = !!config;
                    const display = config
                      ? formatDisplayedRent(Number(config.monthly_rent), {
                          segment: "ReUse",
                          vehicleCategory: null,
                          vehicleSegments: ["ReUse"],
                        })
                      : null;
                    const isSelected = selected?.duration === duration && selected?.km === km;

                    if (!available) return null;

                    return (
                      <motion.button
                        key={`${duration}-${km}`}
                        onClick={() => handleSelect(duration, km)}
                        whileTap={{ scale: 0.97 }}
                        className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 shadow-md"
                            : "border-border hover:border-emerald-300"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "#f0fdfa", borderColor: REUSE_BG, boxShadow: `0 4px 12px ${REUSE_BG}20` }
                            : { backgroundColor: "#fff" }
                        }
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold leading-none" style={isSelected ? { color: REUSE_BG } : { color: NAVY }}>
                            {duration} {duration === 12 ? "mesi" : "mesi"} · {km.toLocaleString("it-IT")} km/anno
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: REUSE_BG }} />}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-bold leading-none ${isSelected ? "" : "text-foreground"}`} style={isSelected ? { color: REUSE_BG } : {}}>
                            €{display?.toLocaleString("it-IT")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/mese</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Anticipo €0 · IVA 22% inclusa
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Price display */}
            {selectedRent && (
              <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(to bottom right, ${REUSE_BG}, #0f766e)` }}>
                <div className="p-5 text-center">
                  <p className="text-white/50 text-xs mb-1">Canone mensile</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading font-bold text-5xl text-white tracking-tight">
                      €{displayRent?.toLocaleString("it-IT")}
                    </span>
                    <span className="text-white/40 text-sm">/mese</span>
                  </div>
                  <p className="text-white/30 text-[11px] mt-1">IVA 22% inclusa · Anticipo €0</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={handleRequestQuote}
              disabled={!selected}
              className="w-full h-13 font-bold rounded-xl text-base py-3.5 cursor-pointer transition-all duration-200 disabled:opacity-40 bg-emerald-600 hover:bg-emerald-700 text-white"
              style={selected ? { boxShadow: `0 4px 12px ${REUSE_BG}40` } : {}}
            >
              Richiedi informazioni <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {/* Trust */}
        <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Usato certificato NLT
        </div>
      </div>
    </div>
  );
}