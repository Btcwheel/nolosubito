import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Percent, Wrench, Clock, FileText, Headphones } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Tutto Incluso", desc: "Assicurazione, manutenzione, soccorso stradale e tasse — tutto in un unico canone mensile." },
  { icon: Percent, title: "Vantaggi Fiscali", desc: "Deducibilità IVA completa per P.IVA. Fino al 70% di deducibilità per veicoli aziendali." },
  { icon: Wrench, title: "Zero Pensieri", desc: "Gestiamo tagliandi, cambio gomme e sostituzione del veicolo. Tu guidi e basta." },
  { icon: Clock, title: "Consegna Rapida", desc: "Preventivo personalizzato in 24h. Consegna del veicolo in 2–4 settimane." },
  { icon: FileText, title: "Prezzi Trasparenti", desc: "Nessun costo nascosto. Il prezzo che vedi è quello che paghi, ogni mese." },
  { icon: Headphones, title: "Supporto Dedicato", desc: "Un fleet manager personale assegnato alla tua azienda fin dal primo giorno." },
];

export default function WhySection() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
            Perché Scegliere NoloSubito
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Abbiamo costruito l'esperienza di noleggio B2B più semplice e trasparente d'Italia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group p-6 bg-card rounded-2xl border border-border/50 hover:border-electric/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center mb-4 group-hover:bg-electric/20 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-electric" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}