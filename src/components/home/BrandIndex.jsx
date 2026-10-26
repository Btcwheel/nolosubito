import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";

const slug = (make) => make.trim().toLowerCase().replace(/\s+/g, "-");

// Logo da /brands; se il file manca resta la sigla della marca, così le piastrelle hanno tutte la stessa altezza
function BrandMark({ make }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  // Il file mancante può fallire prima dell'idratazione: onError non scatta, quindi si controlla al montaggio
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) {
    return (
      <span className="flex size-10 items-center justify-center rounded-full bg-[#f1f3ff] text-sm sm:size-14 sm:text-base font-bold tracking-wide text-[#1A1F5E]" aria-hidden="true">
        {make.replace(/[^A-Za-z0-9]/g, "").slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      ref={imgRef}
      src={`/brands/${slug(make)}.svg`}
      alt=""
      width="56"
      height="56"
      loading="lazy"
      className="size-10 object-contain sm:size-14"
      onError={() => setFailed(true)}
    />
  );
}

// Indice alfabetico di tutte le marche a catalogo. Scegliere una marca filtra l'elenco delle offerte.
export default function BrandIndex({ selectedMake = "", onSelectMake }) {
  const { data: vehicles = [] } = useHomeCatalog();

  const brands = useMemo(() => {
    const counts = new Map();
    for (const v of vehicles) {
      const key = (v.make ?? "").trim().toUpperCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => a[0].localeCompare(b[0], "it"));
  }, [vehicles]);

  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="indice-marche" className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="indice-marche" className="font-heading text-2xl font-bold text-navy sm:text-3xl">
            Tutte le marche disponibili
          </h2>
          <p className="text-sm text-slate-600">
            {brands.length} marche, {vehicles.length} offerte a catalogo
          </p>
        </div>

        <ul className="mt-8 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
          {brands.map(([make, count]) => {
            const active = selectedMake === make;
            return (
              <li key={make}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectMake?.(active ? "" : make)}
                  className={`group relative flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border bg-white px-2 pb-3 pt-4 text-center sm:gap-3 sm:px-3 sm:pb-4 sm:pt-5 shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71BAED] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                    active ? "border-[#1A1F5E] ring-1 ring-[#1A1F5E]" : "border-[#f1f5f9]"
                  }`}
                >
                  <BrandMark make={make} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold uppercase tracking-wide sm:text-sm text-[#15146c]">{make}</span>
                    <span className="mt-0.5 block text-xs font-medium text-[#777682]">
                      {count} {count === 1 ? "modello" : "modelli"}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="absolute right-2 top-2 size-3.5 sm:right-3 sm:top-3 sm:size-4 text-slate-300 transition-colors group-hover:text-[#71BAED]"
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
