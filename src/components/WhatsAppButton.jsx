import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

const WA_NUMBER = "390212345678"; // sostituire con numero reale
const WA_MESSAGE = "Ciao! Sono interessato al noleggio a lungo termine. Potete aiutarmi?";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Mostra il tooltip dopo 5 secondi dalla prima visita
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setShowTooltip(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleClick = () => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowTooltip(false);
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !dismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl shadow-2xl border border-border/50 p-4 max-w-[220px] sm:max-w-[240px] relative"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm font-semibold text-foreground pr-4">
              Hai domande sul NLT?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Scrivici su WhatsApp, ti rispondiamo subito!
            </p>
            {/* Triangle */}
            <div className="absolute -bottom-2 right-6 w-4 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white border-r border-b border-border/50 rotate-45 translate-y-[-50%] translate-x-[2px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => {}}
        className="w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/30 flex items-center justify-center cursor-pointer relative"
        aria-label="Contattaci su WhatsApp"
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </motion.button>
    </div>
  );
}
