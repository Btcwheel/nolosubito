import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

const STATUS_COLORS = {
  "Nuova":                         "#2F3589",
  "In Lavorazione":                "#2563EB",
  "Documenti Richiesti":           "#d97706",
  "Documenti Caricati":            "#3b82f6",
  "Attesa Affidamento Finanziaria":"#64748b",
  "Affidamento Ricevuto":          "#4f46e5",
  "Stipula Contratto":             "#0d9488",
  "Attesa Consegna":               "#6366f1",
  "Approvata":                     "#16a34a",
  "Consegnata":                    "#0d9488",
  "Chiusa":                        "#9ca3af",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="text-xs">
          {p.name}: <span className="font-bold">{typeof p.value === "number" && p.name?.includes("€") ? `€${p.value.toLocaleString("it-IT")}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AdminOverviewCharts({ pratiche }) {
  const statusData = useMemo(() => {
    return Object.keys(STATUS_COLORS).map(s => ({
      name: s,
      value: pratiche.filter(p => p.status === s).length,
    })).filter(d => d.value > 0);
  }, [pratiche]);

  const agentiCanone = useMemo(() => {
    const map = {};
    pratiche.forEach(p => {
      if (!p.agente_nome || !p.canone_mensile) return;
      const nome = p.agente_nome.split(" ")[0]; // first name for brevity
      map[nome] = (map[nome] || 0) + p.canone_mensile;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pratiche]);

  const agentiPratiche = useMemo(() => {
    const map = {};
    pratiche.forEach(p => {
      if (!p.agente_nome) return;
      const nome = p.agente_nome.split(" ")[0];
      map[nome] = (map[nome] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pratiche]);

  const totalCanone = pratiche.reduce((s, p) => s + (p.canone_mensile || 0), 0);
  const totalAttive = pratiche.filter(p => !["Chiusa", "Consegnata"].includes(p.status)).length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pratiche totali", value: pratiche.length },
          { label: "Pratiche attive", value: totalAttive },
          { label: "Canone mensile totale", value: `€${totalCanone.toLocaleString("it-IT")}` },
          { label: "Agenti con pratiche", value: new Set(pratiche.map(p => p.agente_id).filter(Boolean)).size },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <p className="text-2xl font-heading font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pratiche per stato - Pie */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Pratiche per stato</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, value }) => `${value}`}
                labelLine={false}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.75rem" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pratiche per agente - Bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Pratiche per agente</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agentiPratiche} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Pratiche" radius={[6, 6, 0, 0]} fill="#71BAED">
                {agentiPratiche.map((_, i) => (
                  <Cell key={i} fill={`hsl(${220 + i * 18} 80% ${55 - i * 4}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Canone mensile per agente - Bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Valore canoni mensili per agente (€/mese)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentiCanone} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="€ canone/mese" radius={[6, 6, 0, 0]}>
                {agentiCanone.map((_, i) => (
                  <Cell key={i} fill={`hsl(${160 + i * 30} 65% ${50 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}