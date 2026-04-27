import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, BarChart2, BookOpen, Bell, Car,
  TrendingUp, CheckCircle, Clock, AlertCircle, ChevronRight,
  Euro, Users, Award, Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "pratiche", label: "Pratiche", icon: FileText },
  { id: "commissioni", label: "Commissioni", icon: BarChart2 },
  { id: "formazione", label: "Formazione", icon: BookOpen },
];

const pratiche = [
  { cliente: "Rossi S.r.l.", veicolo: "BMW X5 xDrive30d", stato: "In approvazione", data: "14 Apr", valore: "€ 820/m" },
  { cliente: "Mario Bianchi", veicolo: "Tesla Model 3", stato: "Contratto firmato", data: "12 Apr", valore: "€ 690/m" },
  { cliente: "Tech Solutions S.p.A.", veicolo: "Mercedes GLC 300", stato: "In attesa documenti", data: "10 Apr", valore: "€ 950/m" },
  { cliente: "Studio Verdi", veicolo: "Audi A4 40 TDI", stato: "Consegna programmata", data: "08 Apr", valore: "€ 750/m" },
];

const mandati = [
  { nome: "ALD Automotive", logo: "ALD", attivo: true, pratiche: 12 },
  { nome: "Leasys", logo: "LSY", attivo: true, pratiche: 8 },
  { nome: "Arval", logo: "ARV", attivo: true, pratiche: 5 },
  { nome: "Alphabet", logo: "ALB", attivo: false, pratiche: 0 },
];

const corsi = [
  { titolo: "Fondamenti Noleggio Lungo Termine", completato: true, durata: "2h 30m" },
  { titolo: "Fiscalità e Deducibilità", completato: true, durata: "1h 45m" },
  { titolo: "Tecniche di Vendita B2B", completato: false, durata: "3h 00m", progress: 60 },
  { titolo: "Gestione Contratti Fleet", completato: false, durata: "2h 00m", progress: 0 },
];

