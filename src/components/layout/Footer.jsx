import React from "react";
import { Link } from "react-router-dom";
import { Car, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#2D2E82] via-[#252670] to-navy text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center mb-4">
              <img
                src="/logo-bianco.png"
                alt="Nolosubito"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              Soluzioni premium di noleggio a lungo termine per aziende di ogni dimensione. Semplifica la tua flotta con prezzi trasparenti e supporto dedicato.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Soluzioni</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/offers" className="hover:text-electric transition-colors duration-200">Offerte Business</Link></li>
              <li><Link to="/fleet" className="hover:text-electric transition-colors duration-200">Soluzioni Flotta</Link></li>
              <li><Link to="/green" className="hover:text-electric transition-colors duration-200">Mobilità Green</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Azienda</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/contact" className="hover:text-electric transition-colors duration-200">Contattaci</Link></li>
              <li><Link to="/careers" className="hover:text-electric transition-colors duration-200">Diventa Partner</Link></li>
              <li><Link to="/accedi" className="hover:text-electric transition-colors duration-200">Area Clienti</Link></li>
              <li><Link to="/partner/accedi" className="hover:text-electric transition-colors duration-200">Area Partners</Link></li>
              <li><Link to="/privacy" className="hover:text-electric transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/termini" className="hover:text-electric transition-colors duration-200">Termini e Condizioni</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contatti</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-electric" />
                <a href="mailto:offerte@nolosubito.it" className="hover:text-electric transition-colors duration-200">offerte@nolosubito.it</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-electric" />
                <span>+39 02 1234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-electric" />
                <span>Milano, Italia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Nolosubito. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-white/40">
            P.IVA: IT12345678901
          </p>
        </div>
      </div>
    </footer>
  );
}