import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Settings, Shield, ArrowRight, Building2, Truck, Package, Wrench, Zap } from "lucide-react";

const features = [
  { icon: Users, title: "Flotte di Ogni Dimensione", desc: "Da 5 a 500+ veicoli, cresciamo insieme alle esigenze della tua azienda." },
  { icon: BarChart3, title: "Analytics di Flotta", desc: "Dashboard in tempo reale per monitorare costi, utilizzo e opportunità di ottimizzazione." },
  { icon: Settings, title: "Configurazione Personalizzata", desc: "Combina veicoli, durate e chilometraggi diversi all'interno della tua flotta." },
  { icon: Shield, title: "Gestione del Rischio Completa", desc: "Assicurazione completa, manutenzione e veicolo sostitutivo garantiti." },
];

const tiers = [
  { name: "Starter", vehicles: "5–15", features: ["Account manager dedicato", "Selezione veicoli standard", "Report mensile"], highlight: false },
  { name: "Business", vehicles: "15–50", features: ["Consegna prioritaria", "Gamma veicoli estesa", "Revisione flotta trimestrale", "Integrazione API"], highlight: true },
  { name: "Enterprise", vehicles: "50+", features: ["SLA personalizzato", "Personalizzazione completa", "Analytics in tempo reale", "Fleet manager on-site"], highlight: false },
];

export default function FleetSolutions() {
  return (
    <div className="bg-navy">
      {/* Hero */}
      <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6">
            <Building2 className="w-4 h-4 text-electric" />
            <span className="text-sm text-white/70">Gestione Flotte Aziendali</span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white max-w-3xl mx-auto">
            Scala la Tua Flotta Senza <span className="text-electric">Complicazioni</span>
          </h1>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto text-lg">
            Gestione completa della flotta per aziende in crescita. Un partner, una fattura, zero pensieri.
          </p>
        </motion.div>
      </div>

      <div className="bg-background rounded-t-3xl">
        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="p-6 bg-card rounded-2xl border border-border/50"
              >
                <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-electric" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Veicoli Commerciali */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-navy rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Text side */}
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 mb-6 w-fit">
                  <Truck className="w-4 h-4 text-electric" />
                  <span className="text-xs text-white/70 font-medium">Veicoli Commerciali</span>
                </div>
                <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
                  Furgoni e Van per il <span className="text-electric">Tuo Business</span>
                </h2>
                <p className="text-white/60 text-base leading-relaxed mb-8">
                  Dalla consegna dell'ultimo miglio alla logistica aziendale: noleggiamo furgoni, van cargo e veicoli commerciali leggeri con manutenzione e assicurazione già incluse nel canone.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Package, label: "Van Cargo", desc: "Trasporto merci fino a 1.200 kg" },
                    { icon: Truck, label: "Furgoni Medi", desc: "3,5t — ideali per artigiani" },
                    { icon: Zap, label: "Elettrici Comm.", desc: "Zero emissioni, ZTL libera" },
                    { icon: Wrench, label: "Allestimenti", desc: "Frigo, sponda, officina mobile" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-electric" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{item.label}</p>
                        <p className="text-white/50 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/contact">
                  <Button className="bg-electric hover:bg-electric/90 text-white font-semibold cursor-pointer w-fit">
                    Richiedi Preventivo Commerciali <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              {/* Image side */}
              <div className="relative min-h-64 lg:min-h-0">
                <img
                  src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=900&q=80&auto=format&fit=crop"
                  alt="Furgoni commerciali"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent lg:from-transparent lg:to-navy/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10">
            Piani Flotta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className={`rounded-2xl p-6 border ${
                  tier.highlight
                    ? "bg-navy text-white border-electric shadow-xl shadow-electric/10"
                    : "bg-card border-border/50"
                }`}
              >
                <h3 className="font-heading font-bold text-xl">{tier.name}</h3>
                <p className={`text-sm mt-1 ${tier.highlight ? "text-white/60" : "text-muted-foreground"}`}>
                  {tier.vehicles} veicoli
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map(f => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${tier.highlight ? "text-white/80" : "text-foreground"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${tier.highlight ? "bg-electric" : "bg-electric"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="block mt-6">
                  <Button
                    className={`w-full cursor-pointer ${
                      tier.highlight
                        ? "bg-electric hover:bg-electric/90 text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Richiedi Preventivo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}