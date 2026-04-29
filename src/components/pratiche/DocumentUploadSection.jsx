import React, { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { praticheService } from "@/services/pratiche";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, ImageIcon, Trash2, ExternalLink, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const TIPI_DOCUMENTO = [
  "Carta d'identità", "Codice fiscale", "Patente di guida",
  "Busta paga", "CUD / 730", "Visura camerale",
  "Statuto aziendale", "Bilancio", "Partita IVA", "Altro"
];

const STATO_CONFIG = {
  "In attesa":  { icon: Clock,          color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  "Verificato": { icon: CheckCircle2,   color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  "Rifiutato":  { icon: XCircle,        color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  "Da rifare":  { icon: AlertTriangle,  color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
};

const isImage = (name) => /\.(png|jpg|jpeg|gif|webp)$/i.test(name);

export default function DocumentUploadSection({ praticaId }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tipoSelezionato, setTipoSelezionato] = useState("Altro");
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]); // { name, progress }

  const { data: documenti = [], isLoading } = useQuery({
    queryKey: ["documenti", praticaId],
    queryFn: () => praticheService.getDocumenti(praticaId),
    enabled: !!praticaId,
  });

  const uploadFile = useCallback(async (file) => {
    return praticheService.uploadDocumento(praticaId, file, tipoSelezionato);
  }, [praticaId, tipoSelezionato]);

  const handleFiles = useCallback(async (files) => {
    const allowed = Array.from(files).filter(f =>
      f.type === "application/pdf" || f.type.startsWith("image/")
    );
    if (allowed.length === 0) {
      toast({ title: "Formato non supportato", description: "Carica solo PDF o immagini (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadQueue(allowed.map(f => ({ name: f.name })));

    let successCount = 0;
    for (const file of allowed) {
      try {
        await uploadFile(file);
        successCount++;
      } catch (err) {
        toast({ title: `Errore: ${file.name}`, description: err?.message || "Upload fallito", variant: "destructive" });
      }
    }

    setUploading(false);
    setUploadQueue([]);
    if (successCount > 0) {
      qc.invalidateQueries(["documenti", praticaId]);
      toast({ title: `${successCount} documento/i caricato/i con successo` });
    }
  }, [uploadFile, qc, praticaId, toast]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const deleteDoc = async (doc) => {
    await praticheService.deleteDocumento(doc.id, doc.storage_path);
    qc.invalidateQueries(["documenti", praticaId]);
    toast({ title: "Documento rimosso" });
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      <h2 className="font-heading font-semibold text-base mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#71BAED]" />
        Documenti
      </h2>

      {/* Upload zone */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start">
        <Select value={tipoSelezionato} onValueChange={setTipoSelezionato}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tipo documento" />
          </SelectTrigger>
          <SelectContent>
            {TIPI_DOCUMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="w-4 h-4" /> Scegli file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Drag & Drop area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 mb-5 ${
          isDragging
            ? "style={{borderColor:'#71BAED'}} style={{backgroundColor:'#71BAED'}}/5 scale-[1.01]"
            : "border-border/50 hover:style={{borderColor:'#71BAED'}}/40 hover:bg-muted/30"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#71BAED] animate-spin" />
            <p className="text-sm text-muted-foreground">
              Caricamento in corso…
            </p>
            <div className="flex flex-wrap justify-center gap-1 max-w-xs">
              {uploadQueue.map(f => (
                <span key={f.name} className="text-xs bg-muted rounded px-2 py-0.5 truncate max-w-[120px]">{f.name}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#71BAED]/10 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-[#71BAED]" />
            </div>
            <p className="font-semibold text-sm text-foreground mb-1">
              {isDragging ? "Rilascia qui i file" : "Trascina qui i documenti"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WebP — max 20 MB</p>
          </>
        )}
      </div>

      {/* Documents list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Caricamento documenti…</p>
      ) : documenti.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nessun documento caricato.</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {documenti.map((doc) => {
              const stato = STATO_CONFIG[doc.stato_verifica] || STATO_CONFIG["In attesa"];
              const StatoIcon = stato.icon;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/30 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {isImage(doc.nome_file) ? (
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.nome_file}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{doc.tipo_documento}</span>
                      {doc.caricato_da && (
                        <span className="text-xs text-muted-foreground/60">· {doc.caricato_da}</span>
                      )}
                      {doc.created_at && (
                        <span className="text-xs text-muted-foreground/60">
                          · {format(new Date(doc.created_at), "d MMM", { locale: it })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stato verifica */}
                  <span className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${stato.bg}`}>
                    <StatoIcon className={`w-3 h-3 ${stato.color}`} />
                    <span className={stato.color}>{doc.stato_verifica}</span>
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" className="w-7 h-7">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteDoc(doc)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}