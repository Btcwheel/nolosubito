import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const EMPTY_CONFIG = {
  make: "", model: "", segment: "P.IVA",
  duration_months: 36, annual_km: 20000,
  advance_payment: 0, monthly_rent: 0, is_active: true,
};

const SEGMENTS = ["P.IVA", "Fleet", "Privati"];

export default function CmsOffers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CONFIG);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["cms-offers"],
    queryFn: () => offersService.getAllConfigs(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => offersService.upsertConfig(data),
    onSuccess: () => {
      qc.invalidateQueries(["cms-offers"]);
      toast({ title: editing === "new" ? "Configurazione creata" : "Configurazione aggiornata" });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => offersService.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries(["cms-offers"]);
      toast({ title: "Configurazione eliminata" });
    },
  });

  const openNew = () => {
    setForm(EMPTY_CONFIG);
    setEditing("new");
  };

  const openEdit = (o) => {
    setForm({ ...o });
    setEditing(o);
  };

  const handleSave = () => {
    const data = {
      ...form,
      duration_months: Number(form.duration_months),
      annual_km: Number(form.annual_km),
      advance_payment: Number(form.advance_payment),
      monthly_rent: Number(form.monthly_rent),
    };
    saveMutation.mutate(data);
  };

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-foreground">Configurazioni Prezzi</h2>
        <Button onClick={openNew} className="bg-electric hover:bg-electric/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuova Config
        </Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-lg">
                {editing === "new" ? "Nuova Configurazione" : "Modifica Configurazione"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Marca *</Label>
                <Input value={form.make} onChange={e => set("make", e.target.value)} className="mt-1" placeholder="BMW" />
              </div>
              <div>
                <Label className="text-xs">Modello *</Label>
                <Input value={form.model} onChange={e => set("model", e.target.value)} className="mt-1" placeholder="Serie 3" />
              </div>
              <div>
                <Label className="text-xs">Segmento</Label>
                <Select value={form.segment} onValueChange={v => set("segment", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Durata (mesi)</Label>
                <Input type="number" value={form.duration_months} onChange={e => set("duration_months", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">KM Annui</Label>
                <Input type="number" value={form.annual_km} onChange={e => set("annual_km", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Anticipo (€)</Label>
                <Input type="number" value={form.advance_payment} onChange={e => set("advance_payment", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Canone Mensile (€) *</Label>
                <Input type="number" value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="accent-electric" />
                  <span className="text-sm">Attivo (visibile nel configuratore)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Annulla</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-electric hover:bg-electric/90 text-white">
                <Check className="w-4 h-4 mr-1" /> Salva
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : configs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Nessuna configurazione. Creane una nuova.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Veicolo</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Segmento</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Durata / KM</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Anticipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Canone</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Stato</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {configs.map(o => (
                  <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{o.make} {o.model}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.segment}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.duration_months} mesi / {o.annual_km?.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-muted-foreground">€{o.advance_payment?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-electric">€{o.monthly_rent}/mese</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {o.is_active ? "Attivo" : "Disattivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(o.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
