import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check, Zap, RefreshCw, Loader2, Search } from "lucide-react";

const EMPTY_CONFIG = {
  make: "", model: "", segment: "P.IVA",
  duration_months: 36, annual_km: 20000,
  advance_payment: 0, monthly_rent: 0, is_active: true,
};

const SEGMENTS = ["P.IVA", "Veicoli Commerciali", "Privati", "ReUse"];
const DURATIONS = [12, 24, 36, 48, 60];
const KM_OPTIONS = [5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000];

export default function CmsOffers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CONFIG);

  // ── Re-Use Quick Create state ────────────────────────────────────────────
  const [reuseMake, setReuseMake] = useState("");
  const [reuseModel, setReuseModel] = useState("");
  const [reuseRents, setReuseRents] = useState({});
  const [reuseSaving, setReuseSaving] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["cms-offers"],
    queryFn: () => offersService.getAllConfigs(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["cms-vehicles-list"],
    queryFn: () => offersService.list(),
  });

  // ── Table search / filter ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");

  const filteredConfigs = useMemo(() => {
    const q = search.toLowerCase();
    return configs.filter(c => {
      const matchSearch = !q || `${c.make} ${c.model}`.toLowerCase().includes(q);
      const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
      return matchSearch && matchSegment;
    });
  }, [configs, search, segmentFilter]);

  const configMakes = useMemo(() => [...new Set(configs.map(c => c.make))].sort(), [configs]);
  const configSegments = useMemo(() => [...new Set(configs.map(c => c.segment))].sort(), [configs]);

  const reuseMakes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);
  const reuseModels = useMemo(() => {
    if (!reuseMake) return [];
    return [...new Set(vehicles.filter(v => v.make === reuseMake).map(v => v.model))].sort();
  }, [vehicles, reuseMake]);

  const REUSE_COMBOS = [
    { months: 12, km: 10000 },
    { months: 12, km: 20000 },
    { months: 24, km: 10000 },
    { months: 24, km: 20000 },
  ];

  const handleReuseGenerate = async () => {
    if (!reuseMake || !reuseModel) {
      toast({ title: "Seleziona marca e modello", variant: "destructive" });
      return;
    }
    const combosToSave = REUSE_COMBOS.filter(({ months, km }) => {
      const key = `${months}|${km}`;
      const rent = Number(reuseRents[key]);
      return rent && rent > 0;
    });
    if (combosToSave.length === 0) {
      toast({ title: "Inserisci almeno un canone valido", variant: "destructive" });
      return;
    }
    setReuseSaving(true);
    try {
      const upserts = combosToSave.map(({ months, km }) => {
        const key = `${months}|${km}`;
        return offersService.upsertConfig({
          make: reuseMake,
          model: reuseModel,
          segment: "ReUse",
          duration_months: months,
          annual_km: km,
          advance_payment: 0,
          monthly_rent: Number(reuseRents[key]),
          is_active: true,
        });
      });
      await Promise.all(upserts);
      qc.invalidateQueries(["cms-offers"]);
      toast({ title: `${combosToSave.length} config Re-Use create per ${reuseMake} ${reuseModel}` });
      setReuseRents({});
    } catch (err) {
      toast({ title: "Errore", description: err?.message, variant: "destructive" });
    } finally {
      setReuseSaving(false);
    }
  };

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
          <Plus className="size-4" /> Nuova Config
        </Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-lg">
                {editing === "new" ? "Nuova Configurazione" : "Modifica Configurazione"}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="size-4" />
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
                <Select value={String(form.duration_months)} onValueChange={v => set("duration_months", Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={String(d)}>{d} mesi</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">KM Annui</Label>
                <Select value={String(form.annual_km)} onValueChange={v => set("annual_km", Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{KM_OPTIONS.map(k => <SelectItem key={k} value={String(k)}>{k.toLocaleString("it-IT")} km</SelectItem>)}</SelectContent>
                </Select>
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
                <Check className="size-4 mr-1" /> Salva
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Create Re-Use ──────────────────────────────────────────── */}
      <div className="bg-card border border-teal-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <RefreshCw className="size-4 text-teal-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm">Quick Create Re-Use</h3>
            <p className="text-xs text-muted-foreground">Seleziona marca/modello e inserisci i canoni per ogni combinazione</p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3 items-end mb-4">
          <div className="col-span-5">
            <Label className="text-xs">Marca</Label>
            <Select value={reuseMake} onValueChange={v => { setReuseMake(v); setReuseModel(""); setReuseRents({}); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleziona marca" /></SelectTrigger>
              <SelectContent>{reuseMakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-4">
            <Label className="text-xs">Modello</Label>
            <Select value={reuseModel} onValueChange={setReuseModel} disabled={!reuseMake}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={reuseMake ? "Seleziona modello" : "Prima la marca"} /></SelectTrigger>
              <SelectContent>{reuseModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Button
              onClick={handleReuseGenerate}
              disabled={reuseSaving || !reuseMake || !reuseModel || !Object.values(reuseRents).some(v => Number(v) > 0)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white cursor-pointer h-10"
            >
              {reuseSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Zap className="size-4 mr-2" />}
              Crea config
            </Button>
          </div>
        </div>

        {reuseMake && reuseModel && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REUSE_COMBOS.map(({ months, km }) => {
              const key = `${months}|${km}`;
              return (
                <div key={key} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <p className="text-[11px] font-semibold text-foreground mb-2">
                    {months}m · {km.toLocaleString("it-IT")} km/anno
                  </p>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                    <Input
                      type="number"
                      value={reuseRents[key] || ""}
                      onChange={e => setReuseRents(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="0"
                      className="pl-6 h-9 text-sm font-medium"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {/* Search bar */}
        <div className="flex gap-3 items-center p-4 border-b border-border/50 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca marca o modello…"
              className="pl-9 h-9"
            />
          </div>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Tutti i segmenti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i segmenti</SelectItem>
              {configSegments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {filteredConfigs.length < configs.length && (
            <span className="text-xs text-muted-foreground">
              {filteredConfigs.length} di {configs.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filteredConfigs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {configs.length === 0 ? "Nessuna configurazione. Creane una nuova." : "Nessun risultato per la ricerca."}
          </div>
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
                {filteredConfigs.map(o => (
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
                        <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Pencil className="size-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(o.id)}>
                          <Trash2 className="size-3.5" />
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
