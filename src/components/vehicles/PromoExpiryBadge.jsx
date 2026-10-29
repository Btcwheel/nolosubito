import React from "react";
import { useCountdown } from "@/hooks/useCountdown";

// Tempo residuo in forma breve: "4g 17h", oppure "5h 12m" nell'ultimo giorno
export function shortRemaining(cd) {
  return cd.days > 0 ? `${cd.days}g ${cd.hours}h` : `${cd.hours}h ${cd.minutes}m`;
}

// Data di fine in italiano, es. "31 ottobre"
export const formatExpiryDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

// Badge "Offerta a scadenza": puntino che pulsa (fermo con prefers-reduced-motion), testo e tempo residuo.
// Nell'ultimo giorno il testo diventa "Ultime ore" e il badge passa al rosso pieno.
export default function PromoExpiryBadge({ expiresAt, discountPct = 0, showTime = true, className = "" }) {
  const cd = useCountdown(expiresAt);
  if (!cd || cd.expired) return null;
  const lastHours = cd.days === 0;
  const text = lastHours ? "Ultime ore" : "Offerta a scadenza";
  const sconto = Number(discountPct) > 0 ? `-${Math.round(discountPct)}% · ` : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[10px] font-bold sm:gap-2 sm:pl-2.5 sm:pr-3 sm:text-[11px] uppercase leading-none tracking-wide text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${
        lastHours ? "bg-red-600" : "bg-red-600/95"
      } ${className}`}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-white/70 motion-safe:animate-ping" />
        <span className="relative size-2 rounded-full bg-white" />
      </span>
      <span>
        {sconto}
        {text}
        {showTime && (
          <>
            <span className="mx-1.5 opacity-60" aria-hidden="true">·</span>
            <span className="tabular-nums">{shortRemaining(cd)}</span>
          </>
        )}
      </span>
      <span className="sr-only">: scade tra {shortRemaining(cd)}</span>
    </span>
  );
}
