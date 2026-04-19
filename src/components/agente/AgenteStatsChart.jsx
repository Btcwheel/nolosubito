import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_COLORS_MAP = {
  "Nuova": "#3b82f6",
  "In Lavorazione": "#f59e0b",
  "Documenti Richiesti": "#f97316",
  "Approvata": "#22c55e",
  "Consegnata": "#a855f7",
  "Chiusa": "#9ca3af",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AgenteStatsChart({ pratiche }) {
  // Last 6 months trend
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const count = pratiche.filter(p =>
      p.created_date && isWithinInterval(new Date(p.created_date), { start, end })
    ).length;
    const consegnate = pratiche.filter(p =>
      p.status === "Consegnata" &&
      p.created_date && isWithinInterval(new Date(p.created_date), { start, end })
    ).length;
    return {
      mese: format(d, "MMM", { locale: it }),
      Pratiche: count,
      Consegnate: consegnate,
    };
  });

  // Status distribution
  const statusData = Object.entries(
    pratiche.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Vehicle make distribution
  const makeData = Object.entries(
    pratiche.reduce((acc, p) => {
      const make = p.veicolo_marca || "N/D";
      acc[make] = (acc[make] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Monthly trend */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h3 className="font-heading font-semibold text-foreground mb-1">Andamento pratiche</h3>
        <p className="text-xs text-muted-foreground mb-5">Ultimi 6 mesi</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="mese" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
            <Bar dataKey="Pratiche" fill="hsl(var(--electric))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Consegnate" fill="#a855f7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-foreground mb-1">Distribuzione stati</h3>
          <p className="text-xs text-muted-foreground mb-5">Pratiche per stato attuale</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS_MAP[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top makes */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-foreground mb-1">Marche più richieste</h3>
          <p className="text-xs text-muted-foreground mb-5">Top 6 veicoli nelle pratiche</p>
          <div className="space-y-3">
            {makeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato disponibile</p>
            ) : (
              makeData.map((item, i) => {
                const max = makeData[0].value;
                const pct = Math.round((item.value / max) * 100);
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-electric transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}