import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleOptionsService } from "@/services/vehicleOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

const TYPES = [
  { id: "category",     label: "Categorie",         hint: "es. SUV, Berlina, Moto, Scooter" },
  { id: "fuel",         label: "Carburanti",         hint: "es. Diesel, Petrol, Electric" },
  { id: "transmission", label: "Tipi di cambio",     hint: "es. Automatic, Manual" },
  { id: "advance",      label: "Tagli di anticipo",  hint: "Valori numerici in €, es. 0, 1500, 5000" },
];

function OptionRow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(item.value);
  const [label, setLabel]     = useState(item.label ?? "");

  const needsLabel = item.type === "fuel";

  function handleSave() {
    onSave(item.id, { value, label: needsLabel ? label : value });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2 border-b last:border-0">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          className="h-8 text-sm w-36"
          placeholder="Valore"
        />
        {needsLabel && (
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="h-8 text-sm w-36"
            placeholder="Etichetta visibile"
          />
        )}
        <button type="button" onClick={handleSave} className="text-green-600 hover:text-green-700"><Check className="size-4" /></button>
        <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0 group">
      <span className="text-sm font-medium w-36">{item.value}</span>
      {needsLabel && <span className="text-sm text-muted-foreground w-36">{item.label}</span>}
      <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="size-3.5" /></button>
        <button type="button" onClick={() => onDelete(item.id)} className="text-destructive/70 hover:text-destructive"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  );
}

function OptionSection({ type, label, hint }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const needsLabel  = type === "fuel";
  const isNumeric   = type === "advance";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["vehicle_options", type],
    queryFn: () => vehicleOptionsService.list(type),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vehicle_options"] });

  const create = useMutation({
    mutationFn: () => vehicleOptionsService.create({
      type,
      value: newValue.trim(),
      label: needsLabel ? newLabel.trim() : newValue.trim(),
      sort_order: items.length,
    }),
    onSuccess: () => { invalidate(); setNewValue(""); setNewLabel(""); },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, updates }) => vehicleOptionsService.update(id, updates),
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id) => vehicleOptionsService.delete(id),
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const canAdd = newValue.trim() && (!needsLabel || newLabel.trim());

  return (
    <div className="bg-white rounded-xl border p-5">
      <h3 className="font-semibold text-base mb-1">{label}</h3>
      <p className="text-xs text-muted-foreground mb-4">{hint}</p>

      {needsLabel && (
        <div className="flex gap-2 text-xs text-muted-foreground mb-1 px-0.5">
          <span className="w-36">Valore interno</span>
          <span className="w-36">Etichetta visibile</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4">Caricamento…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4">Nessuna opzione. Aggiungine una.</div>
      ) : (
        <div className="mb-4">
          {items.map(item => (
            <OptionRow
              key={item.id}
              item={item}
              onSave={(id, updates) => update.mutate({ id, updates })}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2 mt-3">
        <Input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && canAdd && create.mutate()}
          placeholder={isNumeric ? "Importo €, es. 2500" : needsLabel ? "Valore (es. Electric)" : "Nuovo valore"}
          type={isNumeric ? "number" : "text"}
          min={isNumeric ? "0" : undefined}
          className="h-8 text-sm"
        />
        {needsLabel && (
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canAdd && create.mutate()}
            placeholder="Etichetta (es. Elettrico)"
            className="h-8 text-sm"
          />
        )}
        <Button
          size="sm"
          onClick={() => create.mutate()}
          disabled={!canAdd || create.isPending}
          className="h-8 px-3"
        >
          {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function CmsVehicleOptions() {
  return (
    <div className="space-y-6">
      {TYPES.map(t => (
        <OptionSection key={t.id} type={t.id} label={t.label} hint={t.hint} />
      ))}
    </div>
  );
}
