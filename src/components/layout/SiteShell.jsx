"use client";

import React from "react";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { HomeSegmentProvider } from "@/components/home/HomeSegmentContext";

// Caricati solo nel browser e dopo il contenuto: non pesano su LCP e TBT.
const ChatWidget = dynamic(() => import("@/components/Chat/ChatWidget"), { ssr: false });
const CookieBanner = dynamic(() => import("@/components/CookieBanner"), { ssr: false });

// Cornice comune del sito pubblico: usata sia dalla SPA (AppLayout) sia dalle pagine Next.js (app/(site)).
export default function SiteShell({ children }) {
  return (
    <HomeSegmentProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 md:pt-20">{children}</main>
        <Footer />
        <ChatWidget />
        <CookieBanner />
      </div>
    </HomeSegmentProvider>
  );
}
