import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, LayoutDashboard, ClipboardList, FileText, Users, Layers, FolderOpen, Car, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_CONFIG = {
  admin: {
    title: "Benvenuto nell'Admin Panel",
    subtitle: "Ecco cosa puoi fare da qui",
    color: "bg-purple-500/10 border-purple-500/20 text-purple-600",
    dot: "bg-purple-500",
    steps: [
      { icon: LayoutDashboard, title: "Dashboard", desc: "Panoramica KPI, pratiche e lead in tempo reale." },
      { icon: Users,           title: "Lead",       desc: "Gestisci le richieste in entrata e convertile in pratiche." },
      { icon: Layers,          title: "CMS",        desc: "Aggiorna veicoli, prezzi, news e materiali per gli agenti." },
    ],
  },
  backoffice: {
    title: "Benvenuto in Backoffice",
    subtitle: "Il tuo spazio di lavoro operativo",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    dot: "bg-blue-500",
    steps: [
      { icon: ClipboardList, title: "Pratiche",           desc: "Visualizza, filtra e aggiorna tutte le pratiche Noleggio Lungo Termine." },
      { icon: FileText,      title: "Documenti",          desc: "Verifica i documenti caricati dai clienti." },
      { icon: CheckCircle2,  title: "Stato pratiche",     desc: "Aggiorna lo stato e lascia note interne o per il cliente." },
    ],
  },
  agente: {
    title: "Benvenuto nel Portale Partner",
    subtitle: "Tutto quello che ti serve per vendere",
    color: "bg-electric/10 border-electric/20 text-electric",
    dot: "bg-electric",
    steps: [
      { icon: ClipboardList, title: "Le mie pratiche",    desc: "Segui l'avanzamento di ogni trattativa in corso." },
      { icon: FolderOpen,    title: "Materiali",           desc: "Accedi a brochure, listini e offerte riservate ai partner." },
      { icon: CheckCircle2,  title: "Pipeline visiva",     desc: "Visualizza le pratiche per stato con la vista Kanban." },
    ],
  },
  cliente: {
    title: "Benvenuto nella tua area",
    subtitle: "Segui la tua pratica passo dopo passo",
    color: "bg-green-500/10 border-green-500/20 text-green-600",
    dot: "bg-green-500",
    steps: [
      { icon: Car,       title: "La tua pratica",     desc: "Monitora lo stato della tua richiesta di noleggio." },
      { icon: FileText,  title: "Carica documenti",   desc: "Invia i documenti richiesti direttamente da qui." },
      { icon: Bell,      title: "Aggiornamenti",      desc: "Il team ti aggiornerà su ogni avanzamento." },
    ],
  },
};

export default function OnboardingWelcome({ profile }) {
  const [visible, setVisible] = useState(false);

  const role = profile?.role ?? "cliente";
  const storageKey = `onboarding_seen_${profile?.id}_${role}`;

  useEffect(() => {
    if (!profile?.id) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) setVisible(true);
  }, [profile?.id]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  };

  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.cliente;
  const name = profile?.full_name?.split(" ")[0] || "utente";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-md p-8 pointer-events-auto relative">

              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="mb-7">
                <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border mb-4 ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground leading-tight">
                  {cfg.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1.5">
                  Ciao <span className="font-semibold text-foreground capitalize">{name}</span> — {cfg.subtitle}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4 mb-8">
                {cfg.steps.map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">{title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={dismiss}
                className="w-full h-11 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl cursor-pointer"
              >
                Inizia →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
