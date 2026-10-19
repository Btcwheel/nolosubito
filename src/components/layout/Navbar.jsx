import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useHomeSegment } from "@/components/home/HomeSegmentContext";

const offersDropdown = [
  { label: "Offerte Business",     path: "/offers",          desc: "P.IVA e aziende" },
  { label: "Offerte Privati",      path: "/private-offers",  desc: "Noleggio per privati" },
  { label: "Offerte Moto",         path: "/moto",            desc: "Scooter, naked, touring" },
  { label: "Veicoli Commerciali",  path: "/commercial",      desc: "Furgoni e van cargo" },
  { label: "Offerte Re-Use",       path: "/reuse",           desc: "Usato certificato NLT" },
];

const navLinks = [
  { label: "Come Funziona",  path: "/fleet" },
  { label: "Usato Sicuro",   path: "/usato" },
  { label: "Sedi & Contatti", path: "/contact" },
];

const SEGMENTS = [
  { value: "Privati", label: "Privati (IVA inclusa)" },
  { value: "P.IVA",   label: "P.IVA & Flotte" },
];

function SegmentToggle({ className = "" }) {
  const { segment, setSegment } = useHomeSegment();
  return (
    <div role="group" aria-label="Tipo di cliente" className={`inline-flex rounded-full bg-slate-100 p-0.5 ${className}`}>
      {SEGMENTS.map((s) => (
        <button
          key={s.value}
          type="button"
          aria-pressed={segment === s.value}
          onClick={() => setSegment(s.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            segment === s.value ? "bg-[#1A1F5E] text-white shadow-sm" : "text-slate-600 hover:text-[#1A1F5E]"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen]             = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOffersActive = offersDropdown.some(o => location.pathname === o.path);

  const linkBase   = "text-slate-600 hover:text-[#1A1F5E] hover:bg-slate-100";
  const linkActive = "text-[#1A1F5E] bg-[#3B82F6]/10";

  return (
    <nav className="fixed top-2 sm:top-3 inset-x-2 sm:inset-x-4 z-50">
      <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between h-14 md:h-16 px-3 sm:px-5 gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Nolosubito - Home">
            <img src="/logo-blu.svg" alt="Nolosubito" width="281" height="78" className="h-9 md:h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="relative" ref={dropdownRef}>
              <button type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${isOffersActive ? linkActive : linkBase}`}
              >
                Catalogo Auto
                <ChevronDown className={`size-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-150 origin-top ${
                  dropdownOpen ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                }`}
              >
                {offersDropdown.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors duration-200 ${location.pathname === item.path ? "bg-slate-50" : ""}`}
                  >
                    <p className={`text-sm font-medium ${location.pathname === item.path ? "text-[#3B82F6]" : "text-slate-800"}`}>{item.label}</p>
                    <p className="text-xs mt-0.5 text-slate-500">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === link.path ? linkActive : linkBase}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isHomePage && <SegmentToggle />}
            <Link
              to="/accedi"
              className="hidden xl:block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-[#1A1F5E] hover:bg-slate-100 transition-colors duration-200"
            >
              Area Cliente
            </Link>
            <Link
              to="/contact"
              className="rounded-full bg-[#1A1F5E] hover:bg-[#3B82F6] text-white text-sm font-semibold px-5 py-2 transition-colors duration-200 whitespace-nowrap"
            >
              Preventivo Rapido
            </Link>
          </div>

          <button type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-[#1A1F5E]"
            aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile Menu — CSS grid trick per height: 0 → auto */}
        <div
          className={`md:hidden border-t border-slate-200 transition-all duration-200 overflow-hidden ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none border-transparent"
          }`}
          style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="px-3 py-3 space-y-1">
              {isHomePage && <SegmentToggle className="w-full justify-center mb-2" />}

              <div>
                <button type="button"
                  onClick={() => setMobileOffersOpen(!mobileOffersOpen)}
                  aria-expanded={mobileOffersOpen}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${isOffersActive ? linkActive : linkBase}`}
                >
                  Catalogo Auto
                  <ChevronDown className={`size-4 transition-transform duration-200 ${mobileOffersOpen ? "rotate-180" : ""}`} />
                </button>
                <div style={{ display: "grid", gridTemplateRows: mobileOffersOpen ? "1fr" : "0fr", transition: "grid-template-rows 150ms ease" }}>
                  <div className="overflow-hidden ml-4 mt-1 border-l border-slate-200 pl-3">
                    <div className="space-y-1 py-1">
                      {offersDropdown.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.path ? "text-[#3B82F6]" : "text-slate-600 hover:text-[#1A1F5E]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {[...navLinks, { label: "News", path: "/news" }, { label: "Lavora con Noi", path: "/careers" }].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === link.path ? linkActive : linkBase}`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 space-y-2">
                <Link to="/accedi" className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:text-[#1A1F5E] transition-colors">
                  Area Cliente
                </Link>
                <Link
                  to="/contact"
                  className="block text-center rounded-full bg-[#1A1F5E] hover:bg-[#3B82F6] text-white text-sm font-semibold px-5 py-3 transition-colors"
                >
                  Preventivo Rapido
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
