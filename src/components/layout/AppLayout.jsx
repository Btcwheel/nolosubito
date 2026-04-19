import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";

const INTERNAL_PATHS = ["/admin", "/backoffice", "/agente", "/cms"];

export default function AppLayout() {
  const location = useLocation();
  const isInternal = INTERNAL_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {!isInternal && <WhatsAppButton />}
    </div>
  );
}