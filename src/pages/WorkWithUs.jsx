import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CheckCircle, TrendingUp, Users, ShieldCheck, BookOpen,
  FileText, BarChart2, Bell, Car, ChevronRight, Star, Award, Zap,
  ArrowRight, Building2, UserCheck, HandshakeIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PartnerApplicationForm from "@/components/careers/PartnerApplicationForm";
import DashboardPreview from "@/components/careers/DashboardPreview";

const benefits = [
  { icon: Award, title: "Mandati con i Top Player Noleggio a lungo termine", desc: "Accedi ai contratti con le migliori società di noleggio a lungo termine del mercato:  Leasys, Ayvens, Drivalia e Santander e altre." },
  { icon: BookOpen, title: "Formazione Completa", desc: "Percorso di formazione professionale su prodotti, normative fiscali, tecniche di vendita e gestione del cliente." },
  { icon: FileText, title: "Gestione Pratiche Digitale", desc: "Area riservata con tutti gli strumenti per gestire preventivi, pratiche e contratti in modo semplice e veloce." },
  { icon: TrendingUp, title: "Commissioni Competitive", desc: "Struttura commissionale trasparente e vantaggiosa. Guadagni crescenti al crescere del tuo portafoglio clienti." },
  { icon: ShieldCheck, title: "Supporto Dedicato", desc: "Un account manager Nolosubito sempre a disposizione per supportarti nelle trattative e nelle pratiche più complesse." },
  { icon: Users, title: "Network di Professionisti", desc: "Entra in una community di agenti e consulenti Noleggio Lungo Termine. Condividi best practice e fai crescere il tuo business." },
];

const steps = [
  { num: "01", title: "Compila il Form", desc: "Inserisci i tuoi dati e il tuo profilo professionale. Ti ricontattiamo entro 48 ore." },
  { num: "02", title: "Colloquio Conoscitivo", desc: "Una call con il nostro team per capire le tue esigenze e presentarti le opportunità." },
  
  { num: "03", title: "Onboarding & Formazione", desc: "Attivazione dei mandati, accesso all'area riservata e percorso di formazione iniziale." },
  { num: "04", title: "Inizia a Guadagnare", desc: "Proponi le soluzioni Noleggio Lungo Termine ai tuoi clienti con tutto il supporto Nolosubito al tuo fianco." },
];

const testimonials = [
  { name: "Marco T.", role: "Agente Indipendente, Milano", text: "In 6 mesi ho chiuso 40 contratti Noleggio Lungo Termine grazie ai mandati e al supporto di Nolosubito. L'area riservata mi ha cambiato la vita.", rating: 5 },
  { name: "Silvia R.", role: "Titolare Agenzia Auto, Roma", desc: "Ho ampliato il mio business con il noleggio a lungo termine senza investire nulla. Nolosubito gestisce tutto.", text: "Ho ampliato il mio business con il noleggio a lungo termine senza investire nulla. Nolosubito gestisce tutto.", rating: 5 },
  { name: "Luca M.", role: "Consulente Aziendale, Torino", text: "La formazione è stata eccellente. Ora offro Noleggio Lungo Termine alle mie aziende clienti e genero revenue extra ogni mese.", rating: 5 },
];

export default function WorkWithUs() {
  const [showForm, setShowForm] = useState(false);
  const formSectionRef = React.useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="bg-[#2D2E82]">
      {/* Hero */}
      <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-electric/10 border border-electric/20 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-4 h-4 text-electric" />
              <span className="text-sm text-electric font-medium">Partner Program</span>
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white leading-tight">
              Entra nel Settore <span className="text-electric">Noleggio Lungo Termine</span> con Nolosubito
            </h1>
            <p className="mt-5 text-white/60 text-lg leading-relaxed">
              Sei un'agenzia, un consulente o una P.IVA? Diventa partner Nolosubito e accedi ai mandati con le migliori società di noleggio a lungo termine del mercato. Formazione, strumenti digitali e supporto costante.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {["Agenzie Auto", "Consulenti Aziendali", "Broker Assicurativi", "Agenti di Commercio"].map(tag => (
                <Badge key={tag} className="bg-white/5 border border-white/10 text-white/70 text-xs px-3 py-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={openForm}
                className="h-12 px-8 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl text-base cursor-pointer"
              >
                Diventa Partner <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 border-white/20 text-white hover:bg-white/5 rounded-xl text-base cursor-pointer"
              >
                Vedi l'Area Riservata
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { value: "15+", label: "Mandati attivi", sub: "Top società Noleggio Lungo Termine" },
              { value: "500+", label: "Partner attivi", sub: "In tutta Italia" },
              { value: "€3.200", label: "Commissione media", sub: "Per contratto chiuso" },
              { value: "48h", label: "Attivazione", sub: "Dall'iscrizione al primo mandato" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="font-heading font-bold text-3xl text-electric">{stat.value}</div>
                <div className="text-white font-semibold text-sm mt-1">{stat.label}</div>
                <div className="text-white/40 text-xs mt-0.5">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="bg-background rounded-t-3xl">

        {/* Benefits */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Tutto Quello che Ottieni
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Un ecosistema completo per avviare e far crescere il tuo business nel noleggio a lungo termine.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="group p-6 bg-card rounded-2xl border border-border/50 hover:border-electric/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center mb-4 group-hover:bg-electric/20 transition-colors">
                  <b.icon className="w-6 h-6 text-electric" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dashboard Preview */}
        <section id="dashboard-preview" className="bg-muted/40 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-electric/10 text-electric border-electric/20 mb-4">Area Riservata Partner</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
                Il Tuo Pannello di Controllo
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Una dashboard completa per gestire preventivi, pratiche, commissioni e formazione — tutto in un unico posto.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* Process */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Come Iniziare
            </h2>
            <p className="mt-3 text-muted-foreground">4 step per diventare partner Nolosubito e iniziare a guadagnare.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="relative"
              >
                <div className="p-6 bg-card rounded-2xl border border-border/50 h-full">
                  <div className="font-heading font-bold text-4xl text-electric/20 mb-3">{step.num}</div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-electric/30 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/40 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
                Chi Ha già Scelto Nolosubito
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="p-6 bg-card rounded-2xl border border-border/50"
                >
                  <div className="flex gap-1 mb-3">
                    {Array(t.rating).fill(0).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Form */}
        <section ref={formSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {showForm ? (
            <PartnerApplicationForm onCancel={() => setShowForm(false)} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#2D2E82] rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-electric/10 to-transparent pointer-events-none" />
              <UserCheck className="w-12 h-12 text-electric mx-auto mb-5" />
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
                Pronto a Iniziare?
              </h2>
              <p className="text-white/50 max-w-xl mx-auto mb-8 text-lg">
                Compila il form di candidatura. Ti ricontatteremo entro 48 ore per un colloquio conoscitivo gratuito.
              </p>
              <Button
                onClick={openForm}
                className="h-14 px-10 bg-electric hover:bg-electric/90 text-white font-bold rounded-xl text-lg cursor-pointer"
              >
                Candidati ora — è gratuito <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}