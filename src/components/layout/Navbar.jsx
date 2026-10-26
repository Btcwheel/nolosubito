import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const offersDropdown = [
  { label: "Offerte Business",     path: "/offers",          desc: "P.IVA e aziende" },
  { label: "Offerte Privati",      path: "/private-offers",  desc: "Noleggio per privati" },
  { label: "Offerte Moto",         path: "/moto",            desc: "Scooter, naked, touring" },
  { label: "Veicoli Commerciali",  path: "/commercial",      desc: "Furgoni e van cargo" },
  { label: "Offerte Re-Use",       path: "/reuse",           desc: "Usato certificato NLT" },
];

const navLinks = [
  { label: "Home",           path: "/" },
  { label: "News",           path: "/news" },
  { label: "Usato Sicuro",   path: "/usato" },
  { label: "Lavora con Noi", path: "/careers" },
  { label: "Contatti",       path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen]               = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        rafId = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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
  const isHomePage = location.pathname === "/";
  const isLight = scrolled && !isHomePage;

  const navBg = scrolled
    ? isHomePage
      ? "bg-navy/95 backdrop-blur-md shadow-lg"
      : "bg-white/95 backdrop-blur-md shadow-sm"
    : "bg-navy";

  const linkBase     = isLight ? "text-navy/70 hover:text-navy hover:bg-navy/5" : "text-white/80 hover:text-white hover:bg-white/10";
  const linkActive   = isLight ? "text-navy" : "text-electric";
  const linkActiveBg = isLight ? `${linkActive} bg-navy/8` : `${linkActive} bg-white/10`;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center group">
            <img
              src="/logo-bianco.png"
              alt="Nolosubito"
              width="160"
              height="40"
              className="h-10 w-auto object-contain transition-all duration-300"
              style={isLight ? { filter: "brightness(0) saturate(100%) invert(20%) sepia(90%) saturate(1500%) hue-rotate(215deg) brightness(75%)" } : undefined}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === "/" ? linkActiveBg : linkBase}`}
            >
              Home
            </Link>

            {/* Offerte Dropdown — CSS-only animation */}
            <div className="relative" ref={dropdownRef}>
              <button type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${isOffersActive ? linkActive : linkBase}`}
              >
                Offerte Noleggio
                <ChevronDown className={`size-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-56 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden z-50 border transition-all duration-150 origin-top ${
                  dropdownOpen ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                } ${isLight ? "bg-white border-border" : "bg-navy border-white/10"}`}
              >
                {offersDropdown.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-3 transition-colors duration-200 border-b last:border-0 ${
                      isLight
                        ? `border-border/50 hover:bg-muted/50 ${location.pathname === item.path ? "bg-muted" : ""}`
                        : `border-white/5 hover:bg-white/5 ${location.pathname === item.path ? "bg-white/10" : ""}`
                    }`}
                  >
                    <p className={`text-sm font-medium ${location.pathname === item.path ? linkActive : isLight ? "text-foreground" : "text-white"}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-muted-foreground" : "text-white/40"}`}>{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === link.path ? linkActive : linkBase}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/accedi"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isLight ? "text-foreground/60 hover:text-foreground hover:bg-black/5" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Area Cliente
            </Link>
            <Link to="/contact">
              <Button className="bg-electric hover:bg-electric/90 text-white font-semibold px-6 rounded-lg cursor-pointer">
                Richiedi Preventivo
              </Button>
            </Link>
          </div>

          <button type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 ${isLight ? "text-foreground" : "text-white"}`}
            aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — CSS grid trick per height: 0 → auto */}
      <div
        className={`md:hidden backdrop-blur-md border-t transition-all duration-200 overflow-hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${isLight ? "bg-white/98 border-border" : "bg-navy/98 border-white/10"}`}
        style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === "/" ? linkActiveBg : linkBase}`}
            >
              Home
            </Link>

            {/* Mobile Offerte accordion */}
            <div>
              <button type="button"
                onClick={() => setMobileOffersOpen(!mobileOffersOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${isOffersActive ? linkActiveBg : linkBase}`}
              >
                Offerte Noleggio
                <ChevronDown className={`size-4 transition-transform duration-200 ${mobileOffersOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                style={{ display: "grid", gridTemplateRows: mobileOffersOpen ? "1fr" : "0fr", transition: "grid-template-rows 150ms ease" }}
              >
                <div className={`overflow-hidden ml-4 mt-1 border-l pl-3 ${isLight ? "border-border" : "border-white/10"}`}>
                  <div className="space-y-1 py-1">
                    {offersDropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          location.pathname === item.path ? linkActive : isLight ? "text-foreground/60 hover:text-foreground" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === link.path ? linkActiveBg : linkBase}`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 space-y-2">
              <Link
                to="/accedi"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isLight ? "text-foreground/60 hover:text-foreground" : "text-white/70 hover:text-white"
                }`}
              >
                Area Cliente
              </Link>
              <Link to="/contact">
                <Button className="w-full bg-electric hover:bg-electric/90 text-white font-semibold rounded-lg cursor-pointer">
                  Richiedi Preventivo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
