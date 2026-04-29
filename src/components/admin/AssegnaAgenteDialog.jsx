import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AssegnaAgenteDialog({ pratica, agenti, onClose }) {
  const [selectedAgente, setSelectedAgente] = useState(pratica.agente_id || "");
  const qc = useQueryClient();
  const { toast } = useToast();

  const assign = useMutation({
    mutationFn: () => {
      const agente = agenti.find(a => a.id === selectedAgente);
      return praticheService.assignAgente(pratica.id, agente?.id || null, agente?.full_name || null);
    },
    onSuccess: () => {
      qc.invalidateQueries(["pratiche-admin"]);
      toast({ title: "Agente assegnato" });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg">Assegna Agente</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Pratica: <span className="font-semibold text-foreground">{pratica.cliente_nome}</span>
        </p>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="agente"
              value=""
              checked={selectedAgente === ""}
              onChange={() => setSelectedAgente("")}
              className="accent-electric"
            />
            <span className="text-sm text-muted-foreground italic">Nessuno (rimuovi agente)</span>
          </label>
          {agenti.map(a => (
            <label key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedAgente === a.id ? "style={{borderColor:'#71BAED'}} style={{backgroundColor:'#71BAED'}}/5" : "border-border hover:bg-muted/50"
            }`}>
              <input
                type="radio"
                name="agente"
                value={a.id}
                checked={selectedAgente === a.id}
                onChange={() => setSelectedAgente(a.id)}
                className="accent-electric"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                <p className="text-xs text-muted-foreground">{a.email}</p>
              </div>
            </label>
          ))}
          {agenti.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun utente con ruolo "agente" trovato.<br/>
              Assegna il ruolo "agente" agli utenti dal pannello utenti.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button
            onClick={() => assign.mutate()}
            disabled={assign.isPending}
            className="flex-1 bg-[#71BAED] hover:bg-[#71BAED]/90 text-white"
          >
            Salva
          </Button>
        </div>
      </div>
    </div>
  );
}