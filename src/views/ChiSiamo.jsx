"use client";

import React, { useState } from "react";
import { ArrowRight, Phone, MessageCircle, Mail } from "lucide-react";
import Link from "@/lib/AppLink";

const STORAGE = "https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/object/public/vehicle-images";

// Veicoli del catalogo Nolosubito (foto di catalogo su fondo bianco)
const HERO_VEHICLES = [
  { src: `${STORAGE}/hyundai/tucson.jpg`, alt: "Hyundai Tucson" },
  { src: `${STORAGE}/fiat/500.jpg`, alt: "Fiat 500" },
  { src: `${STORAGE}/kia/ev3.png`, alt: "Kia EV3" },
];

const SEGMENTS = [
  {
    value: "privati",
    label: "Privati",
    text: "Ti accompagniamo nella scelta del veicolo e della formula più adatta a te, con un canone mensile chiaro dall'inizio alla fine del contratto.",
    points: ["Canone mensile fisso, IVA inclusa", "Kasko e manutenzione incluse", "Oltre 130 modelli, molti in pronta consegna"],
    cta: { to: "/private-offers", label: "Vedi le offerte per privati" },
  },
  {
    value: "aziende",
    label: "Aziende e P.IVA",
    text: "Per imprese e partite IVA organizziamo il noleggio di auto, veicoli commerciali e flotte, aiutandoti a ottimizzare la gestione dei veicoli e a semplificare ogni fase.",
    points: ["Prezzi a IVA esclusa", "Auto, veicoli commerciali e flotte", "Supporto dalla scelta alla gestione dei veicoli"],
    cta: { to: "/offers", label: "Vedi le offerte per aziende" },
  },
];

const PARTNERS = ["Leasys", "Santander", "Ayvens", "Drivalia", "Clickar"];

const BRANCHES = ["Napoli", "Roma", "Pozzuoli", "Viterbo", "Avellino Est"];

// Stessi recapiti del sito e delle mail: WhatsApp sul cellulare, chiamata sul fisso
const CONTACTS = [
  { icon: Phone, label: "Telefono", value: "06 4004 9490", href: "tel:+390640049490" },
  { icon: MessageCircle, label: "WhatsApp", value: "345 430 0936", href: "https://wa.me/393454300936", external: true },
  { icon: Mail, label: "Email", value: "info@nolosubito.it", href: "mailto:info@nolosubito.it" },
];

const btnPrimary = "inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-xl px-6 py-3.5 transition-colors duration-200";

