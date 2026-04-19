import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const EMPTY_OFFER = {
  make: "", model: "", category: "Business Sedan", segment: "Fleet",
  duration_months: 36, annual_km: 20000, advance_payment: 0,
  monthly_rent: 0, vehicle_image: "", fuel_type: "Diesel",
  transmission: "Automatic", power_hp: "", co2_emissions: "", features: [],
};

const CATEGORIES = ["Business Sedan","Business SUV","Electric Exec","Electric SUV","Commercial Van","Premium Sedan","Compact Business"];
const SEGMENTS = ["P.IVA","Fleet","Privati"];
const FUELS = ["Diesel","Petrol","Electric","Hybrid"];

export default function CmsOffers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_OFFER);
  const [featuresInput, setFeaturesInput] = useState("");

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["cms-offers"],
    queryFn: () => base44.entities.offers.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing === "new"
      ? base44.entities.offers.create(data)
      : base44.entities.offers.update(editing.id, data),
    onSuccess: () => {
      qc.invalidateQueries(["cms-offers"]);
      toast({ title: editing === "new" ? "Offerta creata" : "Offerta aggiornata" });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.offers.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["cms-offers"]);
      toast({ title: "Offerta eliminata" });
    },
  });

  const openNew = () => {
    setForm(EMPTY_OFFER);
    setFeaturesInput("");
    setEditing("new");
  };

  const openEdit = (o) => {
    setForm({ ...o });
    setFeaturesInput((o.features || []).join(", "));
    setEditing(o);
  };

  const handleSave = () => {
    const data = {
      ...form,
      features: featuresInput.split(",").map(s => s.trim()).filter(Boolean),
      duration_months: Number(form.duration_months),
      annual_km: Number(form.annual_km),
      advance_payment: Number(form.advance_payment),
      monthly_rent: Number(form.monthly_rent),
      power_hp: form.power_hp ? Number(form.power_hp) : undefined,
      co2_emissions: form.co2_emissions ? Number(form.co2_emissions) : undefined,
    };
    saveMutation.mutate(data);
  };

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-foreground">Offerte Veicoli</h2>
        <Button onClick={openNew} className="bg-electric hover:bg-electric/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuova Offerta
        </Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-lg">{editing === "new" ? "Nuova Offerta" : "Modifica Offerta"}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Marca *</Label><Input value={form.make} onChange={e => set("make", e.target.value)} className="mt-1" placeholder="BMW" /></div>
              <div><Label className="text-xs">Modello *</Label><Input value={form.model} onChange={e => set("model", e.target.value)} className="mt-1" placeholder="Serie 3" /></div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Segmento</Label>
                <Select value={form.segment} onValueChange={v => set("segment", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Durata (mesi)</Label><Input type="number" value={form.duration_months} onChange={e => set("duration_months", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">KM Annui</Label><Input type="number" value={form.annual_km} onChange={e => set("annual_km", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Anticipo (€)</Label><Input type="number" value={form.advance_payment} onChange={e => set("advance_payment", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Canone Mensile (€) *</Label><Input type="number" value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} className="mt-1" /></div>
              <div>
                <Label className="text-xs">Carburante</Label>
                <Select value={form.fuel_type} onValueChange={v => set("fuel_type", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{FUELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Trasmissione</Label>
                <Select value={form.transmission} onValueChange={v => set("transmission", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatic">Automatico</SelectItem>
                    <SelectItem value="Manual">Manuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Potenza (HP)</Label><Input type="number" value={form.power_hp} onChange={e => set("power_hp", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">CO2 (g/km)</Label><Input type="number" value={form.co2_emissions} onChange={e => set("co2_emissions", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs">URL Immagine Veicolo</Label><Input value={form.vehicle_image} onChange={e => set("vehicle_image", e.target.value)} className="mt-1" placeholder="https://..." /></div>
              <div className="col-span-2"><Label className="text-xs">Features (separate da virgola)</Label><Input value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} className="mt-1" placeholder="GPS, Clima, Sensori parcheggio" /></div>
            </div>
            {form.vehicle_image && (
              <div className="mt-4">
                <img src={form.vehicle_image} alt="preview" className="h-32 object-contain rounded-xl border border-border" onError={e => e.target.style.display='none'} />
              </div>
            )}
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
        ) : offers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Nessuna offerta. Creane una nuova.</div>
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
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {offers.map(o => (
                  <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {o.vehicle_image && <img src={o.vehicle_image} alt="" className="w-12 h-8 object-contain rounded" onError={e => e.target.style.display='none'} />}
                        <div>
                          <div className="font-medium text-foreground">{o.make} {o.model}</div>
                          <div className="text-xs text-muted-foreground">{o.category} · {o.fuel_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.segment}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.duration_months} mesi / {o.annual_km?.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-muted-foreground">€{o.advance_payment?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-electric">€{o.monthly_rent}/mese</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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