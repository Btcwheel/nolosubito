import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersService } from "@/services/offers";
import { vehicleOptionsService } from "@/services/vehicleOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Pencil, Trash2, X, Check, ImageIcon,
  Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Wand2, Copy, Star,
} from "lucide-react";
import { normalizeVehicleDescription } from "@/lib/vehicleText";
import { formatAdvanceAmount, isMotoCategory } from "@/lib/vehiclePricing";

// ── Costanti (fallback — rimpiazzate dal DB via useVehicleOptions) ─────────────

const CATEGORIES_DEFAULT    = ["Berlina","Station","SUV","CityCar","Quadricicli","Moto","Scooter","Commercial Van","Touring"];
const FUEL_TYPES_DEFAULT    = [{ value: "Diesel", label: "Diesel" },{ value: "Petrol", label: "Benzina" },{ value: "Electric", label: "Elettrico" },{ value: "Hybrid", label: "Ibrido" }];
const TRANSMISSIONS_DEFAULT = ["Automatic", "Manual"];
const ADVANCE_BRACKETS_DEFAULT = [0, 1500, 2000, 5000, 7500, 10000];

function useVehicleOptions() {
  const { data: catData     = [] } = useQuery({ queryKey: ["vehicle_options", "category"],     queryFn: () => vehicleOptionsService.list("category"),     staleTime: 60_000 });
  const { data: fuelData    = [] } = useQuery({ queryKey: ["vehicle_options", "fuel"],         queryFn: () => vehicleOptionsService.list("fuel"),         staleTime: 60_000 });
  const { data: transData   = [] } = useQuery({ queryKey: ["vehicle_options", "transmission"], queryFn: () => vehicleOptionsService.list("transmission"), staleTime: 60_000 });
  const { data: advanceData = [] } = useQuery({ queryKey: ["vehicle_options", "advance"],      queryFn: () => vehicleOptionsService.list("advance"),      staleTime: 60_000 });

  const CATEGORIES       = catData.length     ? catData.map(o => o.value)                                          : CATEGORIES_DEFAULT;
  const FUEL_TYPES       = fuelData.length    ? fuelData.map(o => ({ value: o.value, label: o.label ?? o.value })) : FUEL_TYPES_DEFAULT;
  const TRANSMISSIONS    = transData.length   ? transData.map(o => o.value)                                        : TRANSMISSIONS_DEFAULT;
  const ADVANCE_BRACKETS = advanceData.length ? advanceData.map(o => Number(o.value))                              : ADVANCE_BRACKETS_DEFAULT;

  return { CATEGORIES, FUEL_TYPES, TRANSMISSIONS, ADVANCE_BRACKETS };
}

const SEGMENTS_OPTIONS = [
  { value: "P.IVA",    label: "Business / P.IVA",      color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "Privati",  label: "Privati",                color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "Veicoli Commerciali", label: "Veicoli Commerciali",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "Green",    label: "Green Mobility",         color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "Moto",     label: "Offerte Moto",           color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "ReUse",    label: "Re-Use (generico)",      color: "bg-teal-100 text-teal-700 border-teal-200" },
  { value: "ReUse-Privati",   label: "Reuse Privati",   color: "bg-teal-100 text-teal-700 border-teal-200" },
  { value: "ReUse-Business",  label: "Reuse Business",  color: "bg-teal-100 text-teal-700 border-teal-200" },
];

const PRICE_SEGMENTS = [
  { value: "P.IVA",               label: "P.IVA" },
  { value: "Privati",             label: "Privati" },
  { value: "Veicoli Commerciali", label: "Commerciali" },
  { value: "Moto",                label: "Moto" },
  { value: "ReUse",               label: "ReUse" },
  { value: "ReUse-Privati",       label: "Reuse Privati" },
  { value: "ReUse-Business",      label: "Reuse Business" },
];
const DURATE = [12, 24, 36, 48, 60];
const KM_OPTIONS = [10000, 15000, 20000, 25000, 30000, 40000];
const KM_OPTIONS_MOTO = [5000, 8000, 10000, 12000];

const EMPTY_PRICE_ROW = {
  _key: null, // client-side key per React
  id: null,   // DB id (null = nuovo)
  segment: "P.IVA",
  duration_months: 36,
  annual_km: 20000,
  advance_payment: 0,
  monthly_rent: "",
  is_active: true,
  is_featured: false,
};

