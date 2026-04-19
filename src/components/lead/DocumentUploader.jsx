import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, X, FileText, CheckCircle2, AlertCircle,
  AlertTriangle, Loader2, ShieldCheck, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const REQUIRED_DOCS = {
  "Privato": [
    { id: "buste_paga", label: "Ultime 2 buste paga", required: true },
    { id: "cud", label: "CUD (Certificazione Unica)", required: true },
    { id: "documento_identita", label: "Documento di identità", required: true },
    { id: "patente", label: "Patente di guida", required: true },
    { id: "iban", label: "Coordinate bancarie (IBAN)", required: true },
  ],
  "P.IVA": [
    { id: "modello_unico", label: "Modello Unico + ricevuta presentazione", required: true },
    { id: "provvisorio", label: "Provvisorio anno prec. + ricevuta", required: true },
    { id: "documento_identita", label: "Documento di identità", required: true },
    { id: "patente", label: "Patente di guida", required: true },
    { id: "iban", label: "IBAN bancario", required: true },
  ],
  "Azienda": [
    { id: "bilancio", label: "Ultimo bilancio + ricevuta presentazione", required: true },
    { id: "doc_amministratore", label: "Documento identità amministratore", required: true },
    { id: "visura_camerale", label: "Visura camerale (< 6 mesi)", required: true },
    { id: "iban", label: "IBAN aziendale", required: true },
  ],
};

const SESSION_ID = crypto.randomUUID();

export default function DocumentUploader({ clientType, onDocumentsChange }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const requiredDocs = REQUIRED_DOCS[clientType] || REQUIRED_DOCS["Privato"];

  const handleFileSelect = async (e, docId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(docId);
    const newFiles = [];

    try {
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `temp/${SESSION_ID}/${docId}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('documenti').upload(path, file);
        if (error) throw error;
        newFiles.push({ docId, name: file.name, path, type: file.type, size: file.size });
      }
    } finally {
      setUploading(null);
      e.target.value = "";
    }

    const updated = [...uploadedFiles.filter(f => f.docId !== docId), ...newFiles];
    setUploadedFiles(updated);
    onDocumentsChange?.(updated);
    setVerificationResult(null);
  };

  const removeFile = (docId) => {
    const updated = uploadedFiles.filter(f => f.docId !== docId);
    setUploadedFiles(updated);
    onDocumentsChange?.(updated);
    setVerificationResult(null);
  };

  // Sprint 5: real verification via Edge Function + Claude API
  const verifyDocuments = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800));
    const missing = requiredDocs.filter(d => !uploadedFiles.find(f => f.docId === d.id));
    setVerificationResult(
      missing.length === 0
        ? {
            status: "COMPLETO",
            summary: "Tutti i documenti sono stati caricati correttamente.",
            ok: uploadedFiles.map(f => f.name),
          }
        : {
            status: "PARZIALE",
            summary: "Alcuni documenti obbligatori mancano.",
            missing: missing.map(d => d.label),
          }
    );
    setVerifying(false);
  };

  const uploadedCount = requiredDocs.filter(d => uploadedFiles.find(f => f.docId === d.id)).length;
  const allUploaded = uploadedCount === requiredDocs.length;

  return (
    <div className="space-y-5">
      {/* Document list */}
      <div className="space-y-2">
        {requiredDocs.map((doc) => {
          const file = uploadedFiles.find(f => f.docId === doc.id);
          const isUploading = uploading === doc.id;

          return (
            <div
              key={doc.id}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                file ? "border-green-200 bg-green-50" : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  file ? "bg-green-100" : "bg-muted"
                }`}>
                  {file
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <FileText className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${file ? "text-green-800" : "text-foreground"}`}>
                    {doc.label}
                  </p>
                  {file && (
                    <p className="text-xs text-green-600 truncate">{file.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file ? (
                  <button
                    onClick={() => removeFile(doc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <input
                      type="file"
                      id={`file-${doc.id}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.heic"
                      multiple={doc.id === "buste_paga"}
                      onChange={(e) => handleFileSelect(e, doc.id)}
                    />
                    <label
                      htmlFor={`file-${doc.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isUploading
                          ? "bg-muted text-muted-foreground"
                          : "bg-electric/10 text-electric hover:bg-electric/20"
                      }`}
                    >
                      {isUploading ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Caricamento…</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Carica</>
                      )}
                    </label>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {uploadedCount} / {requiredDocs.length} documenti caricati
        </span>
        <span className={`font-semibold ${allUploaded ? "text-green-600" : "text-orange-500"}`}>
          {allUploaded ? "Completo ✓" : "Incompleto"}
        </span>
      </div>

      {/* Verify button */}
      {uploadedFiles.length > 0 && (
        <Button
          type="button"
          onClick={verifyDocuments}
          disabled={verifying}
          variant="outline"
          className="w-full border-electric/30 text-electric hover:bg-electric/5 font-semibold cursor-pointer"
        >
          {verifying ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifica in corso…</>
          ) : (
            <><ShieldCheck className="w-4 h-4 mr-2" /> Verifica Documenti</>
          )}
        </Button>
      )}

      {/* Verification result */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border p-4 space-y-3 ${
              verificationResult.status === "COMPLETO"
                ? "bg-green-50 border-green-200"
                : verificationResult.status === "PARZIALE"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationResult.status === "COMPLETO" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              ) : verificationResult.status === "PARZIALE" ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <Badge className={
                verificationResult.status === "COMPLETO"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : verificationResult.status === "PARZIALE"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }>
                {verificationResult.status}
              </Badge>
            </div>

            <p className={`text-sm font-medium ${
              verificationResult.status === "COMPLETO" ? "text-green-800"
              : verificationResult.status === "PARZIALE" ? "text-yellow-800"
              : "text-red-800"
            }`}>
              {verificationResult.summary}
            </p>

            {verificationResult.missing?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">Mancanti:</p>
                <ul className="space-y-1">
                  {verificationResult.missing.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <X className="w-3 h-3 shrink-0 mt-0.5" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verificationResult.ok?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Verificati:</p>
                <ul className="space-y-1">
                  {verificationResult.ok.map((o, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-green-700">
                      <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={verifyDocuments}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Ri-verifica
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
