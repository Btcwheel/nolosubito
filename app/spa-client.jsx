"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Buffer } from "buffer";

if (typeof globalThis !== "undefined" && !globalThis.Buffer) globalThis.Buffer = Buffer;

// La SPA attuale (React Router, area riservata, CMS, pagine non ancora migrate) gira solo nel browser.
const App = dynamic(() => import("@/App.jsx"), { ssr: false });

export default function SpaClient() {
  // Service Worker per le notifiche push del backoffice
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return <App />;
}