function SegmentSection() {
  const [active, setActive] = useState("privati");
  const current = SEGMENTS.find((s) => s.value === active);

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-5 reveal">
          <h2 className="font-heading font-bold text-[1.75rem] sm:text-4xl text-navy-dark leading-[1.1] text-balance">
            Consulenza su misura, per ogni esigenza
          </h2>
          <div role="tablist" aria-label="Scegli il tipo di cliente" className="mt-8 inline-flex p-1.5 rounded-2xl bg-surface">
            {SEGMENTS.map((s) => (
              <button
                key={s.value}
                role="tab"
                id={`tab-${s.value}`}
                aria-selected={active === s.value}
                aria-controls={`panel-${s.value}`}
                onClick={() => setActive(s.value)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 ${
                  active === s.value ? "bg-navy text-white" : "text-[#464651] hover:text-navy"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`panel-${current.value}`}
          aria-labelledby={`tab-${current.value}`}
          key={current.value}
          className="lg:col-span-7 bg-surface rounded-3xl p-7 sm:p-10 reveal reveal-late"
        >
          <p className="text-2xl text-navy-dark leading-snug font-medium">{current.text}</p>
          <ul className="mt-8 space-y-3">
            {current.points.map((point) => (
              <li key={point} className="text-xl font-semibold text-[#464651]">{point}</li>
            ))}
          </ul>
          <Link to={current.cta.to} className="mt-9 inline-flex items-center gap-2 font-bold text-navy hover:text-navy-dark group">
            {current.cta.label}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ChiSiamo() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 lg:pb-28">
        <h1 className="font-heading font-bold text-[clamp(1.75rem,6.2vw,6rem)] text-navy leading-[1.02] tracking-tight text-balance">
          Il partner del noleggio a lungo termine
        </h1>
        <div className="mt-8 lg:mt-12 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-5">
            <p className="text-xl text-[#464651] leading-relaxed">
              Nolosubito è il partner ideale per il noleggio a lungo termine e la gestione della mobilità aziendale.
              Supportiamo privati e imprese con consulenze personalizzate e soluzioni su misura, per semplificare ogni fase del noleggio.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link to="/contact" className={btnPrimary}>
                Richiedi una consulenza
                <ArrowRight className="size-4" />
              </Link>
              <Link to="/offers" className="font-bold text-navy hover:text-navy-dark underline underline-offset-4 decoration-2 decoration-[#71BAED]">
                Vedi le offerte
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10">
            <img
              src={HERO_VEHICLES[0].src}
              alt={HERO_VEHICLES[0].alt}
              width={800}
              height={400}
              fetchPriority="high"
              className="w-full h-auto"
            />
            <div className="grid grid-cols-2 gap-6 mt-2">
              {HERO_VEHICLES.slice(1).map((v) => (
                <img key={v.src} src={v.src} alt={v.alt} width={800} height={400} loading="lazy" className="w-full h-auto" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Consulenza per privati e aziende */}
      <SegmentSection />

      {/* Clickar Point */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="bg-navy text-white rounded-3xl p-7 sm:p-12 lg:p-16 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 reveal">
            <h2 className="font-heading font-bold text-[1.75rem] sm:text-4xl leading-[1.1] text-balance">
              Siamo anche Clickar Point
            </h2>
            <p className="mt-6 text-xl text-white/85 leading-relaxed">
              Siamo specializzati nella vendita di veicoli usati provenienti da flotte aziendali e da privati.
              Ogni vettura viene sottoposta a un rigoroso processo di selezione e a controlli accurati,
              per garantire standard qualitativi adeguati alla vendita.
            </p>
            <Link to="/usato" className="mt-9 inline-flex items-center gap-2 bg-[#71BAED] hover:bg-[#8cc8f1] text-navy-dark font-bold rounded-xl px-6 py-3.5 transition-colors duration-200 group">
              Scopri l'usato
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="lg:col-span-6 grid gap-4 reveal reveal-late">
            {[
              ["Da flotte e da privati", "Veicoli usati provenienti da flotte aziendali e da clienti privati."],
              ["Selezione rigorosa", "Ogni vettura passa un processo di selezione prima di essere proposta."],
              ["Controlli accurati", "Verifiche per garantire standard qualitativi adeguati alla vendita."],
            ].map(([title, text]) => (
              <div key={title} className="bg-white/10 rounded-2xl p-6">
                <h3 className="font-heading font-bold text-2xl">{title}</h3>
                <p className="mt-1.5 text-white/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-28 reveal">
          <h2 className="font-heading font-bold text-[1.75rem] sm:text-4xl text-navy-dark leading-[1.1] text-balance">
            I nostri partner
          </h2>
          <p className="mt-6 text-xl text-[#464651] leading-relaxed">
            Grazie alla nostra esperienza e alla collaborazione con partner qualificati accompagniamo ogni cliente
            nella scelta della soluzione più adatta alle proprie esigenze.
          </p>
        </div>
        <ul className="lg:col-span-7 reveal reveal-late" aria-label="Partner di Nolosubito">
          {PARTNERS.map((name) => (
            <li
              key={name}
              className="font-heading font-bold leading-[1.02] tracking-tight text-[clamp(2.75rem,10vw,6.5rem)] text-navy"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      {/* Sede e filiali */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5 reveal">
            <h2 className="font-heading font-bold text-[1.75rem] sm:text-4xl text-navy-dark leading-[1.1] text-balance">
              In tutta Italia, con sede a Napoli
            </h2>
            <address className="mt-6 not-italic text-xl text-[#464651] leading-relaxed">
              Via Nuova Poggioreale, 60L<br />
              Centro Polifunzionale INAIL, Torre 7<br />
              80143 Napoli
            </address>
            <p className="mt-6 text-xl text-[#464651] leading-relaxed">
              Le nostre filiali: <span className="font-semibold text-navy-dark">{BRANCHES.join(", ")}</span>.
            </p>
            <Link to="/contact" className="mt-8 inline-flex items-center gap-2 font-bold text-navy hover:text-navy-dark group">
              Sedi e contatti
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <figure className="lg:col-span-7 reveal reveal-late">
            <img
              src="/images/napoli-catel.webp"
              alt="Dipinto del Golfo di Napoli con il Vesuvio visto da Posillipo"
              width={1600}
              height={1058}
              loading="lazy"
              className="w-full h-auto rounded-3xl"
            />
            <figcaption className="mt-3 text-sm text-[#777682]">
              Franz Ludwig Catel, Napoli, Sant'Antonio a Posillipo, 1818-1820 circa. Pubblico dominio, via Wikimedia Commons.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Chiusura */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-7 reveal">
          <h2 className="font-heading font-bold text-[1.75rem] sm:text-4xl text-navy leading-[1.1] text-balance">
            Parliamone insieme
          </h2>
          <p className="mt-6 text-xl text-[#464651] leading-relaxed max-w-xl">
            Al centro del nostro lavoro ci sono affidabilità, competenza e attenzione al cliente.
          </p>
          <Link to="/contact" className={`${btnPrimary} mt-9`}>
            Richiedi una consulenza
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="lg:col-span-5 bg-white rounded-3xl p-3 sm:p-4 reveal reveal-late">
          {CONTACTS.map(({ icon: Icon, label, value, href, external }) => (
            <li key={label}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-4 rounded-2xl p-4 sm:p-5 hover:bg-surface transition-colors duration-200"
              >
                <Icon className="size-6 text-navy shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm text-[#777682]">{label}</span>
                  <span className="block text-xl font-heading font-bold text-navy-dark break-words">{value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