const statoColor = {
  "In approvazione": "bg-yellow-100 text-yellow-700",
  "Contratto firmato": "bg-green-100 text-green-700",
  "In attesa documenti": "bg-orange-100 text-orange-700",
  "Consegna programmata": "bg-blue-100 text-blue-700",
};

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
      {/* Browser chrome */}
      <div className="bg-muted/60 border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-background/80 rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
          partner.nolosubito.it/dashboard
        </div>
        <div className="w-16" />
      </div>

      <div className="flex min-h-[520px]">
        {/* Sidebar */}
        <div className="w-56 bg-navy shrink-0 p-4 flex flex-col hidden sm:flex">
          <div className="flex items-center gap-2 px-2 mb-6 mt-1">
            <div className="w-7 h-7 rounded-lg bg-electric flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-white text-sm">Nolosubito</span>
          </div>

          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-electric text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xs text-white/40 mb-1">Partner Level</div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold text-sm">Silver</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full">
                <div className="h-full w-3/5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" />
              </div>
              <div className="text-[10px] text-white/30 mt-1">60% → Gold</div>
            </div>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="sm:hidden w-full absolute" />

        {/* Main content */}
        <div className="flex-1 p-5 sm:p-6 bg-background overflow-auto">
          {/* Mobile tabs */}
          <div className="flex gap-2 mb-5 sm:hidden overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id ? "bg-electric text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-heading font-bold text-foreground text-lg">Ciao, Marco 👋</h2>
                  <p className="text-xs text-muted-foreground">Aprile 2026 · 3 notifiche in attesa</p>
                </div>
                <button className="relative p-2 rounded-lg bg-muted cursor-pointer">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-electric rounded-full" />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Pratiche Aperte", value: "12", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Commissioni Mese", value: "€ 4.800", icon: Euro, color: "text-green-500", bg: "bg-green-50" },
                  { label: "Contratti Firmati", value: "38", icon: CheckCircle, color: "text-electric", bg: "bg-electric/10" },
                  { label: "Clienti Attivi", value: "27", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-card border border-border/50 rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    <div className="font-heading font-bold text-xl text-foreground">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent pratiche */}
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">Ultime Pratiche</h3>
                  <button className="text-xs text-electric font-medium cursor-pointer">Vedi tutte →</button>
                </div>
                <div className="space-y-2">
                  {pratiche.slice(0, 3).map(p => (
                    <div key={p.cliente} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{p.cliente}</div>
                        <div className="text-xs text-muted-foreground">{p.veicolo}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statoColor[p.stato]}`}>{p.stato}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.valore}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "pratiche" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-foreground text-lg">Gestione Pratiche</h2>
                <button className="flex items-center gap-1.5 text-xs bg-electric text-white px-3 py-2 rounded-lg font-medium cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Nuova Pratica
                </button>
              </div>
              <div className="space-y-3">
                {pratiche.map((p, i) => (
                  <motion.div
                    key={p.cliente}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl hover:border-electric/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4 text-electric" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{p.cliente}</div>
                        <div className="text-xs text-muted-foreground">{p.veicolo} · {p.data}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statoColor[p.stato]}`}>{p.stato}</span>
                      <span className="text-sm font-semibold text-foreground">{p.valore}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                <h3 className="font-semibold text-sm text-foreground mb-3">Mandati Attivi</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mandati.map(m => (
                    <div key={m.nome} className={`p-3 rounded-lg border flex items-center gap-2 ${m.attivo ? "bg-card border-border/50" : "bg-muted/30 border-dashed border-border/30"}`}>
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${m.attivo ? "bg-electric text-white" : "bg-muted text-muted-foreground"}`}>
                        {m.logo}
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${m.attivo ? "text-foreground" : "text-muted-foreground"}`}>{m.nome}</div>
                        <div className="text-[10px] text-muted-foreground">{m.attivo ? `${m.pratiche} pratiche` : "Non attivo"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "commissioni" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h2 className="font-heading font-bold text-foreground text-lg mb-5">Commissioni</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="text-xs text-green-600 font-medium mb-1">Mese Corrente</div>
                  <div className="font-heading font-bold text-2xl text-green-700">€ 4.800</div>
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +22% vs mese scorso
                  </div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground font-medium mb-1">Anno in corso</div>
                  <div className="font-heading font-bold text-2xl text-foreground">€ 38.400</div>
                  <div className="text-xs text-muted-foreground mt-1">8 contratti chiusi</div>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-4 mb-3">
                <h3 className="font-semibold text-sm text-foreground mb-3">Storico Pagamenti</h3>
                <div className="space-y-2">
                  {[
                    { mese: "Marzo 2026", importo: "€ 3.940", stato: "Pagato" },
                    { mese: "Febbraio 2026", importo: "€ 4.200", stato: "Pagato" },
                    { mese: "Gennaio 2026", importo: "€ 5.100", stato: "Pagato" },
                  ].map(r => (
                    <div key={r.mese} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-foreground">{r.mese}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{r.importo}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{r.stato}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "formazione" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h2 className="font-heading font-bold text-foreground text-lg mb-2">Formazione</h2>
              <p className="text-sm text-muted-foreground mb-5">Completa i corsi per sbloccare nuovi mandati e aumentare le commissioni.</p>

              <div className="mb-4 p-4 bg-electric/5 border border-electric/20 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-electric" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">Certificazione Silver attiva</div>
                  <div className="text-xs text-muted-foreground">Completa 2 corsi per ottenere la certificazione Gold (+15% commissioni)</div>
                </div>
              </div>

              <div className="space-y-3">
                {corsi.map((c, i) => (
                  <motion.div
                    key={c.titolo}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="p-4 bg-card border border-border/50 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.completato ? "bg-green-100" : "bg-muted"}`}>
                        {c.completato
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : <BookOpen className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${c.completato ? "text-muted-foreground line-through" : "text-foreground"}`}>{c.titolo}</div>
                        <div className="text-xs text-muted-foreground">{c.durata}</div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {c.completato ? (
                        <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Completato</span>
                      ) : c.progress > 0 ? (
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground mb-1">{c.progress}%</div>
                          <div className="w-20 h-1.5 bg-muted rounded-full">
                            <div className="h-full bg-electric rounded-full" style={{ width: `${c.progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button className="text-[10px] px-3 py-1.5 bg-electric/10 text-electric rounded-lg font-medium cursor-pointer hover:bg-electric/20 transition-colors">Inizia</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Preview label */}
      <div className="bg-muted/50 border-t border-border/50 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">📱 Anteprima Area Riservata Partner — disponibile dopo l'attivazione</span>
        <Badge className="bg-electric/10 text-electric border-0 text-xs">Demo</Badge>
      </div>
    </div>
  );
}