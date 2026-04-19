import React from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";

const PIPELINE_STAGES = [
  { status: "Nuova",               color: "bg-blue-500",   light: "bg-blue-50 border-blue-100",   text: "text-blue-700" },
  { status: "In Lavorazione",      color: "bg-amber-500",  light: "bg-amber-50 border-amber-100", text: "text-amber-700" },
  { status: "Documenti Richiesti", color: "bg-orange-500", light: "bg-orange-50 border-orange-100", text: "text-orange-700" },
  { status: "Approvata",           color: "bg-green-500",  light: "bg-green-50 border-green-100", text: "text-green-700" },
  { status: "Consegnata",          color: "bg-purple-500", light: "bg-purple-50 border-purple-100", text: "text-purple-700" },
  { status: "Chiusa",              color: "bg-gray-400",   light: "bg-gray-50 border-gray-200",   text: "text-gray-600" },
];

export default function AgentePipelineView({ pratiche, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map(s => (
          <div key={s.status}>
            <Skeleton className="h-8 w-full rounded-xl mb-3" />
            <div className="space-y-2">
              {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-2">
      {PIPELINE_STAGES.map(stage => {
        const cards = pratiche.filter(p => p.status === stage.status);
        return (
          <div key={stage.status} className="min-w-[160px]">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${stage.light}`}>
              <span className={`text-xs font-bold ${stage.text} truncate`}>{stage.status}</span>
              <span className={`text-xs font-bold ${stage.text} shrink-0 ml-1`}>{cards.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.length === 0 ? (
                <div className="border-2 border-dashed border-border/40 rounded-xl h-20 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground/50">Nessuna</p>
                </div>
              ) : (
                cards.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/admin/pratica/${p.id}`}>
                      <div className="bg-card border border-border/50 rounded-xl p-3 hover:shadow-md hover:border-border transition-all cursor-pointer group">
                        <div className={`w-1.5 h-1.5 rounded-full ${stage.color} mb-2`} />
                        <p className="font-mono text-xs font-bold text-electric mb-1 truncate">
                          {p.codice || `#${p.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <p className="text-xs font-semibold text-foreground truncate">{p.cliente_nome}</p>
                        {(p.veicolo_marca || p.veicolo_modello) && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Car className="w-3 h-3 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">{p.veicolo_marca} {p.veicolo_modello}</p>
                          </div>
                        )}
                        {p.canone_mensile && (
                          <p className="text-xs text-electric font-bold mt-1">€{p.canone_mensile}/m</p>
                        )}
                        <p className="text-xs text-muted-foreground/50 mt-1.5">
                          {p.created_date ? format(new Date(p.created_date), "d MMM", { locale: it }) : ""}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}