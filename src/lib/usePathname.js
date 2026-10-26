"use client";

import { useContext } from "react";
import { UNSAFE_LocationContext } from "react-router-dom";
import { usePathname as useNextPathname } from "next/navigation";

// Percorso corrente, sia dentro la SPA (React Router) sia nelle pagine Next.js.
// Dentro la SPA il percorso di React Router è quello aggiornato dalle navigazioni interne.
export function usePathname() {
  const routerLocation = useContext(UNSAFE_LocationContext)?.location;
  const nextPathname = useNextPathname();
  const raw = routerLocation?.pathname ?? nextPathname ?? "/";
  return normalizePath(raw);
}

// Server e browser devono vedere la stessa stringa per "/", altrimenti l'idratazione fallisce:
// niente slash finale e "/index" o vuoto valgono "/".
function normalizePath(path) {
  const clean = String(path).replace(/\/+$/, "");
  return clean === "" || clean === "/index" ? "/" : clean;
}
