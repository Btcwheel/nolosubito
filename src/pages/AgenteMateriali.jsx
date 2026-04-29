import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { materialiService } from "@/services/materiali";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Download, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const TIPO_STYLES = {
  "Listino":          "bg-blue-100 text-blue-700",
  "Canvass":          "bg-purple-100 text-purple-700",
  "Offerta a Tempo":  "bg-amber-100 text-amber-700",
  "Comunicazione":    "bg-green-100 text-green-700",
};

const TIPO_ICONS = {
  "Listino":          "📋",
  "Canvass":          "📊",
  "Offerta a Tempo":  "⏳",
  "Comunicazione":    "📣",
};

export default function AgenteMateriali() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("tutti");

  const { data: materiali = [], isLoading } = useQuery({
    queryKey: ["materiali-agente", profile?.id],
    queryFn: () => materialiService.listForAgente(profile.id),
    enabled: !!profile?.id,
  });

  const now = new Date();
  const active = materiali.filter(m => m.is_active && (!m.expires_at || new Date(m.expires_at) > now));

  const tipi = [...new Set(active.map(m => m.tipo))];

  const filtered = active.filter(m => {
    const matchSearch = !search || m.titolo.toLowerCase().includes(search.toLowerCase()) ||
      m.descrizione?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "tutti" || m.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  return (
    <div className="min-h-screen bg-background pb-16 px-4 pt-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground">Materiali</h1>
          <p className="text-muted-foreground mt-1 text-sm">Listini, canvass e comunicazioni dalla direzione</p>
        </div>

        {/* Filtri */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cerca materiale…" className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterTipo("tutti")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                filterTipo === "tutti" ? "bg-navy text-white border-navy" : "border-border text-muted-foreground hover:border-navy/50"
              }`}
            >
              Tutti
            </button>
            {tipi.map(t => (
              <button key={t} onClick={() => setFilterTipo(filterTipo === t ? "tutti" : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  filterTipo === t ? "bg-navy text-white border-navy" : "border-border text-muted-foreground hover:border-navy/50"
                }`}
              >
                {TIPO_ICONS[t]} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Griglia materiali */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl py-16 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground">Nessun materiale disponibile</p>
            <p className="text-sm text-muted-foreground mt-1">I materiali condivisi dalla direzione appariranno qui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(m => {
              const expired = m.expires_at && new Date(m.expires_at) < now;
              const expiresSoon = m.expires_at && !expired &&
                (new Date(m.expires_at) - now) < 7 * 24 * 60 * 60 * 1000;

              return (
                <div key={m.id} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-navy/30 transition-colors group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center text-lg">
                        {TIPO_ICONS[m.tipo] || "📄"}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_STYLES[m.tipo] || "bg-gray-100 text-gray-600"}`}>
                          {m.tipo}
                        </span>
                      </div>
                    </div>
                    {expiresSoon && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        <Clock className="w-3 h-3" /> Scade presto
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-semibold text-foreground leading-tight mb-1">
                    {m.titolo}
                  </h3>
                  {m.descrizione && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {m.descrizione}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(m.created_at), "d MMM yyyy", { locale: it })}
                      {m.expires_at && ` · scade ${format(new Date(m.expires_at), "d MMM", { locale: it })}`}
                    </span>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{color:'#71BAED'}} className="flex items-center gap-1.5 text-xs font-semibold  hover:text-[#71BAED]/80 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Scarica
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
