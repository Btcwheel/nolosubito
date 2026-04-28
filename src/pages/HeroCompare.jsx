import React from "react";
import HeroSection from "@/components/home/HeroSection";

const Badge = ({ children }) => (
  <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
    {children}
  </div>
);

export default function HeroCompare() {
  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge>Confronto hero</Badge>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Versione A vs Versione B
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A mantiene il taglio attuale ma più compatto. B riduce ancora
              l'altezza e toglie il box metriche per lasciare più spazio alle
              offerte sotto la piega.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            URL: <span className="font-medium text-foreground">/hero-compare</span>
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Badge>Versione A</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hero ridotta, ma con il blocco metriche ancora visibile.
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Più presenza
                  <br />
                  Meno spazio offerte
                </div>
              </div>
            </div>
            <div className="bg-[#0F1440]">
              <HeroSection />
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Badge>Versione B</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hero più corta e più asciutta: il focus passa prima alle
                    offerte.
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Più aria
                  <br />
                  Più spazio offerte
                </div>
              </div>
            </div>
            <div className="bg-[#0F1440]">
              <HeroSection variant="compact" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
