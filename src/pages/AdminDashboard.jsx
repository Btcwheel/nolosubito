import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, BarChart2, List, Layers, PieChart } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AssegnaAgenteDialog from "@/components/admin/AssegnaAgenteDialog";
import AgentiPerformanceCharts from "@/components/admin/AgentiPerformanceCharts";
import AdminOverviewCharts from "@/components/admin/AdminOverviewCharts";

const STATUS_COLORS = {
  "Nuova": "bg-blue-100 text-blue-700 border-blue-200",
  "In Lavorazione": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Documenti Richiesti": "bg-orange-100 text-orange-700 border-orange-200",
  "Approvata": "bg-green-100 text-green-700 border-green-200",
  "Consegnata": "bg-purple-100 text-purple-700 border-purple-200",
  "Chiusa": "bg-gray-100 text-gray-600 border-gray-200",
};

const ALL_STATUSES = ["Nuova", "In Lavorazione", "Documenti Richiesti", "Approvata", "Consegnata", "Chiusa"];

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("tutti");
  const [assignTarget, setAssignTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("pratiche");

  const { data: pratiche = [], isLoading } = useQuery({
    queryKey: ["pratiche-admin"],
    queryFn: () => base44.entities.Pratica.list("-created_date", 200),
  });

  const { data: agenti = [] } = useQuery({
    queryKey: ["agenti"],
    queryFn: () => base44.entities.User.filter({ role: "agente" }),
  });

  const filtered = pratiche.filter(p => {
    const matchSearch = !search ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_email?.toLowerCase().includes(search.toLowerCase()) ||
      p.codice?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tutti" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = ALL_STATUSES.map(s => ({
    label: s,
    count: pratiche.filter(p => p.status === s).length,
  }));

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Dashboard Admin</h1>
            <p className="text-muted-foreground mt-1">Gestione pratiche NoloSubito</p>
          </div>
          <div className="flex gap-2">
            <Link to="/cms">
              <Button variant="outline" className="gap-2">
                <Layers className="w-4 h-4" /> CMS Contenuti
              </Button>
            </Link>
            <Link to="/admin/nuova-pratica">
              <Button className="bg-electric hover:bg-electric/90 text-white gap-2">
                <Plus className="w-4 h-4" /> Nuova Pratica
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("pratiche")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pratiche" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="w-4 h-4" /> Pratiche
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "overview" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <PieChart className="w-4 h-4" /> Riepilogo
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "performance" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart2 className="w-4 h-4" /> Performance Agenti
          </button>
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <AdminOverviewCharts pratiche={pratiche} />
        )}

        {/* Performance tab */}
        {activeTab === "performance" && (
          <AgentiPerformanceCharts pratiche={pratiche} agenti={agenti} />
        )}

        {/* Pratiche tab */}
        {activeTab === "pratiche" && <>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, email o codice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filtra per stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti gli stati</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Nessuna pratica trovata.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Codice</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Veicolo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Stato</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Agente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Data</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-electric">{p.codice || p.id.slice(0,8)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{p.cliente_nome}</div>
                        <div className="text-xs text-muted-foreground">{p.cliente_email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.veicolo_marca} {p.veicolo_modello}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.agente_nome ? (
                          <span className="text-sm text-foreground">{p.agente_nome}</span>
                        ) : (
                          <button
                            onClick={() => setAssignTarget(p)}
                            className="text-xs text-electric hover:underline cursor-pointer"
                          >
                            Assegna
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.created_date ? format(new Date(p.created_date), "d MMM yyyy", { locale: it }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/admin/pratica/${p.id}`}>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs">
                            <Eye className="w-3.5 h-3.5" /> Apri
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        </>}

      </div>

      {assignTarget && (
        <AssegnaAgenteDialog
          pratica={assignTarget}
          agenti={agenti}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}