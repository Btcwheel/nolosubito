"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Ora "di riferimento" della pagina renderizzata sul server (ISR). Serve a far coincidere
// il primo render del browser con l'HTML del server (promo attive, conti alla rovescia):
// dopo il montaggio i componenti passano all'ora reale. Nella SPA non c'è provider e vale Date.now().
const NowContext = createContext(null);

export function NowProvider({ value, children }) {
  return <NowContext.Provider value={value}>{children}</NowContext.Provider>;
}

export const useServerNow = () => useContext(NowContext);

// Millisecondi correnti, sicuri per l'idratazione.
export function useNow() {
  const serverNow = useContext(NowContext);
  const [now, setNow] = useState(() => serverNow ?? Date.now());
  useEffect(() => { setNow(Date.now()); }, []);
  return now;
}
