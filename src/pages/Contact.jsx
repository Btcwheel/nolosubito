import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import LeadForm from "../components/lead/LeadForm";

const contactInfo = [
  { icon: Mail, label: "Email", value: "info@nolosubito.it", href: "mailto:info@nolosubito.it" },
  { icon: Phone, label: "Telefono", value: "+39 06 40 049 490", href: "tel:+390640049490" },
  { icon: MapPin, label: "Indirizzo", value: "Presenza su tutto il territorio nazionale" },
  { icon: Clock, label: "Orari", value: "Lun–Ven: 9:00–18:00" },
];

const offices = [
  {
    name: "Filiale Napoli",
    lines: ["Via Nuova Poggioreale, 60L", "Centro Polifunzionale INAIL, Torre 7", "80143 Napoli"],
    phones: ["+39 06 40 049 490", "+39 345 430 0936"],
  },
  {
    name: "Filiale Roma",
    lines: ["Via degli Archivi di Stato, 15", "00143 Roma"],
    phones: ["+39 06 40 049 490", "+39 345 430 0936"],
  },
  {
    name: "Filiale Napoli / Agnano",
    lines: ["Via Eduardo Scarfoglio, 6H", "80125 Napoli"],
    phones: ["+39 081 218 9702", "+39 334 353 1333"],
  },
  {
    name: "Filiale Viterbo",
    lines: ["Strada Tuscanese km 4.400", "01100 Viterbo"],
    phones: ["+39 393 218 7236", "+39 324 863 8552"],
  },
  {
    name: "Filiale Avellino Est",
    lines: ["Via Tavernole, 40", "83030 Montecalzati"],
    phones: ["+39 06 40 049 490", "+39 345 430 0936"],
  },
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
                  <div className="w-10 h-10 rounded-lg bg-[#71BAED]/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-[#71BAED]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="text-sm font-medium text-foreground hover:text-[#71BAED] transition-colors duration-200">
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-3">
                  Dove siamo
                </p>
                <p className="text-sm text-muted-foreground leading-7">
                  Siamo presenti in tutta Italia, con una rete di consulenti commerciali dislocata su tutto il territorio nazionale.
                </p>
              </div>
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

          <div className="mt-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#71BAED] mb-2">
                  Rete territoriale
                </p>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  Le nostre filiali
                </h2>
              </div>
              <p className="hidden sm:block text-sm text-muted-foreground max-w-xl text-right">
                Un riferimento unico per il noleggio, con sedi operative distribuite tra Napoli, Roma, Viterbo e Avellino.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {offices.map((office) => (
                <div key={office.name} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#71BAED]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#71BAED]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-lg text-foreground">
                        {office.name}
                      </h3>
                      <address className="not-italic mt-2 text-sm text-muted-foreground leading-6">
                        {office.lines.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </address>
                      <div className="mt-4 space-y-1">
                        {office.phones.map((phone) => (
                          <a
                            key={phone}
                            href={`tel:${phone.replace(/\s+/g, "")}`}
                            className="block text-sm font-medium text-foreground hover:text-[#71BAED] transition-colors"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
