"use client";

import React from "react";
import NextLink from "next/link";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";

// Rotte già servite da pagine Next.js. Dalla SPA un link verso di esse deve fare una navigazione
// completa (<a>): il Link di React Router mostrerebbe la vecchia versione della pagina nella SPA.
// Da aggiornare a ogni rotta migrata.
const NEXT_ROUTES = new Set(["/", "/offers", "/private-offers", "/commercial", "/moto", "/reuse", "/green", "/news"]);
const isNextPath = (path) => NEXT_ROUTES.has(path) || path.startsWith("/news/");

const SEGMENT_KEY = "nolo:segment";

// La SPA legge il segmento scelto in home da location.state; con next/link lo stato non esiste,
// quindi lo si lascia in sessionStorage per pochi secondi (letto da VehicleDetail).
function rememberSegment(state) {
  const segment = state?.segment;
  if (!segment) return;
  try { sessionStorage.setItem(SEGMENT_KEY, JSON.stringify({ segment, t: Date.now() })); } catch { /* storage non disponibile */ }
}

export function readRememberedSegment(maxAgeMs = 10000) {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SEGMENT_KEY) || "null");
    return raw && Date.now() - raw.t < maxAgeMs ? raw.segment : null;
  } catch {
    return null;
  }
}

// Link condiviso tra la SPA (React Router) e le pagine Next.js.
// Dentro la SPA un <NextLink> cambierebbe l'URL senza che BrowserRouter se ne accorga,
// quindi lì si usa il Link di React Router; nelle pagine Next.js il Link di Next.
export default function AppLink({ to, href, state, onClick, ...props }) {
  const target = to ?? href;
  const inRouter = useInRouterContext();
  if (inRouter) {
    const path = typeof target === "string" ? target.split(/[?#]/)[0] : "";
    if (isNextPath(path)) return <a href={target} onClick={onClick} {...props} />;
    return <RouterLink to={target} state={state} onClick={onClick} {...props} />;
  }
  return (
    <NextLink
      href={target}
      onClick={(e) => { rememberSegment(state); onClick?.(e); }}
      {...props}
    />
  );
}
