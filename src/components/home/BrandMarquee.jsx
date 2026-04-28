import React from "react";

const BRANDS = [
  { name: "BMW",        logo: "https://www.carlogos.org/car-logos/bmw-logo.png" },
  { name: "Mercedes",   logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo.png" },
  { name: "Audi",       logo: "https://www.carlogos.org/car-logos/audi-logo.png" },
  { name: "Volkswagen", logo: "https://www.carlogos.org/car-logos/volkswagen-logo.png" },
  { name: "Volvo",      logo: "https://www.carlogos.org/car-logos/volvo-logo.png" },
  { name: "Tesla",      logo: "https://www.carlogos.org/car-logos/tesla-logo.png" },
  { name: "Toyota",     logo: "https://www.carlogos.org/car-logos/toyota-logo.png" },
  { name: "Ford",       logo: "https://www.carlogos.org/car-logos/ford-logo.png" },
  { name: "Peugeot",    logo: "https://www.carlogos.org/car-logos/peugeot-logo.png" },
  { name: "Renault",    logo: "https://www.carlogos.org/car-logos/renault-logo.png" },
  { name: "Fiat",       logo: "https://www.carlogos.org/car-logos/fiat-logo.png" },
  { name: "Alfa Romeo", logo: "https://www.carlogos.org/car-logos/alfa-romeo-logo.png" },
];

// Duplicato per loop seamless
const TRACK = [...BRANDS, ...BRANDS];

export default function BrandMarquee() {
  return (
    <section className="mt-8 overflow-hidden border-y border-border/40 bg-background py-7 sm:mt-12 sm:py-9">
      <div className="mx-auto mb-4 max-w-7xl px-4 text-center sm:mb-5">
        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest font-semibold">
          Noleggiamo tutte le principali marche
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap gap-6 sm:gap-10">
          {TRACK.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="inline-flex h-10 w-16 flex-shrink-0 items-center justify-center opacity-35 grayscale transition-opacity duration-300 hover:opacity-75 hover:grayscale-0 sm:h-12 sm:w-24"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-auto max-h-7 w-auto max-w-[64px] object-contain sm:max-h-8 sm:max-w-[88px]"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
