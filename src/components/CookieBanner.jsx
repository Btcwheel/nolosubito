import React, { useEffect, useState } from "react";
import { LazyMotion, m, domAnimation, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie, X, Check, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "nolosubito_cookie_consent";

function readStoredConsent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function applyConsent(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, date: new Date().toISOString() }));
  window.__updateConsent?.(prefs);
}

async function logConsent(prefs) {
  try {
    await supabase.from("cookie_consents").insert({
      consent: { necessary: true, analytics: prefs.analytics, marketing: prefs.marketing },
      user_agent: navigator.userAgent,
      page: window.location.pathname,
    });
  } catch {
    // il log è best-effort: un fallimento di rete non deve bloccare il banner
  }
}

const CATEGORIES = [
  {
    key: "necessary",
    name: "Necessari",
    desc: "Essenziali per il funzionamento del sito. Non possono essere disabilitati.",
    locked: true,
  },
  {
    key: "analytics",
    name: "Analitici",
    desc: "Ci aiutano a capire come viene usato il sito (dati aggregati e anonimi).",
    locked: false,
  },
  {
    key: "marketing",
    name: "Marketing",
    desc: "Utilizzati per mostrare contenuti pertinenti ai tuoi interessi.",
    locked: false,
  },
];

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !readStoredConsent());
  const [showDetail, setShowDetail] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    const stored = readStoredConsent();
    return { analytics: stored?.analytics ?? false, marketing: stored?.marketing ?? false };
  });

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) window.__updateConsent?.(stored);

    const reopen = () => {
      setShowDetail(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-preferences", reopen);
    return () => window.removeEventListener("open-cookie-preferences", reopen);
  }, []);

  const confirm = (next) => {
    applyConsent(next);
    logConsent(next);
    setPrefs({ analytics: next.analytics, marketing: next.marketing });
    setVisible(false);
    setShowDetail(false);
  };

  const acceptAll = () => confirm({ analytics: true, marketing: true });
  const acceptNecessaryOnly = () => confirm({ analytics: false, marketing: false });
  const savePreferences = () => confirm(prefs);

  const toggle = (key) => {
    if (key === "necessary") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {visible && (
          <m.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 z-[200] p-3 sm:p-4 md:p-6"
            style={{ bottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="mx-auto bg-navy border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden w-full sm:max-w-4xl">
              {!showDetail ? (
                /* ── Vista compatta ── */
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="size-9 rounded-xl bg-electric/15 flex items-center justify-center shrink-0">
                      <Cookie className="size-4.5 text-electric" />
                    </div>
                  </div>

                  <p className="text-sm text-white/70 flex-1 leading-relaxed">
                    Utilizziamo i cookie per migliorare la tua esperienza e analizzare il traffico.{" "}
                    <Link to="/privacy" className="text-electric underline hover:text-electric/85">
                      Leggi la Privacy Policy
                    </Link>
                    .
                  </p>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setShowDetail(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/75 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                    >
                      <Settings className="size-3.5" />
                      Gestisci
                    </button>
                    <button
                      type="button"
                      onClick={acceptNecessaryOnly}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer"
                    >
                      Rifiuta tutti
                    </button>
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-electric hover:bg-electric/90 text-[#0f0f23] transition-all cursor-pointer"
                    >
                      <Check className="size-3.5" />
                      Accetta tutti
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Vista dettaglio ── */
                <div className="px-4 sm:px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white text-sm">Preferenze cookie</h3>
                    <button
                      type="button"
                      onClick={() => setShowDetail(false)}
                      className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    {CATEGORIES.map(({ key, name, desc, locked }) => {
                      const on = locked || prefs[key];
                      return (
                        <div key={key} className="flex items-start justify-between gap-4 bg-white/5 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{name}</p>
                            <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggle(key)}
                            aria-pressed={on}
                            aria-label={`Attiva/disattiva cookie ${name}`}
                            className={`w-10 h-5 rounded-full shrink-0 mt-0.5 flex items-center px-0.5 transition-colors ${
                              locked ? "bg-electric/50 cursor-not-allowed" : on ? "bg-electric cursor-pointer" : "bg-white/15 cursor-pointer"
                            }`}
                          >
                            <div className={`size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={acceptNecessaryOnly}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer"
                    >
                      Rifiuta tutti
                    </button>
                    <button
                      type="button"
                      onClick={savePreferences}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white/80 border border-white/15 hover:border-white/30 hover:text-white transition-all cursor-pointer"
                    >
                      Salva preferenze
                    </button>
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-electric hover:bg-electric/90 text-[#0f0f23] transition-all cursor-pointer"
                    >
                      <Check className="size-3.5" />
                      Accetta tutti
                    </button>
                  </div>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
