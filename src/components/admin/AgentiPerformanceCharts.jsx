import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { differenceInDays, parseISO } from "date-fns";

const STATUS_ORDER = ["Nuova", "In Lavorazione", "Documenti Richiesti", "Approvata", "Consegnata", "Chiusa"];
const COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#22c55e", "#a855f7", "#6b7280"];

export default function AgentiPerformanceCharts({ pratiche, agenti }) {
  const agentiStats = useMemo(() => {
    const map = {};

    // Init con tutti gli agenti noti
    agenti.forEach(a => {
      map[a.id] = {
        nome: a.full_name,
        totale: 0,
        chiuse: 0,
        aperte: 0,
        giorniChiusura: [],
        perStato: {},
      };
      STATUS_ORDER.forEach(s => { map[a.id].perStato[s] = 0; });
    });

    pratiche.forEach(p => {
      if (!p.agente_id) return;
      if (!map[p.agente_id]) {
        map[p.agente_id] = {
          nome: p.agente_nome || "Agente sconosciuto",
          totale: 0, chiuse: 0, aperte: 0,
          giorniChiusura: [],
          perStato: Object.fromEntries(STATUS_ORDER.map(s => [s, 0])),
        };
      }
      const a = map[p.agente_id];
      a.totale++;
      a.perStato[p.status] = (a.perStato[p.status] || 0) + 1;

      if (p.status === "Chiusa") {
        a.chiuse++;
        if (p.created_date && p.ultimo_aggiornamento_stato) {
          const days = differenceInDays(
            parseISO(p.ultimo_aggiornamento_stato),
            parseISO(p.created_date)
          );
          if (days >= 0) a.giorniChiusura.push(days);
        }
      } else {
        a.aperte++;
      }
    });

    return Object.values(map).filter(a => a.totale > 0).map(a => ({
      ...a,
      tempoMedioGiorni: a.giorniChiusura.length
        ? Math.round(a.giorniChiusura.reduce((s, v) => s + v, 0) / a.giorniChiusura.length)
        : null,
    })).sort((a, b) => b.totale - a.totale);
  }, [pratiche, agenti]);

  // Carico di lavoro (pratiche aperte per agente) - doughnut
  const caricoData = agentiStats.map(a => ({ name: a.nome, value: a.aperte })).filter(a => a.value > 0);

  // Pratiche gestite per agente - bar
  const barData = agentiStats.map(a => ({
    nome: a.nome.split(" ")[0], // solo first name per leggibilità
    nomeCompleto: a.nome,
    Chiuse: a.chiuse,
    Aperte: a.aperte,
  }));

  // Tempo medio chiusura - bar
  const tempoData = agentiStats
    .filter(a => a.tempoMedioGiorni !== null)
    .map(a => ({
      nome: a.nome.split(" ")[0],
      nomeCompleto: a.nome,
      giorni: a.tempoMedioGiorni,
    }));

  if (agentiStats.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Nessun agente con pratiche assegnate ancora.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards per agente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentiStats.map(a => (
          <div key={a.nome} className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{a.totale} pratiche totali</p>
              </div>
              <span className="text-2xl font-bold text-[#71BAED]">{a.totale}</span>
            </div>
            <div className="flex gap-3 text-xs mb-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">{a.chiuse} chiuse</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{a.aperte} aperte</span>
              {a.tempoMedioGiorni !== null && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">~{a.tempoMedioGiorni}gg</span>
              )}
            </div>
            {/* Mini distribuzione stati */}
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
              {STATUS_ORDER.map((s, i) => {
                const w = a.totale > 0 ? (a.perStato[s] / a.totale) * 100 : 0;
                return w > 0 ? (
                  <div key={s} style={{ width: `${w}%`, backgroundColor: COLORS[i] }} title={`${s}: ${a.perStato[s]}`} />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart: pratiche gestite */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-sm mb-4 text-foreground">Pratiche per Agente</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, name) => [v, name]}
                  labelFormatter={(l, payload) => payload?.[0]?.payload?.nomeCompleto || l}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="Aperte" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
                <Bar dataKey="Chiuse" stackId="a" fill="#22c55e" radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>}
        </div>

        {/* Pie chart: carico di lavoro (pratiche aperte) */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-sm mb-4 text-foreground">Distribuzione Carico di Lavoro</h3>
          {caricoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={caricoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {caricoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Nessuna pratica aperta</p>}
        </div>
      </div>

      {/* Tempo medio chiusura */}
      {tempoData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-sm mb-4 text-foreground">Tempo Medio di Chiusura (giorni)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tempoData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="gg" />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={70} />
              <Tooltip
                formatter={(v) => [`${v} giorni`, "Tempo medio"]}
                labelFormatter={(l, payload) => payload?.[0]?.payload?.nomeCompleto || l}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="giorni" fill="#a855f7" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}