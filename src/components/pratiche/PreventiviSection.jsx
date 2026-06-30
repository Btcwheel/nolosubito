import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scaricaPreventivoPDF } from "@/lib/preventivoPrint";
import { preventiviService } from "@/services/preventivi";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Send, Trash2, CheckCircle2, XCircle,
  Car, ChevronUp, Loader2, RotateCcw, Sparkles, Paperclip, Eye, EyeOff, Download, FileText, AlertTriangle,
} from "lucide-react";
import PreventivoModal from "@/components/preventivi/PreventivoModal";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-preventivo`;

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// ─── Constants ───────────────────────────────────────────────────────────────

const ALIMENTAZIONI = [
  "Benzina", "Diesel", "Full Hybrid Benzina", "Full Hybrid Diesel",
  "Plug-in Hybrid", "Elettrica", "Metano", "GPL",
];

const DURATE = [12, 24, 36, 48, 60];

const KM_OPTIONS = [
  { value: 10000,  label: "10.000 km/anno" },
  { value: 15000,  label: "15.000 km/anno" },
  { value: 20000,  label: "20.000 km/anno" },
  { value: 25000,  label: "25.000 km/anno" },
  { value: 30000,  label: "30.000 km/anno" },
  { value: 40000,  label: "40.000 km/anno" },
  { value: 50000,  label: "50.000 km/anno" },
];

const STATUS_CFG = {
  Bozza:     { label: "Bozza",    cls: "bg-muted text-muted-foreground border-border" },
  Inviato:   { label: "Inviato",  cls: "style={{backgroundColor:'#71BAED'}}/10 style={{color:'#71BAED'}} style={{borderColor:'#71BAED'}}/20" },
  Accettato: { label: "Accettato",cls: "bg-fuel-ev/10 text-fuel-ev border-fuel-ev/20" },
  Rifiutato: { label: "Rifiutato",cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

// Codici servizi richiedibili on-demand
const SERVIZI_RICHIEDIBILI = ['AUTO_SOSTITUTIVA', 'CAMBIO_PNEUMATICI'];

const NOLOSUBITO_MAP = {
  'RCA': 'RC Auto',
  'DANNI': 'Copertura Danni',
  'FURTO_INCENDIO': 'Furto e Incendio',
  'FURTO': 'Furto e Incendio',
  'INCENDIO': 'Furto e Incendio',
  'CRISTALLI': 'Cristalli',
  'INFORTUNI': 'Infortuni Conducente',
  'TUTELA_LEGALE': 'Tutela Legale',
  'ATMOSFERICI': 'Eventi Atmosferici',
  'MANUTENZIONE': 'Manutenzione',
  'CAMBIO_PNEUMATICI': 'Cambio Pneumatici',
  'SOCCORSO': 'Soccorso Stradale',
  'AUTO_SOSTITUTIVA': 'Auto Sostitutiva',
  'CONSEGNA': 'Consegna Veicolo',
  'BOLLO': 'Tassa di Proprietà',
  'MULTE': 'Gestione Multe',
  'SINISTRI': 'Gestione Sinistri',
  'FATTURAZIONE': 'Fatturazione Elettronica',
  'IMMATRICOLAZIONE': 'Immatricolazione',
  'TELEMATICA': 'Telematica',
  'SERVIZIO_CLIENTI': 'Servizio Clienti',
};

const BLANK_FORM = {
  veicolo_marca: "", veicolo_modello: "", alimentazione: "",
  veicolo_versione: "", colore_esterno: "", interni: "",
  cambio: "", carrozzeria: "", potenza: "",
  durata_mesi: "", km_annui: "",
  anticipo: "", canone_mensile: "", canone_finale: "",
  quota_veicolo: "", quota_servizi: "",
  deposito_cauzionale: "", valore_listing: "", valore_optional: "", valore_accessori: "",
  note_cliente: "", note_operative: "",
  carrier: "",
  servizi: [],
  servizi_richiesti: [],
};

function formatPenaleServizio(codice, penale) {
  if (penale == null || penale === '') {
    return codice === 'FURTO_INCENDIO' ? 'penale 0%' : '';
  }
  const valore = String(penale).trim();
  if (codice === 'FURTO_INCENDIO') {
    return valore.endsWith('%') ? `penale ${valore}` : `penale ${valore}%`;
  }
  return `penale €${valore}`;
}

function normalizeServiceKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatServizioNota(codice, notaBase, penale, originale = null) {
  const originalNorm = normalizeServiceKey(originale || '');
  const baseNorm = normalizeServiceKey(notaBase || '');
  const originalLooksDetailed = Boolean(
    originalNorm &&
    originalNorm !== baseNorm &&
    (
      originalNorm.includes('penale') ||
      originalNorm.includes('%') ||
      originalNorm.includes('quota') ||
      originalNorm.includes('inclus') ||
      originalNorm.includes('franchigia') ||
      originalNorm.length > baseNorm.length + 8
    )
  );

  if (originalLooksDetailed) {
    return originale;
  }
  if (codice === 'FURTO_INCENDIO') {
    return formatPenaleServizio(codice, penale);
  }
  if (penale != null && penale !== '') {
    return formatPenaleServizio(codice, penale);
  }
  return notaBase || '';
}

function isPresent(value) {
  return value !== null && value !== undefined && value !== "";
}

function toFormNumber(value) {
  if (!isPresent(value)) return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : String(value);
}

async function renderPdfPagesAndText(pdf) {
  const pages = [];
  const textParts = [];
  const maxPages = Math.min(pdf.numPages, 10);
  // Anthropic Vision: max 1568px lato lungo, max 10MB/imma.
  // A4 a scale 1.6 ~ 1900x2700 -> downscale a 1568 lato lungo.
  const MAX_LONG_SIDE = 1568;

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Downscale di sicurezza se eccede il limite Anthropic
    const longSide = Math.max(canvas.width, canvas.height);
    if (longSide > MAX_LONG_SIDE) {
      const ratio = MAX_LONG_SIDE / longSide;
      const out = document.createElement('canvas');
      out.width = Math.round(canvas.width * ratio);
      out.height = Math.round(canvas.height * ratio);
      const outCtx = out.getContext('2d');
      if (outCtx) {
        outCtx.drawImage(canvas, 0, 0, out.width, out.height);
        pages.push(out.toDataURL('image/jpeg', 0.85).split(',')[1]);
      } else {
        pages.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
      }
    } else {
      pages.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
    }

    try {
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item?.str ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) textParts.push(`PAGINA ${i}: ${pageText}`);
    } catch {
      // Scanned PDFs can have no usable text layer.
    }
  }

  return { pages, text: textParts.join('\n\n') };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, required, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}{required && " *"}
      </Label>
      {children}
    </div>
  );
}

function PreventivoCard({ prev, clienteNome, onInvia, onReinvia, onDelete, isLoading, isStaff = true }) {
  const [downloading, setDownloading] = React.useState(false);
  const [preview, setPreview] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try { await scaricaPreventivoPDF(prev, clienteNome); }
    finally { setDownloading(false); }
  };
  const cfg = STATUS_CFG[prev.status] ?? STATUS_CFG.Bozza;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground text-sm">
            {prev.veicolo_marca} {prev.veicolo_modello}
          </p>
          {prev.veicolo_versione && (
            <p className="text-xs text-muted-foreground mt-0.5">{prev.veicolo_versione}</p>
          )}
          {prev.alimentazione && (
            <p className="text-xs text-muted-foreground mt-0.5">{prev.alimentazione}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {prev.status === 'Inviato' && (
            prev.letto_at ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Eye className="size-3.5" />
                Letto {format(new Date(prev.letto_at), "d MMM HH:mm", { locale: it })}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <EyeOff className="size-3.5" />
                Non ancora aperto
              </span>
            )
          )}
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Durata</p>
          <p className="font-semibold">{prev.durata_mesi} mesi</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Km annui</p>
          <p className="font-semibold">{prev.km_annui?.toLocaleString("it-IT")}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Anticipo</p>
          <p className="font-semibold">€{(prev.anticipo || 0).toLocaleString("it-IT")}</p>
        </div>
        <div className="bg-electric/5 border border-electric/15 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Canone</p>
          <p className="font-bold text-electric">€{prev.canone_mensile?.toLocaleString("it-IT")}/mese</p>
        </div>
      </div>

      {/* Canone finale (se disponibile) */}
      {prev.canone_finale && (
        <p className="text-xs text-muted-foreground">
          Canone finale definito: <span className="font-semibold text-foreground">€{prev.canone_finale?.toLocaleString("it-IT")}/mese</span>
        </p>
      )}

      {/* Carrier — visibile solo a staff (admin/backoffice/agente) */}
      {isStaff && prev.carrier && (
        <span className="inline-flex items-center text-xs font-semibold text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2.5 py-0.5">
          {prev.carrier}
        </span>
      )}

      {/* Documento broker originale */}
      {prev.documento_broker_url && (
        <a
          href={prev.documento_broker_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-electric hover:underline w-fit"
        >
          <FileText className="size-3.5" />
          {prev.documento_broker_nome || "Preventivo broker originale"}
        </a>
      )}

      {/* Note cliente */}
      {prev.note_cliente && (
        <div className="bg-muted/20 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Nota al cliente: </span>
          {prev.note_cliente}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Creato: {format(new Date(prev.created_at), "d MMM yyyy", { locale: it })}</span>
        {prev.inviato_at && (
          <span>Inviato: {format(new Date(prev.inviato_at), "d MMM yyyy HH:mm", { locale: it })}</span>
        )}
        {prev.accettato_at && (
          <span className="text-fuel-ev font-medium">
            <CheckCircle2 className="size-3 inline mr-0.5" />
            Accettato: {format(new Date(prev.accettato_at), "d MMM yyyy HH:mm", { locale: it })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPreview(true)}
          className="gap-1.5 text-muted-foreground"
        >
          <FileText className="size-3.5" />
          Anteprima
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-1.5 text-muted-foreground"
        >
          {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          PDF
        </Button>
        {prev.status === "Bozza" && (
          <>
            <Button
              size="sm"
              onClick={() => onInvia(prev.id)}
              disabled={isLoading}
              className="bg-electric hover:bg-electric/90 text-white gap-1.5 flex-1"
            >
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Invia al Cliente
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(prev.id)}
              disabled={isLoading}
              className="border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
        {prev.status === "Inviato" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReinvia(prev.id)}
            disabled={isLoading}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reinvia email
          </Button>
        )}
        {prev.status === "Accettato" && (
          <div className="flex items-center gap-1.5 text-fuel-ev text-xs font-medium">
            <CheckCircle2 className="size-4" /> Cliente ha accettato
          </div>
        )}
        {prev.status === "Rifiutato" && (
          <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
            <XCircle className="size-4" /> Cliente ha rifiutato
          </div>
        )}
      </div>
      <PreventivoModal
        preventivo={prev}
        clienteNome={clienteNome}
        open={preview}
        onClose={() => setPreview(false)}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PreventiviSection({ praticaId, clienteNome }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [extracting, setExtracting] = useState(false);
  const [brokerFile, setBrokerFile] = useState(null);
  const [limitModal, setLimitModal] = useState({ open: false, inclusiCount: 0, richiestiCount: 0 });
  const [servizioDaAggiungere, setServizioDaAggiungere] = useState("");
  const fileInputRef = useRef(null);
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  async function handleBrokerFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Formato non supportato. Usa PDF, JPG o PNG.', variant: 'destructive' });
      return;
    }

    setExtracting(true);
    if (!showForm) setShowForm(true);

    function calcRichiedibili(estrattiServizi) {
      const codiciInclusi = new Set(
        (estrattiServizi || []).map((s) => {
          const obj = (typeof s === 'string' && s.startsWith('{'))
            ? (() => { try { return JSON.parse(s); } catch(e) { return null; } })()
            : s;
          return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj.codice : null;
        }).filter(Boolean),
      );
      return SERVIZI_RICHIEDIBILI
        .filter((cod) => !codiciInclusi.has(cod))
        .map((codice) => ({ codice, richiesto: false, prezzo: null }));
    }

    try {
      if (file.type === 'application/pdf') {
        // Polyfill per browser che non supportano Promise.withResolvers (ES2024)
        if (typeof Promise.withResolvers === 'undefined') {
          Promise.withResolvers = function() {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            return { promise, resolve, reject };
          };
        }
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
        const buffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: buffer }).promise;

        // Renderizza le prime 3 pagine come immagini JPEG — Claude Vision legge
        // le tabelle dei servizi correttamente, il testo grezzo le distorce
        const { pages, text } = await renderPdfPagesAndText(pdf);

        const res = await fetch(ANALYZE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ pages, text }),
        });
        const { data: extracted, error } = await res.json();
        if (error) throw new Error(error);

        const kmValue = extracted.km_annui
          ? KM_OPTIONS.find(k => Math.abs(k.value - Number(extracted.km_annui)) < 2500)?.value ?? extracted.km_annui
          : '';
        const durataValue = extracted.durata_mesi
          ? DURATE.find(d => d === Number(extracted.durata_mesi)) ?? ''
          : '';

        function calcRichiedibili(estrattiServizi) {
          const codiciInclusi = new Set(
            (estrattiServizi || []).map((s) => (s && typeof s === 'object' && !Array.isArray(s) ? s.codice : null)).filter(Boolean),
          );
          return SERVIZI_RICHIEDIBILI
            .filter((cod) => !codiciInclusi.has(cod))
            .map((codice) => ({ codice, richiesto: false, prezzo: null }));
        }

        const applyExtraction = (prev) => {
          const nuoviServizi = extracted.servizi?.length ? extracted.servizi : prev.servizi;
          return {
            ...prev,
            veicolo_marca:        extracted.veicolo_marca || prev.veicolo_marca,
            veicolo_modello:      extracted.veicolo_modello || prev.veicolo_modello,
            veicolo_versione:     extracted.veicolo_versione || extracted.veicolo_allestimento || prev.veicolo_versione,
            alimentazione:        extracted.alimentazione || prev.alimentazione,
            colore_esterno:       extracted.colore_esterno || prev.colore_esterno,
            interni:              extracted.interni || prev.interni,
            cambio:               extracted.cambio || prev.cambio,
            carrozzeria:          extracted.carrozzeria || prev.carrozzeria,
            potenza:              isPresent(extracted.potenza) ? toFormNumber(extracted.potenza) : prev.potenza,
            durata_mesi:          durataValue ? String(durataValue) : prev.durata_mesi,
            km_annui:             kmValue ? String(kmValue) : prev.km_annui,
            anticipo:             isPresent(extracted.anticipo) ? toFormNumber(extracted.anticipo) : prev.anticipo,
            deposito_cauzionale:  isPresent(extracted.deposito_cauzionale) ? toFormNumber(extracted.deposito_cauzionale) : prev.deposito_cauzionale,
            canone_mensile:       isPresent(extracted.canone_mensile) ? toFormNumber(extracted.canone_mensile) : prev.canone_mensile,
            quota_veicolo:        isPresent(extracted.quota_veicolo) ? toFormNumber(extracted.quota_veicolo) : prev.quota_veicolo,
            quota_servizi:        isPresent(extracted.quota_servizi) ? toFormNumber(extracted.quota_servizi) : prev.quota_servizi,
            valore_listing:       isPresent(extracted.valore_listing) ? toFormNumber(extracted.valore_listing) : prev.valore_listing,
            valore_optional:      isPresent(extracted.valore_optional) ? toFormNumber(extracted.valore_optional) : prev.valore_optional,
            valore_accessori:     isPresent(extracted.valore_accessori) ? toFormNumber(extracted.valore_accessori) : prev.valore_accessori,
            carrier:              extracted.carrier || prev.carrier,
            servizi:              nuoviServizi,
            servizi_richiesti:    calcRichiedibili(nuoviServizi),
            note_operative:       extracted.note_aggiuntive || prev.note_operative,
          };
        };

        setForm(applyExtraction);

        setBrokerFile(file);
        toast({ title: `Preventivo broker caricato — controlla e aggiusta i campi.` });
        setExtracting(false);
        return; // early return: tutto già gestito
      } else {
        // Immagine: invia direttamente come base64
        const b64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result.split(',')[1]);
          reader.readAsDataURL(file);
        });

        const res = await fetch(ANALYZE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ base64: b64, mediaType: file.type }),
        });
        const { data: extracted, error } = await res.json();
        if (error) throw new Error(error);

        const kmValue = extracted.km_annui
          ? KM_OPTIONS.find(k => Math.abs(k.value - Number(extracted.km_annui)) < 2500)?.value ?? extracted.km_annui
          : '';
        const durataValue = extracted.durata_mesi
          ? DURATE.find(d => d === Number(extracted.durata_mesi)) ?? ''
          : '';

        setForm((prev) => {
          const imgServizi = extracted.servizi?.length ? extracted.servizi : prev.servizi;
          return {
            ...prev,
            veicolo_marca:        extracted.veicolo_marca || prev.veicolo_marca,
            veicolo_modello:      extracted.veicolo_modello || prev.veicolo_modello,
            veicolo_versione:     extracted.veicolo_versione || extracted.veicolo_allestimento || prev.veicolo_versione,
            alimentazione:        extracted.alimentazione || prev.alimentazione,
            colore_esterno:       extracted.colore_esterno || prev.colore_esterno,
            interni:              extracted.interni || prev.interni,
            cambio:               extracted.cambio || prev.cambio,
            carrozzeria:          extracted.carrozzeria || prev.carrozzeria,
            potenza:              isPresent(extracted.potenza) ? toFormNumber(extracted.potenza) : prev.potenza,
            durata_mesi:          durataValue ? String(durataValue) : prev.durata_mesi,
            km_annui:             kmValue ? String(kmValue) : prev.km_annui,
            anticipo:             isPresent(extracted.anticipo) ? toFormNumber(extracted.anticipo) : prev.anticipo,
            deposito_cauzionale:  isPresent(extracted.deposito_cauzionale) ? toFormNumber(extracted.deposito_cauzionale) : prev.deposito_cauzionale,
            canone_mensile:       isPresent(extracted.canone_mensile) ? toFormNumber(extracted.canone_mensile) : prev.canone_mensile,
            quota_veicolo:        isPresent(extracted.quota_veicolo) ? toFormNumber(extracted.quota_veicolo) : prev.quota_veicolo,
            quota_servizi:        isPresent(extracted.quota_servizi) ? toFormNumber(extracted.quota_servizi) : prev.quota_servizi,
            valore_listing:       isPresent(extracted.valore_listing) ? toFormNumber(extracted.valore_listing) : prev.valore_listing,
            valore_optional:      isPresent(extracted.valore_optional) ? toFormNumber(extracted.valore_optional) : prev.valore_optional,
            valore_accessori:     isPresent(extracted.valore_accessori) ? toFormNumber(extracted.valore_accessori) : prev.valore_accessori,
            carrier:              extracted.carrier || prev.carrier,
            servizi:              imgServizi,
            servizi_richiesti:    calcRichiedibili(imgServizi),
            note_operative:       extracted.note_aggiuntive || prev.note_operative,
          };
        });

        setBrokerFile(file);
        toast({ title: `Preventivo broker caricato — controlla e aggiusta i campi.` });
      }
    } catch (err) {
      toast({ title: "Errore nell'analisi del documento", description: String(err), variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  }

  const { data: preventivi = [], isLoading } = useQuery({
    queryKey: ["preventivi", praticaId],
    queryFn: () => preventiviService.list(praticaId),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      return data;
    },
    staleTime: 300000,
  });
  const isStaff = profile?.role && ['admin', 'backoffice', 'agente'].includes(profile.role);

  const invalidate = () => {
    qc.invalidateQueries(["preventivi", praticaId]);
    qc.invalidateQueries(["pratica", praticaId]);
    qc.invalidateQueries(["pratiche-admin"]);
    qc.invalidateQueries(["pratiche-agente"]);
  };

  const createMut = useMutation({
    mutationFn: () => preventiviService.create({
      pratica_id:     praticaId,
      veicolo_marca:  form.veicolo_marca.trim(),
      veicolo_modello: form.veicolo_modello.trim(),
      veicolo_versione: form.veicolo_versione.trim() || null,
      alimentazione:  form.alimentazione || null,
      colore_esterno: form.colore_esterno.trim() || null,
      interni:        form.interni.trim() || null,
      cambio:         form.cambio.trim() || null,
      carrozzeria:    form.carrozzeria.trim() || null,
      potenza:        form.potenza !== "" ? parseInt(form.potenza, 10) : null,
      durata_mesi:    parseInt(form.durata_mesi),
      km_annui:       parseInt(form.km_annui),
      anticipo:       form.anticipo ? parseFloat(form.anticipo) : 0,
      deposito_cauzionale: form.deposito_cauzionale !== "" ? parseFloat(form.deposito_cauzionale) : null,
      canone_mensile: parseFloat(form.canone_mensile),
      canone_finale:  form.canone_finale ? parseFloat(form.canone_finale) : null,
      quota_veicolo:  form.quota_veicolo !== "" ? parseFloat(form.quota_veicolo) : null,
      quota_servizi:  form.quota_servizi !== "" ? parseFloat(form.quota_servizi) : null,
      valore_listing: form.valore_listing !== "" ? parseFloat(form.valore_listing) : null,
      valore_optional: form.valore_optional !== "" ? parseFloat(form.valore_optional) : null,
      valore_accessori: form.valore_accessori !== "" ? parseFloat(form.valore_accessori) : null,
      note_cliente:   form.note_cliente.trim() || null,
      note_operative: form.note_operative.trim() || null,
      carrier:        form.carrier.trim() || null,
      servizi:        form.servizi,
      servizi_richiesti: form.servizi_richiesti?.length ? form.servizi_richiesti : [],
    }),
    onSuccess: async (created) => {
      // Se c'era un PDF broker, caricalo su Storage rinominato con il codice
      if (brokerFile) {
        try {
          await preventiviService.uploadDocumentoBroker(created.id, created.created_at, brokerFile);
        } catch (e) {
          console.warn('[preventivi] upload broker doc fallito:', e.message);
        }
        setBrokerFile(null);
      }
      invalidate();
      setForm(BLANK_FORM);
      setShowForm(false);
      toast({ title: "Preventivo salvato come bozza" });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const inviaMut = useMutation({
    mutationFn: (id) => preventiviService.invia(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Preventivo inviato al cliente", description: "Email inviata." });
    },
    onError: (e) => toast({ title: "Errore invio", description: e.message, variant: "destructive" }),
  });

  const reinviaMut = useMutation({
    mutationFn: (id) => preventiviService.invia(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Email reinviata" });
    },
    onError: (e) => toast({ title: "Errore reinvio", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => preventiviService.delete(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Preventivo eliminato" });
    },
    onError: (e) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const isMutating = inviaMut.isPending || reinviaMut.isPending || deleteMut.isPending;

  const canSubmit =
    form.veicolo_marca.trim() &&
    form.veicolo_modello.trim() &&
    form.durata_mesi &&
    form.km_annui &&
    form.canone_mensile;

  const handleSaveClick = () => {
    const inclusiCount = form.servizi?.length || 0;
    const richiestiCount = form.servizi_richiesti?.length || 0;
    if (inclusiCount > 12 || richiestiCount > 3) {
      setLimitModal({ open: true, inclusiCount, richiestiCount });
      return;
    }
    createMut.mutate();
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold text-base">Preventivi</h2>
          {preventivi.length > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {preventivi.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleBrokerFile}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={extracting}
            className="gap-1.5 text-xs"
          >
            {extracting ? (
              <><Sparkles className="size-3.5 animate-pulse text-electric" />Analisi AI...</>
            ) : (
              <><Paperclip className="size-3.5" />Carica preventivo broker</>
            )}
          </Button>
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? "" : "gap-1.5"}
          >
            {showForm ? (
              <><ChevronUp className="size-3.5" /> Annulla</>
            ) : (
              <><Plus className="size-3.5" /> Nuovo</>
            )}
          </Button>
        </div>
      </div>

      {/* ── New preventivo form ── */}
      {showForm && (
        <div className="border border-border/50 rounded-xl p-4 bg-muted/10 mb-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">
            Nuovo preventivo
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Veicolo */}
            <div className="space-y-4">
              <FieldGroup label="Marca" required>
                <Input
                  value={form.veicolo_marca}
                  onChange={(e) => set("veicolo_marca", e.target.value)}
                  placeholder="es. Volkswagen"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="Modello" required>
                <Input
                  value={form.veicolo_modello}
                  onChange={(e) => set("veicolo_modello", e.target.value)}
                  placeholder="es. Golf 1.5 eTSI"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="Versione / allestimento">
                <Input
                  value={form.veicolo_versione}
                  onChange={(e) => set("veicolo_versione", e.target.value)}
                  placeholder="es. Style / R-Line"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="Alimentazione">
                <Select value={form.alimentazione} onValueChange={(v) => set("alimentazione", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                  <SelectContent>
                    {ALIMENTAZIONI.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Colore esterno">
                  <Input
                    value={form.colore_esterno}
                    onChange={(e) => set("colore_esterno", e.target.value)}
                    placeholder="es. Nero pastello"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Interni">
                  <Input
                    value={form.interni}
                    onChange={(e) => set("interni", e.target.value)}
                    placeholder="es. Tessuto nero"
                    className="h-10"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Cambio">
                  <Input
                    value={form.cambio}
                    onChange={(e) => set("cambio", e.target.value)}
                    placeholder="es. Automatico"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Carrozzeria">
                  <Input
                    value={form.carrozzeria}
                    onChange={(e) => set("carrozzeria", e.target.value)}
                    placeholder="es. SUV"
                    className="h-10"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Potenza">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.potenza}
                    onChange={(e) => set("potenza", e.target.value)}
                    placeholder="es. 110"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Deposito cauzionale (€)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deposito_cauzionale}
                    onChange={(e) => set("deposito_cauzionale", e.target.value)}
                    placeholder="0"
                    className="h-10"
                  />
                </FieldGroup>
              </div>
            </div>

            {/* Configurazione */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Durata (mesi)" required>
                  <Select value={form.durata_mesi} onValueChange={(v) => set("durata_mesi", v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Mesi" /></SelectTrigger>
                    <SelectContent>
                      {DURATE.map((d) => <SelectItem key={d} value={String(d)}>{d} mesi</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Km annui" required>
                  <Select value={form.km_annui} onValueChange={(v) => set("km_annui", v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Km" /></SelectTrigger>
                    <SelectContent>
                      {KM_OPTIONS.map((k) => <SelectItem key={k.value} value={String(k.value)}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldGroup label="Anticipo (€)">
                  <Input
                    type="number" min="0" step="100"
                    value={form.anticipo}
                    onChange={(e) => set("anticipo", e.target.value)}
                    placeholder="0"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Canone/mese (€)" required>
                  <Input
                    type="number" min="0" step="1"
                    value={form.canone_mensile}
                    onChange={(e) => set("canone_mensile", e.target.value)}
                    placeholder="399"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Canone finale (€)">
                  <Input
                    type="number" min="0" step="1"
                    value={form.canone_finale}
                    onChange={(e) => set("canone_finale", e.target.value)}
                    placeholder="Opz."
                    className="h-10"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldGroup label="Quota Veicolo (€)">
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.quota_veicolo}
                    onChange={(e) => set("quota_veicolo", e.target.value)}
                    placeholder="Dal preventivo broker"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Quota Servizi (€)">
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.quota_servizi}
                    onChange={(e) => set("quota_servizi", e.target.value)}
                    placeholder="Dal preventivo broker"
                    className="h-10"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldGroup label="Valore listino (€)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valore_listing}
                    onChange={(e) => set("valore_listing", e.target.value)}
                    placeholder="es. 28000"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Valore optional (€)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valore_optional}
                    onChange={(e) => set("valore_optional", e.target.value)}
                    placeholder="es. 1500"
                    className="h-10"
                  />
                </FieldGroup>
                <FieldGroup label="Valore accessori (€)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valore_accessori}
                    onChange={(e) => set("valore_accessori", e.target.value)}
                    placeholder="es. 500"
                    className="h-10"
                  />
                </FieldGroup>
              </div>
            </div>
          </div>

          {/* Servizi inclusi — checklist editabile */}
          {form.servizi.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Servizi inclusi nel PDF broker — deseleziona quelli NON presenti
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {form.servizi.map((s, idx) => {
                  const obj = (typeof s === 'string' && s.startsWith('{'))
                    ? (() => { try { return JSON.parse(s); } catch(e) { return s; } })()
                    : s;
                  const display = (() => {
                    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                      const nome = NOLOSUBITO_MAP[obj.codice] || obj.codice || obj.originale || '';
                      const nota = formatServizioNota(obj.codice, nome, obj.penale, obj.originale);
                      const penale = nota ? ` — ${nota}` : '';
                      return `${nome}${penale}`;
                    }
                    // Vecchio formato [canonical, original]
                    const [canonical, original] = Array.isArray(obj) ? obj : [obj, null];
                    const nome = NOLOSUBITO_MAP[canonical] || canonical;
                    return original ? `${nome} (${original})` : nome;
                  })();
                  return (
                    <label key={idx} className="flex items-center gap-2 text-xs cursor-pointer select-none bg-muted/20 rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => set("servizi", form.servizi.filter((_, i) => i !== idx))}
                        className="size-3.5 accent-electric"
                      />
                      <span className="text-foreground">{display}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aggiungi servizio mancante */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Aggiungi servizio mancante
            </p>
            <div className="flex gap-2">
              <Select value={servizioDaAggiungere} onValueChange={setServizioDaAggiungere}>
                <SelectTrigger className="h-9 text-xs flex-1">
                  <SelectValue placeholder="Seleziona un servizio..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const codiciInclusi = new Set(
                      form.servizi.map((s) => {
                        const obj = (typeof s === 'string' && s.startsWith('{'))
                          ? (() => { try { return JSON.parse(s); } catch(e) { return null; } })()
                          : s;
                        return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj.codice : null;
                      }).filter(Boolean),
                    );
                    return Object.entries(NOLOSUBITO_MAP)
                      .filter(([codice]) => !codiciInclusi.has(codice))
                      .map(([codice, nome]) => (
                        <SelectItem key={codice} value={codice} className="text-xs">{nome}</SelectItem>
                      ));
                  })()}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                disabled={!servizioDaAggiungere}
                onClick={() => {
                  if (!servizioDaAggiungere) return;
                  set("servizi", [...form.servizi, { codice: servizioDaAggiungere, penale: null, originale: null }]);
                  setServizioDaAggiungere("");
                }}
              >
                Aggiungi
              </Button>
            </div>
          </div>

          {/* Servizi richiedibili */}
          {form.servizi.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Servizi aggiuntivi richiedibili dal cliente
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(() => {
                  const codiciInclusi = new Set(
                    form.servizi.map((s) => {
                      const obj = (typeof s === 'string' && s.startsWith('{'))
                        ? (() => { try { return JSON.parse(s); } catch(e) { return null; } })()
                        : s;
                      return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj.codice : null;
                    }).filter(Boolean),
                  );
                  const serviziMancanti = SERVIZI_RICHIEDIBILI.filter((cod) => !codiciInclusi.has(cod));
                  if (serviziMancanti.length === 0) return <p className="text-xs text-muted-foreground italic col-span-full">Tutti i servizi richiedibili sono già inclusi</p>;
                  return serviziMancanti.map((codice) => {
                    const giaRichiesto = form.servizi_richiesti?.find((sr) => sr.codice === codice);
                    const nome = NOLOSUBITO_MAP[codice] || codice.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
                    return (
                      <label key={codice} className="flex items-center gap-2 text-xs cursor-pointer select-none bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 hover:bg-amber-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={giaRichiesto?.richiesto || false}
                          onChange={() => {
                            if (giaRichiesto) {
                              set("servizi_richiesti", form.servizi_richiesti.map((sr) =>
                                sr.codice === codice ? { ...sr, richiesto: !sr.richiesto } : sr,
                              ));
                            } else {
                              set("servizi_richiesti", [...(form.servizi_richiesti || []), { codice, richiesto: true, prezzo: null }]);
                            }
                          }}
                          className="size-3.5 accent-amber-600"
                        />
                        <span className="text-foreground">{nome}</span>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Nota per il cliente (visibile nell'email)">
              <Textarea
                value={form.note_cliente}
                onChange={(e) => set("note_cliente", e.target.value)}
                placeholder="Include anche: servizi, garanzie, ecc."
                className="h-20 resize-none text-sm"
              />
            </FieldGroup>
            <FieldGroup label="Nota operativa (solo interna)">
              <Textarea
                value={form.note_operative}
                onChange={(e) => set("note_operative", e.target.value)}
                placeholder="Note interne, broker, margine…"
                className="h-20 resize-none text-sm"
              />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(BLANK_FORM); setBrokerFile(null); }}>
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={!canSubmit || createMut.isPending}
              className="bg-navy hover:bg-navy-dark text-white gap-1.5"
            >
              {createMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Salva bozza
            </Button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : preventivi.length === 0 ? (
        <div className="text-center py-8">
          <Car className="size-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nessun preventivo ancora.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Clicca "Nuovo Preventivo" per crearne uno.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {preventivi.map((p) => (
            <PreventivoCard
              key={p.id}
              prev={p}
              clienteNome={clienteNome}
              onInvia={(id) => inviaMut.mutate(id)}
              onReinvia={(id) => reinviaMut.mutate(id)}
              onDelete={(id) => deleteMut.mutate(id)}
              isLoading={isMutating}
              isStaff={isStaff}
            />
          ))}
        </div>
      )}

      <Dialog open={limitModal.open} onOpenChange={(open) => setLimitModal((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-destructive" />
              Limite servizi superato
            </DialogTitle>
            <DialogDescription className="text-sm">
              Il PDF preventivo può contenere massimo <strong>12 servizi inclusi</strong> e <strong>3 servizi su richiesta</strong>.
              <br /><br />
              Attualmente hai <strong>{limitModal.inclusiCount} servizi inclusi</strong> e <strong>{limitModal.richiestiCount} servizi su richiesta</strong>.
              <br /><br />
              I servizi in eccesso non verranno mostrati nel PDF. Puoi eliminarli, spostarli nelle note per il cliente, o salvare comunque.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLimitModal((prev) => ({ ...prev, open: false }))}>
              Torna indietro
            </Button>
            <Button
              onClick={() => {
                setLimitModal((prev) => ({ ...prev, open: false }));
                createMut.mutate();
              }}
              className="bg-navy hover:bg-navy-dark text-white"
            >
              Salva comunque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
