import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const STATS = [
  { value: "500+",  label: "Contratti attivi",       sub: "in tutta Italia" },
  { value: "98%",   label: "Clienti soddisfatti",    sub: "tasso di rinnovo" },
  { value: "24h",   label: "Risposta garantita",     sub: "preventivo personalizzato" },
  { value: "€0",    label: "Costi nascosti",         sub: "tutto incluso nel canone" },
];

const TESTIMONIALS = [
  {
    name: "Marco Ferretti",
    role: "Titolare P.IVA — Milano",
    text: "Ho noleggiato la mia prima auto con NoloSubito e non potevo essere più soddisfatto. Il processo è stato semplice, trasparente e il canone include davvero tutto. Nessuna sorpresa.",
    stars: 5,
  },
  {
    name: "Laura Conti",
    role: "Fleet Manager — Roma",
    text: "Gestiamo una flotta di 30 veicoli con NoloSubito. Il team è professionale, i prezzi competitivi e la piattaforma ci permette di monitorare ogni pratica in tempo reale.",
    stars: 5,
  },
  {
    name: "Giuseppe Russo",
    role: "Amministratore S.r.l. — Napoli",
    text: "I vantaggi fiscali per la nostra azienda sono stati enormi. Grazie al NLT abbiamo ottimizzato i costi della flotta del 30% rispetto al leasing tradizionale.",
    stars: 5,
  },
];

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array(count).fill(0).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="py-20 sm:py-28 bg-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-20">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
                {stat.value}
              </p>
              <p className="text-white font-semibold mt-1 text-sm sm:text-base">{stat.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <p className="text-electric text-sm font-bold uppercase tracking-widest mb-2">Recensioni</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Cosa dicono i nostri clienti
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-colors duration-300"
            >
              <Quote className="w-8 h-8 text-electric/40 mb-4" />
              <p className="text-white/70 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{t.role}</p>
                </div>
                <StarRating count={t.stars} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
