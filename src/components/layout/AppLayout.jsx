import React, { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";

const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const CookieBanner = lazy(() => import("@/components/CookieBanner"));

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <AIChatWidget />
        <CookieBanner />
      </Suspense>
    </div>
  );
}