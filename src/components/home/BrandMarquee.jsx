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
    <section className="py-10 sm:py-14 bg-background border-y border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6 sm:mb-8 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest font-semibold">
          Noleggiamo tutte le principali marche
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap gap-8 sm:gap-12">
          {TRACK.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="inline-flex items-center justify-center flex-shrink-0 w-20 sm:w-28 h-12 sm:h-14 opacity-40 hover:opacity-80 transition-opacity duration-300 grayscale hover:grayscale-0"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-8 sm:max-h-10 max-w-[80px] sm:max-w-[100px] w-auto object-contain"
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
