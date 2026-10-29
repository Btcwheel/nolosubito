import React, { createContext, useContext, useMemo, useState } from "react";

// Segmento cliente scelto dal toggle della Navbar ("Privati" | "P.IVA"),
// letto da FeaturedVehicles per filtrare il catalogo.
const HomeSegmentContext = createContext({ segment: "Privati", setSegment: () => {} });

export function HomeSegmentProvider({ children }) {
  const [segment, setSegment] = useState("Privati");
  const value = useMemo(() => ({ segment, setSegment }), [segment]);
  return <HomeSegmentContext.Provider value={value}>{children}</HomeSegmentContext.Provider>;
}

export const useHomeSegment = () => useContext(HomeSegmentContext);
