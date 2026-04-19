import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import LeadForm from "../components/lead/LeadForm";

const contactInfo = [
  { icon: Mail, label: "Email", value: "offerte@nolosubito.it", href: "mailto:offerte@nolosubito.it" },
  { icon: Phone, label: "Telefono", value: "+39 02 1234 5678", href: "tel:+390212345678" },
  { icon: MapPin, label: "Indirizzo", value: "Via della Mobilità 42, 20121 Milano" },
  { icon: Clock, label: "Orari", value: "Lun–Ven: 9:00–18:00" },
];

export default function Contact() {
  return (
    <div className="bg-navy">
      <div className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">
            Contattaci
          </h1>
          <p className="mt-3 text-white/50 max-w-xl mx-auto text-lg">
            Pronto a ottimizzare la mobilità della tua azienda? Costruiamo insieme la flotta perfetta.
          </p>
        </motion.div>
      </div>

      <div className="bg-background rounded-t-3xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-heading font-bold text-xl text-foreground">Informazioni di Contatto</h2>
              {contactInfo.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-electric" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="text-sm font-medium text-foreground hover:text-electric transition-colors duration-200">
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8">
                <h2 className="font-heading font-bold text-xl text-foreground mb-1">Richiedi un'Offerta Business</h2>
                <p className="text-sm text-muted-foreground mb-6">Ti risponderemo entro 24 ore con un preventivo personalizzato.</p>
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}