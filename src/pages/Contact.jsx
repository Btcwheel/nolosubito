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
    <div className="bg-surface min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-xs font-bold text-electric uppercase tracking-widest mb-2">Nolosubito</p>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-navy">Contattaci</h1>
            <p className="mt-2 text-gray-500 max-w-xl">
              Pronto a ottimizzare la mobilità della tua azienda? Costruiamo insieme la flotta perfetta.
            </p>
          </motion.div>
        </div>
      </div>

      <div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-heading font-bold text-xl text-navy">Informazioni di Contatto</h2>
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
              <div className="bg-white rounded-2xl border border-frame shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)] p-6 sm:p-8">
                <h2 className="font-heading font-bold text-xl text-navy mb-1">Richiedi un'Offerta Business</h2>
                <p className="text-sm text-muted-foreground mb-6">Ti risponderemo entro 24 ore con un preventivo personalizzato.</p>
                <LeadForm />
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric mb-2">
                  Rete territoriale
                </p>
                <h2 className="font-heading font-bold text-2xl text-navy">
                  Le nostre filiali
                </h2>
              </div>
              <p className="hidden sm:block text-sm text-muted-foreground max-w-xl text-right">
                Un riferimento unico per il noleggio, con sedi operative distribuite tra Napoli, Roma, Viterbo e Avellino.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {offices.map((office) => (
                <div key={office.name} className="bg-white border border-frame rounded-2xl p-5 shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-electric" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-lg text-navy-dark">
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
                            className="block text-sm font-medium text-foreground hover:text-electric transition-colors"
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
