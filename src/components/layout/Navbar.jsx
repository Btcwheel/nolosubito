import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const offersDropdown = [
  { label: "Offerte Business", path: "/offers", desc: "P.IVA e aziende" },
  { label: "Offerte Privati", path: "/private-offers", desc: "Noleggio per privati" },
  { label: "Soluzioni Flotta", path: "/fleet", desc: "Flotte aziendali" },
  { label: "Veicoli Commerciali", path: "/commercial", desc: "Furgoni e van cargo" },
];

const navLinks = [
  { label: "Home", path: "/" },
  { label: "News", path: "/news" },
  { label: "Mobilità Green", path: "/green" },
  { label: "Lavora con Noi", path: "/careers" },
  { label: "Contatti", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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

  // Always dark (navy) except homepage hero before scroll
  const isHomePage = location.pathname === "/";
  const isDark = scrolled || !isHomePage;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${
        scrolled ? "bg-navy/95 backdrop-blur-md shadow-lg" : isHomePage ? "bg-transparent" : "bg-navy"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center group">
            <img
              src="/src/asset/logo-bianco.png"
              alt="NoloSubito"
              className="h-10 w-auto object-contain transition-all duration-300"
              
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                location.pathname === "/"
                  ? "text-electric bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Home
            </Link>

            {/* Offerte Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isOffersActive
                    ? "text-electric"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                Offerte
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-navy backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {offersDropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 hover:bg-white/5 transition-colors duration-200 border-b border-white/5 last:border-0 ${
                          location.pathname === item.path ? "bg-white/10" : ""
                        }`}
                      >
                        <p className={`text-sm font-medium ${location.pathname === item.path ? "text-electric" : "text-white"}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? "text-electric"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/accedi"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
            >
              Area Cliente
            </Link>
            <Link to="/contact">
              <Button className="bg-electric hover:bg-electric/90 text-white font-semibold px-6 rounded-lg cursor-pointer">
                Richiedi Preventivo
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 ${isDark ? "text-white" : "text-navy"}`}
            aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-navy/98 backdrop-blur-md border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === "/" ? "text-electric bg-white/10" : "text-white/70 hover:text-white"
                }`}
              >
                Home
              </Link>

              {/* Mobile Offerte accordion */}
              <div>
                <button
                  onClick={() => setMobileOffersOpen(!mobileOffersOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isOffersActive ? "text-electric bg-white/10" : "text-white/70 hover:text-white"
                  }`}
                >
                  Offerte
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileOffersOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileOffersOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3"
                    >
                      {offersDropdown.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.path ? "text-electric" : "text-white/60 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.path ? "text-electric bg-white/10" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 space-y-2">
                <Link to="/accedi" className="block px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Area Cliente
                </Link>
                <Link to="/contact">
                  <Button className="w-full bg-electric hover:bg-electric/90 text-white font-semibold rounded-lg cursor-pointer">
                    Richiedi Preventivo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}