import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Car, User, MessageSquare, AlertCircle, ChevronRight, Mail } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import StatusTimeline from "@/components/pratiche/StatusTimeline";

const STATUS_CONFIG = {
  "Nuova":               { color: "bg-blue-100 text-blue-700 border-blue-200" },
  "In Lavorazione":      { color: "bg-amber-100 text-amber-700 border-amber-200" },
  "Documenti Richiesti": { color: "bg-orange-100 text-orange-700 border-orange-200" },
  "Approvata":           { color: "bg-green-100 text-green-700 border-green-200" },
  "Consegnata":          { color: "bg-purple-100 text-purple-700 border-purple-200" },
  "Chiusa":              { color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function MiaPratica() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: pratiche = [], isLoading } = useQuery({
    queryKey: ["mia-pratica", searchEmail],
    queryFn: () => base44.entities.Pratica.filter({ cliente_email: searchEmail }, "-created_date", 10),
    enabled: !!searchEmail,
  });

  const { data: notePerPratica = [] } = useQuery({
    queryKey: ["note-cliente", pratiche?.[0]?.id],
    queryFn: () => base44.entities.PraticaNota.filter({
      pratica_id: pratiche[0].id,
      visibile_cliente: true,
    }, "-created_date", 20),
    enabled: !!pratiche?.[0]?.id,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchEmail(email.trim().toLowerCase());
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-navy pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.25)_0%,_transparent_60%)]" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/15 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
            Tracciamento in tempo reale
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-4 leading-tight">
            La tua pratica NLT
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            Inserisci l'email utilizzata per la richiesta e monitora lo stato del tuo noleggio.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16 relative z-10">
        {/* Search card — elevated, overlapping hero */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl p-6 mb-8">
          <form onSubmit={handleSearch}>
            <p className="text-sm font-medium text-foreground mb-3">Email utilizzata per la richiesta</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.it"
                  className="pl-9 h-11"
                  required
                />
              </div>
              <Button type="submit" className="bg-electric hover:bg-electric/90 text-white h-11 px-6 gap-2 shrink-0">
                <Search className="w-4 h-4" /> Cerca
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {submitted && (
            isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </motion.div>
            ) : pratiche.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-10 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground text-lg mb-2">Nessuna pratica trovata</p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Controlla l'indirizzo email inserito. Se hai appena inviato la richiesta, potrebbe volerci qualche minuto.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {pratiche.map((p, idx) => {
                  const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG["Nuova"];
                  const showNotes = notePerPratica.length > 0 && p.id === pratiche[0].id;

                  return (
                    <div key={p.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">

                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Pratica</p>
                          <p className="font-mono font-bold text-foreground text-sm tracking-wider">
                            {p.codice || `#${p.id.slice(0, 8).toUpperCase()}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Timeline */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Avanzamento pratica</p>
                          <StatusTimeline currentStatus={p.status} />
                        </div>

                        {/* Veicolo + Agente */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(p.veicolo_marca || p.veicolo_modello) && (
                            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                              <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                                <Car className="w-4 h-4 text-electric" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Veicolo richiesto</p>
                                <p className="font-semibold text-foreground text-sm">{p.veicolo_marca} {p.veicolo_modello}</p>
                                {p.canone_mensile && (
                                  <p className="text-electric font-bold text-sm mt-0.5">€{p.canone_mensile}/mese</p>
                                )}
                              </div>
                            </div>
                          )}

                          {p.agente_nome && (
                            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                              <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-electric" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Agente assegnato</p>
                                <p className="font-semibold text-foreground text-sm">{p.agente_nome}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Note visibili al cliente */}
                        {showNotes && (
                          <div className="border-t border-border/40 pt-5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> Comunicazioni dal team
                            </p>
                            <div className="space-y-3">
                              {notePerPratica.map(n => (
                                <div key={n.id} className="flex gap-3">
                                  <div className="w-7 h-7 rounded-full bg-electric/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-electric font-bold text-xs">NS</span>
                                  </div>
                                  <div className="flex-1 bg-electric/5 border border-electric/10 rounded-xl px-4 py-3">
                                    <p className="text-sm text-foreground leading-relaxed">{n.testo}</p>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                      {n.created_date ? format(new Date(n.created_date), "d MMM yyyy · HH:mm", { locale: it }) : ""}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Footer */}
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Hai bisogno di assistenza?{" "}
                    <a href="mailto:offerte@nolosubito.it" className="text-electric font-medium hover:underline">
                      Contattaci
                    </a>
                  </p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}