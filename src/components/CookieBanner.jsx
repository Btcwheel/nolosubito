import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie, X, Check, Settings } from "lucide-react";

const STORAGE_KEY = "nolosubito_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const accept = (all = true) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      necessary: true,
      analytics: all,
      marketing: all,
      date: new Date().toISOString(),
    }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {!showDetail ? (
              /* ── Vista compatta ── */
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-[#71BAED]/15 flex items-center justify-center shrink-0">
                    <Cookie className="w-4.5 h-4.5 text-[#71BAED]" />
                  </div>
                </div>

                <p className="text-sm text-white/70 flex-1 leading-relaxed">
                  Utilizziamo i cookie per migliorare la tua esperienza e analizzare il traffico.{" "}
                  <Link to="/privacy" className="text-[#71BAED] hover:underline">
                    Leggi la Privacy Policy
                  </Link>
                  .
                </p>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setShowDetail(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Gestisci
                  </button>
                  <button
                    onClick={() => accept(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 border border-white/15 hover:border-white/30 hover:text-white transition-all cursor-pointer"
                  >
                    Solo necessari
                  </button>
                  <button
                    onClick={() => accept(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#71BAED] hover:bg-[#71BAED]/90 text-white transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accetta tutti
                  </button>
                </div>
              </div>
            ) : (
              /* ── Vista dettaglio ── */
              <div className="px-5 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm">Preferenze cookie</h3>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    {
                      name: "Necessari",
                      desc: "Essenziali per il funzionamento del sito. Non possono essere disabilitati.",
                      locked: true,
                    },
                    {
                      name: "Analitici",
                      desc: "Ci aiutano a capire come viene usato il sito (dati aggregati e anonimi).",
                      locked: false,
                    },
                    {
                      name: "Marketing",
                      desc: "Utilizzati per mostrare contenuti pertinenti ai tuoi interessi.",
                      locked: false,
                    },
                  ].map(({ name, desc, locked }) => (
                    <div key={name} className="flex items-start justify-between gap-4 bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full shrink-0 mt-0.5 flex items-center px-0.5 ${locked ? "style={{backgroundColor:'#71BAED'}}/50 cursor-not-allowed" : "style={{backgroundColor:'#71BAED'}} cursor-pointer"}`}>
                        <div className="w-4 h-4 rounded-full bg-white shadow translate-x-5" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => accept(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 border border-white/15 hover:border-white/30 hover:text-white transition-all cursor-pointer"
                  >
                    Solo necessari
                  </button>
                  <button
                    onClick={() => accept(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#71BAED] hover:bg-[#71BAED]/90 text-white transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accetta tutti
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
