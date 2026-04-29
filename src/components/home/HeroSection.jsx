import React from "react";
import { ChevronRight, ShieldCheck, Timer, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const heroFeatures = [
  { icon: ShieldCheck, label: "Assistenza completa" },
  { icon: Wallet, label: "Canone chiaro" },
  { icon: Timer, label: "Risposta rapida" },
];

export default function HeroSection({ variant = "default" } = {}) {
  const isCompact = variant === "compact";

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=90&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[68%_center] scale-110 sm:object-center sm:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D2E82]/65 via-[#2D2E82]/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D2E82]/40 via-transparent to-transparent" />
      </div>

      <div
          className={[
            "relative mx-auto flex max-w-7xl flex-col px-4 sm:px-6",
          isCompact
            ? "min-h-[58svh] justify-end pb-7 pt-[4.5rem] lg:min-h-[62svh] lg:justify-center lg:pb-10 lg:pt-20"
            : "min-h-[68svh] justify-end pb-8 pt-20 lg:min-h-[72svh] lg:justify-center lg:pb-12 lg:pt-24",
        ].join(" ")}
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#71BAED] shadow-[0_0_18px_rgba(243,146,0,0.9)]" />
            Noleggio su misura
          </div>

          <h1 className="mt-5 max-w-xl font-heading text-[2.45rem] leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Noleggiamo
            <br />
            il futuro
          </h1>

          <p className="mt-4 max-w-lg text-[0.98rem] leading-7 text-white/72 sm:text-lg">
            Noleggio a lungo termine per privati, P.IVA e flotte aziendali, con
            consulenza rapida e condizioni chiare.
          </p>

          <div className="mt-6 grid max-w-md grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            {heroFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-center backdrop-blur-md"
                >
                  <Icon className="mx-auto h-4 w-4 text-[#71BAED]" />
                  <p className="mt-2 text-[11px] font-medium leading-snug text-white/78">
                    {feature.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Button asChild className="h-12 flex-1 rounded-2xl bg-white text-navy hover:bg-white/90">
              <Link to="/contact">
                Preventivo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 flex-1 rounded-2xl border-white/25 bg-white/5 text-white hover:bg-white/10"
            >
              <Link to="/offers">Offerte</Link>
            </Button>
          </div>

          {!isCompact && (
            <div className="mt-6 flex max-w-md items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3 backdrop-blur-md sm:mt-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Tempo medio
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-white">
                  24h
                </p>
              </div>

              <div className="h-10 w-px bg-white/10" />

              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Clienti soddisfatti
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-white">
                  98%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