const EMPTY_VEHICLE = {
  make: "", model: "", version: "", category: "", fuel_type: "",
  transmission: "", power_hp: "", co2_emissions: "",
  vehicle_image: "", foto_prev: "", gallery_images: [], description: "", features: [],
  segments: [], is_active: true, is_featured: false, is_ready_delivery: false,
  // SEO
  seo_title: "", seo_description: "", seo_keywords: [],
};

// ── Utility ───────────────────────────────────────────────────────────────────

let _keyCounter = 0;
const nextKey = () => ++_keyCounter;

// ── FeaturesInput (dotazioni e SEO keywords) ──────────────────────────────────

function TagInput({ tags, onChange, placeholder = "Scrivi e premi Invio…" }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };
  const remove = (item) => onChange(tags.filter(f => f !== item));
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !draft && tags.length) remove(tags[tags.length - 1]);
  };
  return (
    <div className="border border-input rounded-xl p-2 min-h-[44px] flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-electric/30 focus-within:border-electric/50 bg-background">
      {tags.map(f => (
        <span key={f} className="inline-flex items-center gap-1 bg-navy text-white text-xs px-2 py-0.5 rounded-full">
          {f}
          <button type="button" onClick={() => remove(f)} className="hover:text-electric transition-colors">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add()}
        placeholder={tags.length ? "" : placeholder}
        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground px-1"
      />
    </div>
  );
}

// ── Upload foto principale ────────────────────────────────────────────────────

function ImageUpload({ value, onChange, make, model }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(value || "");
  const [expanded, setExpanded]   = useState(false);
  const { toast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "File non valido", description: "Seleziona un'immagine (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await offersService.uploadVehicleImage(file, make || "vehicle", model || "image");
      setPreview(url); onChange(url);
      toast({ title: "Foto caricata" });
    } catch (err) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  if (!expanded) {
    return (
      <div className="flex items-center gap-3 border border-border rounded-xl p-2">
        <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50 flex items-center justify-center">
          {preview
            ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
            : <ImageIcon className="size-4 text-muted-foreground/40" />
          }
        </div>
        <p className="text-xs text-muted-foreground flex-1 truncate">{preview ? "Foto caricata" : "Nessuna foto"}</p>
        <button type="button" onClick={() => setExpanded(true)}
          className="text-xs font-medium text-electric hover:underline shrink-0">
          Cambia
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
          uploading ? "style={{borderColor:'#71BAED'}}/30 style={{backgroundColor:'#71BAED'}}/5" : "border-border hover:style={{borderColor:'#71BAED'}}/40"
        }`}
      >
        {preview ? (
          <div className="relative aspect-[16/9]">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm font-medium">Cambia foto</p>
            </div>
          </div>
        ) : (
          <div className="aspect-[16/9] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading
              ? <Loader2 className="size-8 animate-spin text-electric" />
              : <><ImageIcon className="size-8" /><p className="text-sm">Clicca o trascina qui la foto</p><p className="text-xs">JPG, PNG, WebP · max 5 MB</p></>
            }
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      <div className="flex gap-2">
        <Input
          value={preview}
          onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
          placeholder="oppure incolla URL immagine…"
          className="text-xs"
        />
        {preview && (
          <button type="button" onClick={() => { setPreview(""); onChange(""); }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        )}
        {preview && (
          <button type="button" onClick={() => setExpanded(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium whitespace-nowrap">
            Comprimi
          </button>
        )}
      </div>
    </div>
  );
}

// ── Gallery foto ──────────────────────────────────────────────────────────────

const GALLERY_MAX = 5;

function GalleryImagesInput({ images, onChange, make, model }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "File non valido", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File troppo grande", description: "Massimo 5 MB.", variant: "destructive" }); return; }
    if ((images || []).length >= GALLERY_MAX) { toast({ title: "Limite raggiunto", description: `Massimo ${GALLERY_MAX} foto.`, variant: "destructive" }); return; }
    setUploading(true);
    try {
      const url = await offersService.uploadVehicleImage(file, make || "vehicle", `${model || "gallery"}-gallery`);
      onChange([...(images || []), url]);
      toast({ title: "Foto aggiunta" });
    } catch (err) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url || (images || []).length >= GALLERY_MAX) return;
    onChange([...(images || []), url]); setUrlDraft("");
  };

  const remove = (i) => onChange((images || []).filter((_, idx) => idx !== i));
  const list = images || [];

  if (!expanded) {
    return (
      <div className="flex items-center gap-3 border border-border rounded-xl p-2">
        <div className="flex -space-x-2 shrink-0">
          {list.length > 0
            ? list.slice(0, 3).map((url, i) => (
                <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-background bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))
            : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="size-4 text-muted-foreground/40" />
                </div>
              )
          }
        </div>
        <p className="text-xs text-muted-foreground flex-1 truncate">
          {list.length > 0 ? `${list.length} foto` : "Nessuna foto"}
        </p>
        <button type="button" onClick={() => setExpanded(true)}
          className="text-xs font-medium text-electric hover:underline shrink-0">
          {list.length > 0 ? "Gestisci" : "Aggiungi"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {list.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border/50 group">
              <img src={url} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={() => remove(i)} className="bg-white/20 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors">
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {list.length < GALLERY_MAX && (
            <button type="button" onClick={() => !uploading && inputRef.current?.click()} disabled={uploading}
              className="aspect-video border-2 border-dashed border-border hover:border-electric/40 rounded-lg flex items-center justify-center text-muted-foreground hover:text-electric transition-colors disabled:opacity-50">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            </button>
          )}
        </div>
      )}
      {list.length === 0 && (
        <button type="button" onClick={() => !uploading && inputRef.current?.click()} disabled={uploading}
          className="w-full border-2 border-dashed border-border hover:border-electric/40 rounded-xl p-5 flex flex-col items-center gap-2 text-muted-foreground hover:text-electric transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <><ImageIcon className="size-6" /><p className="text-sm">Clicca per aggiungere foto gallery</p><p className="text-xs opacity-70">Max {GALLERY_MAX} foto · JPG/WebP · max 3 MB</p></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }} />
      <div className="flex gap-2">
        <Input value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="oppure incolla URL foto…" className="text-xs" disabled={list.length >= GALLERY_MAX} />
        <Button type="button" size="sm" variant="outline" onClick={addUrl}
          disabled={!urlDraft.trim() || list.length >= GALLERY_MAX} className="shrink-0">
          <Plus className="size-3.5" />
        </Button>
        {list.length > 0 && (
          <button type="button" onClick={() => setExpanded(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium whitespace-nowrap">
            Comprimi
          </button>
        )}
      </div>
    </div>
  );
}

// ── Editor configurazioni prezzi ──────────────────────────────────────────────

function PricingConfigsEditor({ rows, onChange, defaultSegment = "P.IVA", kmOptions = KM_OPTIONS, advanceBrackets = ADVANCE_BRACKETS_DEFAULT }) {
  const addRow = () => {
    onChange([...rows, { ...EMPTY_PRICE_ROW, _key: nextKey(), segment: defaultSegment }]);
  };

  const updateRow = (key, field, value) => {
    onChange(rows.map(r => r._key === key ? { ...r, [field]: value } : r));
  };

  const removeRow = (key) => {
    onChange(rows.filter(r => r._key !== key));
  };

  const toggleFeatured = (key) => {
    const row = rows.find(r => r._key === key);
    if (!row) return;
    // Se già featured, togli. Altrimenti, imposta come featured e rimuovi dagli altri dello stesso segmento.
    if (row.is_featured) {
      onChange(rows.map(r => r._key === key ? { ...r, is_featured: false } : r));
    } else {
      onChange(rows.map(r => ({
        ...r,
        is_featured: r._key === key ? true : r.segment === row.segment ? false : r.is_featured,
      })));
    }
  };

  const duplicateRow = (row) => {
    let newSegment = row.segment;

    if (row.segment === "P.IVA") {
      newSegment = "Privati";
    } else if (row.segment === "Privati") {
      newSegment = "P.IVA";
    }

    const newRow = { ...row, _key: nextKey(), id: null, segment: newSegment, monthly_rent: Number(row.monthly_rent) || 0, is_featured: false };
    const idx = rows.findIndex(r => r._key === row._key);
    const updated = [...rows];
    updated.splice(idx + 1, 0, newRow);
    onChange(updated);
  };

  // Segmenti che hanno almeno una riga, per mostrare la legenda
  const segmentsInUse = [...new Set(rows.map(r => r.segment))];

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="space-y-2">
          {/* Legenda vetrina */}
          {segmentsInUse.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1 mb-1">
              {segmentsInUse.map(seg => {
                const featured = rows.find(r => r.segment === seg && r.is_featured);
                return (
                  <span key={seg} className="text-[10px] text-muted-foreground">
                    <span className="font-semibold">{seg}:</span>{" "}
                    {featured
                      ? <span className="text-amber-600">★ vetrina {featured.duration_months}m / {(featured.annual_km / 1000).toFixed(0)}k km</span>
                      : <span className="text-muted-foreground/50">nessuna vetrina</span>
                    }
                  </span>
                );
              })}
            </div>
          )}

          {/* Header */}
          <div className="grid grid-cols-[28px_1fr_90px_110px_130px_110px_32px_32px] gap-2 px-1">
            {["★", "Segmento", "Durata", "KM/anno", "Anticipo", "Canone €/mese", "", ""].map((h, i) => (
              <p key={i} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>

          {/* Righe */}
          {rows.map(row => (
            <div
              key={row._key}
              className={`grid grid-cols-[28px_1fr_90px_110px_130px_110px_32px_32px] gap-2 items-start rounded-xl px-3 py-2 border transition-colors ${
                row.is_featured
                  ? "bg-amber-50 border-amber-300"
                  : "bg-muted/30 border-border/50"
              }`}
            >
              {/* Stella vetrina */}
              <button
                type="button"
                onClick={() => toggleFeatured(row._key)}
                title={row.is_featured ? "Rimuovi da vetrina" : "Imposta come canone vetrina per questo segmento"}
                className={`size-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  row.is_featured
                    ? "text-amber-500 hover:text-amber-700"
                    : "text-muted-foreground/30 hover:text-amber-400"
                }`}
              >
                <Star className="size-3.5" fill={row.is_featured ? "currentColor" : "none"} />
              </button>

              {/* Segmento */}
              <Select value={row.segment} onValueChange={v => updateRow(row._key, "segment", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PRICE_SEGMENTS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>

              {/* Durata */}
              <Select value={String(row.duration_months)} onValueChange={v => updateRow(row._key, "duration_months", Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DURATE.map(d => <SelectItem key={d} value={String(d)}>{d} mesi</SelectItem>)}</SelectContent>
              </Select>

              {/* KM */}
              <Select value={String(row.annual_km)} onValueChange={v => updateRow(row._key, "annual_km", Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{kmOptions.map(k => <SelectItem key={k} value={String(k)}>{k.toLocaleString("it-IT")}</SelectItem>)}</SelectContent>
              </Select>

              {/* Anticipo */}
              <Select
                value={String(Number(row.advance_payment ?? 0))}
                onValueChange={v => updateRow(row._key, "advance_payment", Number(v))}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {advanceBrackets.map(preset => (
                    <SelectItem key={preset} value={String(preset)}>{formatAdvanceAmount(preset)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Canone */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                <Input
                  type="number"
                  min="0"
                  value={row.monthly_rent}
                  onChange={e => updateRow(row._key, "monthly_rent", e.target.value)}
                  placeholder="0"
                  className="h-8 text-xs pl-6"
                />
              </div>

              {/* Duplica riga */}
              <button
                type="button"
                onClick={() => duplicateRow(row)}
                title={row.segment === "P.IVA" ? "Duplica come Privati" : row.segment === "Privati" ? "Duplica come P.IVA" : "Duplica riga"}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Copy className="size-3.5" />
              </button>

              {/* Elimina riga */}
              <button
                type="button"
                onClick={() => removeRow(row._key)}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Aggiungi riga */}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-electric/40 rounded-xl py-2.5 text-sm text-muted-foreground hover:text-electric transition-colors cursor-pointer"
      >
        <Plus className="size-4" />
        Aggiungi configurazione canone
      </button>
    </div>
  );
}

// ── Sezione SEO collassabile ──────────────────────────────────────────────────

function SeoSection({ form, set }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">SEO &amp; Metatag</span>
          <span className="text-[10px] text-muted-foreground font-normal">Ottimizzazione motori di ricerca</span>
        </div>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">
              Meta Title
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                ({(form.seo_title || "").length}/60 caratteri)
              </span>
            </Label>
            <Input
              value={form.seo_title || ""}
              onChange={e => set("seo_title", e.target.value)}
              placeholder={`Noleggio ${form.make || "Marca"} ${form.model || "Modello"} a lungo termine | Nolosubito`}
              maxLength={60}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">
              Meta Description
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                ({(form.seo_description || "").length}/160 caratteri)
              </span>
            </Label>
            <Textarea
              value={form.seo_description || ""}
              onChange={e => set("seo_description", e.target.value)}
              placeholder={`Noleggio a lungo termine ${form.make || ""} ${form.model || ""}. Scopri le nostre offerte per P.IVA, aziende e privati. Canone all-inclusive.`}
              rows={2}
              maxLength={160}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">
              Keywords <span className="font-normal text-muted-foreground">(Invio per aggiungere)</span>
            </Label>
            <TagInput
              tags={form.seo_keywords || []}
              onChange={val => set("seo_keywords", val)}
              placeholder="es: noleggio BMW, NLT Milano…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal form veicolo ────────────────────────────────────────────────────────

function VehicleModal({ initial, onSave, onClose, isSaving, CATEGORIES, FUEL_TYPES, TRANSMISSIONS, ADVANCE_BRACKETS }) {
  const [form, setForm] = useState({ ...EMPTY_VEHICLE, ...initial });
  const [pricingRows, setPricingRows] = useState([]);
  const [deletedConfigIds, setDeletedConfigIds] = useState([]);
  const [modalKey, setModalKey] = useState(0);
  const pricingInitialized = useRef(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // Carica configurazioni esistenti quando si modifica
  const { data: existingConfigs, isLoading: loadingConfigs } = useQuery({
    queryKey: ["vehicle-configs-edit", initial?.make, initial?.model],
    queryFn: () => offersService.getConfigs(initial.make, initial.model),
    enabled: !!initial?.id && !!initial?.make && !!initial?.model,
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    pricingInitialized.current = false;
    setPricingRows([]);
    setDeletedConfigIds([]);
  }, [initial?.id]);

  useEffect(() => {
    if (existingConfigs && !pricingInitialized.current) {
      pricingInitialized.current = true;
      setPricingRows(existingConfigs.map(c => ({
        ...c,
        _key: nextKey(),
        advance_payment: Number(c.advance_payment ?? 0),
      })));
    }
  }, [existingConfigs]);

  const handlePricingChange = (newRows) => {
    // Traccia ID rimossi per eliminazione al salvataggio
    const newKeys = new Set(newRows.map(r => r._key));
    const removed = pricingRows.filter(r => r.id && !newKeys.has(r._key)).map(r => r.id);
    if (removed.length) setDeletedConfigIds(prev => [...prev, ...removed]);
    setPricingRows(newRows);
  };

  const isNew = !initial?.id;
  const canSave = form.make.trim() && form.model.trim() && form.category;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-lg">
            {isNew ? "Nuovo Veicolo" : `Modifica — ${initial.make} ${initial.model}`}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* ── Dati veicolo ── */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Dati Veicolo</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Marca *</Label>
                  <Input value={form.make} onChange={e => set("make", e.target.value)} placeholder="BMW" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Modello *</Label>
                  <Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="Serie 3 320d" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Versione <span className="text-muted-foreground font-normal">(visibile solo nel dettaglio offerta)</span>
                </Label>
                <Input
                  value={form.version || ""}
                  onChange={e => set("version", e.target.value)}
                  placeholder="es. 320d Luxury Line, 1.5 TSI DSG…"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Categoria *</Label>
                  <Select value={form.category} onValueChange={v => set("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Carburante</Label>
                  <Select value={form.fuel_type || ""} onValueChange={v => set("fuel_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                    <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Cambio</Label>
                  <Select value={form.transmission || ""} onValueChange={v => set("transmission", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                    <SelectContent>{TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-2 block">
                  Sezioni <span className="text-muted-foreground font-normal">(dove appare il veicolo)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {SEGMENTS_OPTIONS.map(({ value, label, color }) => {
                    const active = (form.segments || []).includes(value);
                    return (
                      <button type="button" key={value}
                        onClick={() => {
                          const current = form.segments || [];
                          set("segments", active ? current.filter(s => s !== value) : [...current, value]);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                          active ? `${color} border-current` : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <span className={`size-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          active ? "bg-current border-current" : "border-muted-foreground/40"
                        }`}>
                          {active && <Check className="size-2.5 text-white" />}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Potenza (CV)</Label>
                  <Input type="number" value={form.power_hp} onChange={e => set("power_hp", e.target.value)} placeholder="150" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Emissioni CO₂ (g/km)</Label>
                  <Input type="number" value={form.co2_emissions} onChange={e => set("co2_emissions", e.target.value)} placeholder="0 = zero emissioni" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Foto veicolo</Label>
                <ImageUpload value={form.vehicle_image} onChange={url => set("vehicle_image", url)} make={form.make} model={form.model} />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Foto preventivo <span className="text-muted-foreground font-normal">(PNG 800×450 px, appare nel PDF preventivo)</span>
                </Label>
                <ImageUpload value={form.foto_prev} onChange={url => set("foto_prev", url)} make={form.make} model={form.model} />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Foto gallery <span className="text-muted-foreground font-normal">(foto aggiuntive nella pagina dettaglio)</span>
                </Label>
                <GalleryImagesInput images={form.gallery_images || []} onChange={urls => set("gallery_images", urls)} make={form.make} model={form.model} />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <Label className="text-xs font-semibold block">Descrizione</Label>
                  <button
                    type="button"
                    onClick={() => set("description", normalizeVehicleDescription(form.description || ""))}
                    style={{color:'#71BAED'}} className="inline-flex items-center gap-1.5 text-[11px] font-semibold  hover:text-electric/80 transition-colors"
                  >
                    <Wand2 className="size-3.5" />
                    Formatta testo
                  </button>
                </div>
                <Textarea
                  value={form.description || ""}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Descrizione del veicolo visualizzata nella pagina dettaglio…"
                  rows={5}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Dotazioni principali <span className="text-muted-foreground font-normal">(Invio o virgola per aggiungere)</span>
                </Label>
                <TagInput tags={form.features || []} onChange={val => set("features", val)} placeholder="Scrivi e premi Invio…" />
              </div>
            </div>
          </div>

          {/* ── Configurazioni canoni ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Configurazioni Canoni
              </p>
              {loadingConfigs && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            </div>
            <PricingConfigsEditor
              rows={pricingRows}
              onChange={handlePricingChange}
              defaultSegment={
                form.category === "Commercial Van" ? "Veicoli Commerciali" :
                isMotoCategory(form.category) ? "Moto" :
                "P.IVA"
              }
              kmOptions={isMotoCategory(form.category) ? KM_OPTIONS_MOTO : KM_OPTIONS}
              advanceBrackets={ADVANCE_BRACKETS}
            />
          </div>

          {/* ── Opzioni ── */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Opzioni</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button type="button" onClick={() => set("is_active", !form.is_active)}
                  className={`transition-colors ${form.is_active ? "style={{color:'#71BAED'}}" : "text-muted-foreground"}`}>
                  {form.is_active ? <ToggleRight className="size-8" /> : <ToggleLeft className="size-8" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-foreground">{form.is_active ? "Attivo" : "Disattivo"}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.is_active ? "Il veicolo è visibile nel catalogo" : "Il veicolo è nascosto dal catalogo"}
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button type="button" onClick={() => set("is_featured", !form.is_featured)}
                  className={`transition-colors ${form.is_featured ? "text-amber-500" : "text-muted-foreground"}`}>
                  {form.is_featured ? <ToggleRight className="size-8" /> : <ToggleLeft className="size-8" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-foreground">{form.is_featured ? "In evidenza" : "Non in evidenza"}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.is_featured ? "Appare tra i primi 8 in homepage" : "Non compare nella sezione in evidenza"}
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button type="button" onClick={() => set("is_ready_delivery", !form.is_ready_delivery)}
                  className={`transition-colors ${form.is_ready_delivery ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {form.is_ready_delivery ? <ToggleRight className="size-8" /> : <ToggleLeft className="size-8" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-foreground">{form.is_ready_delivery ? "Pronta consegna" : "Non pronta consegna"}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.is_ready_delivery ? "Badge 'Pronta Consegna' visibile sulla card" : "Nessun badge pronta consegna"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── SEO ── */}
          <SeoSection form={form} set={set} />

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button
            onClick={() => onSave({ form, pricingRows, deletedConfigIds })}
            disabled={!canSave || isSaving}
            className="flex-1 bg-electric hover:bg-electric/90 text-white gap-2"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {isNew ? "Crea Veicolo" : "Salva Modifiche"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function CmsVehicles() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { CATEGORIES, FUEL_TYPES, TRANSMISSIONS, ADVANCE_BRACKETS } = useVehicleOptions();
  const [modal, setModal]           = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFuel, setFilterFuel] = useState("");
  const [filterTransmission, setFilterTransmission] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [delConfirm, setDelConfirm] = useState(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["cms-vehicles"],
    queryFn: () => offersService.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ form, pricingRows, deletedConfigIds }) => {
      // 1. Salva il veicolo
      const make  = form.make.trim();
      const model = form.model.trim();
      const payload = {
        make,
        model,
        version:         (form.version || "").trim() || null,
        category:        form.category,
        fuel_type:       form.fuel_type       || null,
        transmission:    form.transmission    || null,
        power_hp:        form.power_hp        ? Number(form.power_hp)      : null,
        co2_emissions:   form.co2_emissions   ? Number(form.co2_emissions) : null,
        vehicle_image:   form.vehicle_image   || null,
        foto_prev:       form.foto_prev       || null,
        description:     normalizeVehicleDescription(form.description || "") || null,
        features:        form.features        || [],
        segments:        form.segments        || [],
        gallery_images:  form.gallery_images  || [],
        seo_title:       form.seo_title       || null,
        seo_description: form.seo_description || null,
        seo_keywords:    form.seo_keywords    || [],
        is_active:          form.is_active          ?? true,
        is_featured:        form.is_featured        ?? false,
        is_ready_delivery:  form.is_ready_delivery  ?? false,
      };
      const saved = form.id
        ? await offersService.update(form.id, payload)
        : await offersService.create(payload);

      // 2. Salva ogni configurazione canone in un'unica operazione bulk
      const configsToUpsert = pricingRows
        .filter(row => row.monthly_rent)
        .map(row => ({
          make,
          model,
          segment:         row.segment,
          duration_months: Number(row.duration_months),
          annual_km:       Number(row.annual_km),
          advance_payment: Number(row.advance_payment ?? 0),
          monthly_rent:    Number(row.monthly_rent),
          is_active:       row.is_active ?? true,
          is_featured:     row.is_featured ?? false,
          ...(row.id ? { id: row.id } : {}),
        }));
      await offersService.bulkUpsertConfigs(configsToUpsert);

      // 3. Elimina configurazioni rimosse in un'unica operazione
      await offersService.bulkDeleteConfigs(deletedConfigIds);

      return saved;
    },
    onSuccess: (_, { form }) => {
      qc.invalidateQueries({ queryKey: ["cms-vehicles"] });
      qc.invalidateQueries({ queryKey: ["cms-offers"] });
      qc.invalidateQueries({ queryKey: ["vehicle-configs-edit"] });
      // Invalida tutte le listing pubbliche (home + segmenti) per riflettere i canoni aggiornati
      qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("offers") });
      toast({ title: form.id ? "Veicolo aggiornato" : "Veicolo creato" });
      setModal(null);
    },
    onError: (err) => {
      const isDuplicate = err.message?.includes("offers_make_model_key") || err.code === "23505";
      toast({
        title: isDuplicate ? "Veicolo già esistente" : "Errore",
        description: isDuplicate
          ? "Esiste già un veicolo con questa marca e modello. Modifica il veicolo esistente invece di crearne uno nuovo."
          : err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => offersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-vehicles"] });
      toast({ title: "Veicolo eliminato" });
      setDelConfirm(null);
    },
    onError: (err) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => offersService.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-vehicles"] }),
  });

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || v.category === filterCategory;
    const matchFuel = !filterFuel || v.fuel_type === filterFuel;
    const matchTransmission = !filterTransmission || v.transmission === filterTransmission;
    const matchSegment = !filterSegment || (v.segments || []).includes(filterSegment);
    return matchSearch && matchCategory && matchFuel && matchTransmission && matchSegment;
  });

  const activeFiltersCount = [filterCategory, filterFuel, filterTransmission, filterSegment].filter(Boolean).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Catalogo Veicoli</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vehicles.length} veicoli{activeFiltersCount > 0 ? ` · ${filtered.length} mostrati` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca marca o modello…" className="w-44" />
          <Select value={filterCategory} onValueChange={v => setFilterCategory(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent><SelectItem value="__all">Tutte</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterFuel} onValueChange={v => setFilterFuel(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Alimentazione" /></SelectTrigger>
            <SelectContent><SelectItem value="__all">Tutte</SelectItem>{FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterTransmission} onValueChange={v => setFilterTransmission(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Cambio" /></SelectTrigger>
            <SelectContent><SelectItem value="__all">Tutti</SelectItem>{TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterSegment} onValueChange={v => setFilterSegment(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Segmento" /></SelectTrigger>
            <SelectContent><SelectItem value="__all">Tutti</SelectItem>{SEGMENTS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          {activeFiltersCount > 0 && (
            <Button size="sm" variant="ghost" onClick={() => { setFilterCategory(""); setFilterFuel(""); setFilterTransmission(""); setFilterSegment(""); }} className="h-8 text-xs text-muted-foreground">
              <X className="size-3.5 mr-1" /> Reset
            </Button>
          )}
          <Button onClick={() => setModal({})} className="bg-electric hover:bg-electric/90 text-white gap-2 shrink-0">
            <Plus className="size-4" /> Nuovo Veicolo
          </Button>
        </div>
      </div>

      {/* Lista veicoli */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-20 h-12 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? "Nessun veicolo trovato." : "Nessun veicolo nel catalogo. Crea il primo!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(v => (
              <div key={v.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-20 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30">
                  {v.vehicle_image
                    ? <img src={v.vehicle_image} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="size-5 text-muted-foreground/40" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight">{v.make} {v.model}</p>
                  {v.version && <p className="text-xs text-muted-foreground leading-tight mt-0.5">{v.version}</p>}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{v.category}</span>
                    {v.fuel_type && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{v.fuel_type}</Badge>}
                    {v.power_hp && <span className="text-[11px] text-muted-foreground">{v.power_hp} CV</span>}
                    {v.segments?.map(s => {
                      const opt = SEGMENTS_OPTIONS.find(o => o.value === s);
                      return opt ? (
                        <span key={s} className={`text-[10px] font-semibold px-1.5 py-0 rounded-full border ${opt.color}`}>{opt.label}</span>
                      ) : null;
                    })}
                    {v.is_featured && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0 rounded-full">★ Evidenza</span>
                    )}
                    {v.is_ready_delivery && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0 rounded-full">⚡ Pronta consegna</span>
                    )}
                    {v.seo_title && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded">SEO ✓</span>
                    )}
                  </div>
                </div>
                <button type="button"
                  onClick={() => toggleActive.mutate({ id: v.id, is_active: !v.is_active })}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    v.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {v.is_active ? "Attivo" : "Disattivo"}
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setModal(v)} className="size-8 p-0 hover:bg-muted">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDelConfirm(v)}
                    className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/8">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <VehicleModal
          initial={modal}
          onSave={(data) => saveMutation.mutate(data)}
          onClose={() => setModal(null)}
          isSaving={saveMutation.isPending}
          CATEGORIES={CATEGORIES}
          FUEL_TYPES={FUEL_TYPES}
          TRANSMISSIONS={TRANSMISSIONS}
          ADVANCE_BRACKETS={ADVANCE_BRACKETS}
        />
      )}

      {/* Confirm eliminazione */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-heading font-semibold text-lg mb-2">Elimina veicolo</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Sei sicuro di voler eliminare <strong>{delConfirm.make} {delConfirm.model}</strong>? Questa azione non può essere annullata.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDelConfirm(null)} className="flex-1">Annulla</Button>
              <Button onClick={() => deleteMutation.mutate(delConfirm.id)} disabled={deleteMutation.isPending}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2">
                {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
