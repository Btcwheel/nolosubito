"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// react-query per le pagine Next.js. Un client per browser (e uno per richiesta sul server):
// i dati caricati dal server arrivano da HydrationBoundary nelle singole pagine.
export default function SiteProviders({ children }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
