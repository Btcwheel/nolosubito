import React from "react";
import { PageHeader } from "@/components/layout/ListingLayout";

export default function Usato() {
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        eyebrow="Usato Garantito"
        title="Veicoli Usati"
        description="Selezione di usato garantito, verificato e pronto consegna direttamente dal nostro catalogo AutoScout24."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <iframe
          src="https://www.autoscout24.it/concessionari/embedded-list/nolosubito-srl?preview=false"
          scrolling="auto"
          frameBorder="0"
          width="100%"
          height="1024"
          title="Catalogo Usato Nolosubito — AutoScout24"
          className="rounded-2xl overflow-hidden"
        >
          Il tuo browser non supporta gli iframe.
        </iframe>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <span className="size-2 rounded-full bg-[#FF6600]" />
          Annunci forniti da{" "}
          <a
            href="https://www.autoscout24.it/concessionari/nolosubito-srl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            AutoScout24 — Nolosubito S.r.l.
          </a>
        </div>
      </div>
    </div>
  );
}
