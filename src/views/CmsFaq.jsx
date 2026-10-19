import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faqsService } from "@/services/faqs";
import { vehicleOptionsService } from "@/services/vehicleOptions";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { FAQS_KEY } from "@/hooks/useFaqs";
import { TARGET_TYPES, countVehiclesForTargets, modelKey } from "@/lib/faqMatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

const ADMIN_KEY = ["faqs-admin"];
const NO_VALUE = ["home", "vehicles", "ready_delivery"];
const SEGMENTS = ["Privati", "P.IVA"];

const emptyFaq = (sortOrder) => ({ question: "", answer: "", sort_order: sortOrder, is_published: false, targets: [] });

const selectCls = "h-9 rounded-md border border-input bg-background px-3 text-sm";

function ruleLabel(t, fuelLabels) {
  const base = TARGET_TYPES[t.target_type].label;
  if (NO_VALUE.includes(t.target_type)) return base;
  if (t.target_type === "fuel") return `${base}: ${fuelLabels[t.target_value] ?? t.target_value}`;
  if (t.target_type === "model") return `${base}: ${t.target_value.replace("|", " ")}`;
  return `${base}: ${t.target_value}`;
}

function TargetsEditor({ targets, onChange, vehicles }) {
  const [type, setType] = useState("vehicles");
  const [value, setValue] = useState("");

  const { data: fuels = [] } = useQuery({ queryKey: ["vehicle_options", "fuel"], queryFn: () => vehicleOptionsService.list("fuel") });
  const { data: categories = [] } = useQuery({ queryKey: ["vehicle_options", "category"], queryFn: () => vehicleOptionsService.list("category") });
  const fuelLabels = useMemo(() => Object.fromEntries(fuels.map(f => [f.value, f.label ?? f.value])), [fuels]);

  const makes = useMemo(() => [...new Set(vehicles.map(v => v.make?.trim()).filter(Boolean))].sort(), [vehicles]);
  const models = useMemo(
    () => [...new Set(vehicles.map(v => modelKey(v.make, v.model)))].filter(k => !k.startsWith("|")).sort(),
    [vehicles],
  );

  const valueOptions = {
    fuel: fuels.map(f => ({ value: f.value, label: f.label ?? f.value })),
    category: categories.map(c => ({ value: c.value, label: c.label ?? c.value })),
    segment: SEGMENTS.map(s => ({ value: s, label: s })),
    make: makes.map(m => ({ value: m, label: m })),
    model: models.map(m => ({ value: m, label: m.replace("|", " ") })),
  };

  const needsValue = !NO_VALUE.includes(type);
  const canAdd = !needsValue || value;
  const exists = (t, v) => targets.some(x => x.target_type === t && (x.target_value ?? null) === (v ?? null));

  function add() {
    const v = needsValue ? value : null;
    if (!canAdd || exists(type, v)) return;
    onChange([...targets, { target_type: type, target_value: v }]);
    setValue("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
        {targets.length === 0 && <span className="text-xs text-muted-foreground">Nessuna regola: la FAQ non compare da nessuna parte.</span>}
        {targets.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 border border-navy/10 pl-3 pr-1.5 py-1 text-xs font-medium text-navy">
            {ruleLabel(t, fuelLabels)}
            <button type="button" aria-label="Rimuovi regola" onClick={() => onChange(targets.filter((_, j) => j !== i))} className="rounded-full hover:bg-navy/10 p-0.5 cursor-pointer">
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select className={selectCls} value={type} onChange={e => { setType(e.target.value); setValue(""); }} aria-label="Tipo di regola">
          {Object.entries(TARGET_TYPES).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
        </select>
        {needsValue && (
          <select className={`${selectCls} min-w-[180px]`} value={value} onChange={e => setValue(e.target.value)} aria-label="Valore della regola">
            <option value="">Scegli…</option>
            {(valueOptions[type] ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!canAdd}>
          <Plus className="size-3.5 mr-1" /> Aggiungi regola
        </Button>
      </div>
    </div>
  );
}

function FaqForm({ initial, vehicles, onClose }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  const vehicleCount = useMemo(
    () => countVehiclesForTargets(form.targets.filter(t => t.target_type !== "home"), vehicles),
    [form.targets, vehicles],
  );
  const inHome = form.targets.some(t => t.target_type === "home");

  const save = useMutation({
    mutationFn: () => faqsService.save(
      { id: form.id, question: form.question.trim(), answer: form.answer.trim(), sort_order: Number(form.sort_order) || 0, is_published: form.is_published },
      form.targets,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: FAQS_KEY });
      toast({ title: "FAQ salvata" });
      onClose();
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const valid = form.question.trim() && form.answer.trim();

  return (
    <div className="bg-white rounded-xl p-5 space-y-5 border">
      <div>
        <label className="text-sm font-medium block mb-1.5">Domanda</label>
        <Input value={form.question} onChange={e => set({ question: e.target.value })} placeholder="es. Cosa succede se supero i km previsti?" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">Risposta</label>
        <Textarea value={form.answer} onChange={e => set({ answer: e.target.value })} rows={8} />
        <p className="text-xs text-muted-foreground mt-1.5">Una riga = un paragrafo. Le righe che iniziano con “• ” diventano un elenco puntato.</p>
      </div>
      <div className="flex flex-wrap items-end gap-8">
        <div>
          <label className="text-sm font-medium block mb-1.5">Ordine</label>
          <Input type="number" className="w-24" value={form.sort_order} onChange={e => set({ sort_order: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1.5">Numero più basso = più in alto</p>
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
          <Switch checked={form.is_published} onCheckedChange={v => set({ is_published: v })} />
          {form.is_published ? "Pubblicata" : "Bozza (non visibile)"}
        </label>
      </div>
      <div>
        <p className="text-sm font-medium mb-1.5">Dove compare</p>
        <TargetsEditor targets={form.targets} onChange={targets => set({ targets })} vehicles={vehicles} />
        <p className="text-xs text-muted-foreground mt-3">
          {inHome && "Compare in home. "}
          {form.targets.some(t => t.target_type !== "home") && `Compare sulle schede di ${vehicleCount} ${vehicleCount === 1 ? "veicolo" : "veicoli"} (modelli del catalogo attivo).`}
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" onClick={() => save.mutate()} disabled={!valid || save.isPending}>
          {save.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Salva
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
      </div>
    </div>
  );
}

function summary(faq) {
  const t = faq.faq_targets ?? [];
  const parts = [];
  if (t.some(x => x.target_type === "home")) parts.push("Home");
  if (t.some(x => x.target_type === "vehicles")) parts.push("Tutte le schede");
  const specific = t.filter(x => !["home", "vehicles"].includes(x.target_type)).length;
  if (specific) parts.push(`${specific} ${specific === 1 ? "regola" : "regole"}`);
  return parts.length ? parts.join(" · ") : "Non assegnata";
}

export default function CmsFaq() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const { data: faqs = [], isLoading } = useQuery({ queryKey: ADMIN_KEY, queryFn: () => faqsService.listAll() });
  const { data: vehicles = [] } = useHomeCatalog();

  const remove = useMutation({
    mutationFn: (id) => faqsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: FAQS_KEY });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  if (editing) {
    return <FaqForm key={editing.id ?? "new"} initial={editing} vehicles={vehicles} onClose={() => setEditing(null)} />;
  }

  const startEdit = (faq) => setEditing({
    id: faq.id, question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_published: faq.is_published,
    targets: (faq.faq_targets ?? []).map(({ target_type, target_value }) => ({ target_type, target_value })),
  });
  const nextOrder = (faqs.reduce((m, f) => Math.max(m, f.sort_order), 0) || 0) + 10;

  return (
    <div className="bg-white rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-base">Domande frequenti</h3>
          <p className="text-xs text-muted-foreground mt-1">Ogni FAQ può comparire in home, su tutte le schede veicolo o solo su certi modelli e caratteristiche.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setEditing(emptyFaq(nextOrder))}>
          <Plus className="size-4 mr-1" /> Nuova FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4">Caricamento…</div>
      ) : faqs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4">Nessuna FAQ. Creane una con “Nuova FAQ”.</div>
      ) : (
        <div>
          {faqs.map(faq => (
            <div key={faq.id} className="flex items-center gap-3 py-3 border-b last:border-0 group">
              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{faq.sort_order}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary(faq)}</p>
              </div>
              <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${faq.is_published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {faq.is_published ? "Pubblicata" : "Bozza"}
              </span>
              <button type="button" aria-label="Modifica" onClick={() => startEdit(faq)} className="text-muted-foreground hover:text-foreground cursor-pointer"><Pencil className="size-4" /></button>
              <button
                type="button"
                aria-label="Elimina"
                onClick={() => { if (window.confirm("Eliminare questa FAQ?")) remove.mutate(faq.id); }}
                className="text-destructive/70 hover:text-destructive cursor-pointer"
              ><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
