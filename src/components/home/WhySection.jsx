import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Percent, Wrench, Clock, FileText, Headphones } from "lucide-react";

const PRIMARY = {
  icon: ShieldCheck,
  title: "Tutto Incluso",
  desc: "Assicurazione, manutenzione ordinaria e straordinaria, soccorso stradale, tasse di proprietà e bollo — tutto in un unico canone mensile fisso. Nessuna sorpresa.",
};

const SECONDARY = [
  { icon: Percent,     title: "Vantaggi Fiscali",   desc: "Deducibilità IVA completa per P.IVA. Fino al 70% per veicoli aziendali." },
  { icon: Wrench,      title: "Zero Pensieri",      desc: "Tagliandi, gomme, sostituzione veicolo: ci pensiamo noi." },
  { icon: Clock,       title: "Consegna Rapida",    desc: "Preventivo in 24h. Veicolo in 2–4 settimane." },
  { icon: FileText,    title: "Prezzi Trasparenti", desc: "Il prezzo che vedi è quello che paghi, ogni mese." },
  { icon: Headphones,  title: "Supporto Dedicato",  desc: "Un fleet manager personale fin dal primo giorno." },
];

export default function WhySection() {
  return (
    <section className="py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-16">
          <p className="text-electric text-xs font-bold uppercase tracking-widest mb-3">
            Perché Nolosubito
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground max-w-lg">
            L'esperienza Noleggio Lungo Termine più semplice d'Italia
          </h2>
        </div>

        {/* Layout asimmetrico */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Card primaria — occupa 2 colonne */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 flex flex-col justify-between bg-[#2D2E82] rounded-2xl p-8 sm:p-10 min-h-[280px]"
          >
            <PRIMARY.icon className="w-10 h-10 text-electric" />
            <div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">{PRIMARY.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{PRIMARY.desc}</p>
            </div>
          </motion.div>

          {/* Griglia secondaria — 3 colonne × 2 righe */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SECONDARY.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex flex-col gap-4 bg-card border border-border/50 rounded-xl p-5"
              >
                <f.icon className="w-5 h-5 text-electric" />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
