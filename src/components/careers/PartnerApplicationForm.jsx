import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2, CheckCircle, X, Upload, FileText } from "lucide-react";

export default function PartnerApplicationForm({ onCancel }) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    vatNumber: "",
    profileType: "",
    region: "",
    experience: "",
    motivation: "",
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "cv") setCvFile(file);
    else setCoverFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    let cvUrl = null;
    let coverUrl = null;

    if (cvFile) {
      const path = `partner-applications/${Date.now()}-cv-${cvFile.name}`;
      await supabase.storage.from('documenti').upload(path, cvFile);
      const { data: { publicUrl } } = supabase.storage.from('documenti').getPublicUrl(path);
      cvUrl = publicUrl;
    }
    if (coverFile) {
      const path = `partner-applications/${Date.now()}-cover-${coverFile.name}`;
      await supabase.storage.from('documenti').upload(path, coverFile);
      const { data: { publicUrl } } = supabase.storage.from('documenti').getPublicUrl(path);
      coverUrl = publicUrl;
    }

    // Save candidatura to DB (email via Edge Function — Sprint 5)
    await supabase.from('leads').insert({
      nome: `${form.firstName} ${form.lastName}`,
      email: form.email,
      telefono: form.phone,
      messaggio: `[CANDIDATURA PARTNER] Tipo: ${form.profileType} | Regione: ${form.region} | Esperienza: ${form.experience} | Motivazione: ${form.motivation}`,
      fonte: 'partner-application',
    });

    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 max-w-lg mx-auto"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="font-heading font-bold text-2xl text-foreground mb-3">Candidatura Inviata!</h3>
        <p className="text-muted-foreground">
          Grazie per il tuo interesse! Il nostro team partner ti contatterà entro <strong>48 ore</strong> per un colloquio conoscitivo gratuito.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-foreground">Candidatura Partner</h2>
          <p className="text-muted-foreground mt-1">Compila il form — ti risponderemo entro 48 ore.</p>
        </div>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal info */}
        <div className="p-6 bg-card border border-border/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Dati Personali</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Nome *</Label>
              <Input required value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} placeholder="Mario" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-medium">Cognome *</Label>
              <Input required value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} placeholder="Rossi" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-medium">Email *</Label>
              <Input required type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="mario@esempio.it" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-medium">Telefono *</Label>
              <Input required type="tel" value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="+39 333 1234567" className="mt-1.5 h-11" />
            </div>
          </div>
        </div>

        {/* Professional profile */}
        <div className="p-6 bg-card border border-border/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Profilo Professionale</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Tipo di Profilo *</Label>
              <Select required value={form.profileType} onValueChange={v => handleChange("profileType", v)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agenzia Auto">Agenzia Auto</SelectItem>
                  <SelectItem value="Consulente Aziendale">Consulente Aziendale</SelectItem>
                  <SelectItem value="Broker Assicurativo">Broker Assicurativo</SelectItem>
                  <SelectItem value="Agente di Commercio">Agente di Commercio</SelectItem>
                  <SelectItem value="P.IVA Individuale">P.IVA Individuale</SelectItem>
                  <SelectItem value="Altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Regione *</Label>
              <Select required value={form.region} onValueChange={v => handleChange("region", v)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Seleziona regione..." />
                </SelectTrigger>
                <SelectContent>
                  {["Lombardia","Lazio","Campania","Sicilia","Veneto","Emilia-Romagna","Piemonte","Puglia","Toscana","Calabria","Sardegna","Liguria","Marche","Abruzzo","Trentino-Alto Adige","Friuli-Venezia Giulia","Umbria","Basilicata","Molise","Valle d'Aosta"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Ragione Sociale / Nome Studio</Label>
              <Input value={form.companyName} onChange={e => handleChange("companyName", e.target.value)} placeholder="Rossi Auto S.r.l." className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-medium">Partita IVA</Label>
              <Input value={form.vatNumber} onChange={e => handleChange("vatNumber", e.target.value)} placeholder="IT12345678901" className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Esperienza nel settore auto / noleggio *</Label>
            <Select required value={form.experience} onValueChange={v => handleChange("experience", v)}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue placeholder="Anni di esperienza..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nessuna esperienza">Nessuna esperienza (voglio iniziare)</SelectItem>
                <SelectItem value="Meno di 1 anno">Meno di 1 anno</SelectItem>
                <SelectItem value="1-3 anni">1–3 anni</SelectItem>
                <SelectItem value="3-5 anni">3–5 anni</SelectItem>
                <SelectItem value="Oltre 5 anni">Oltre 5 anni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Motivation */}
        <div className="p-6 bg-card border border-border/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Motivazione</h3>
          <div>
            <Label className="text-xs font-medium">Perché vuoi diventare partner Nolosubito? *</Label>
            <Textarea
              required
              value={form.motivation}
              onChange={e => handleChange("motivation", e.target.value)}
              placeholder="Raccontaci la tua situazione attuale e cosa ti aspetti dalla partnership con Nolosubito..."
              className="mt-1.5 h-28"
            />
          </div>
        </div>

        {/* File uploads */}
        <div className="p-6 bg-card border border-border/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Documenti (opzionale)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">CV / Profilo Professionale</Label>
              <label className={`mt-1.5 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${cvFile ? "style={{borderColor:'#71BAED'}}/50 style={{backgroundColor:'#71BAED'}}/5" : "border-border/50 hover:style={{borderColor:'#71BAED'}}/30 hover:bg-muted/50"}`}>
                {cvFile ? (
                  <>
                    <FileText className="w-5 h-5 text-[#71BAED]" />
                    <span className="text-xs text-[#71BAED] font-medium truncate max-w-[160px]">{cvFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Carica CV (PDF, DOC)</span>
                  </>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleFileChange(e, "cv")} />
              </label>
            </div>
            <div>
              <Label className="text-xs font-medium">Lettera di Presentazione</Label>
              <label className={`mt-1.5 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${coverFile ? "style={{borderColor:'#71BAED'}}/50 style={{backgroundColor:'#71BAED'}}/5" : "border-border/50 hover:style={{borderColor:'#71BAED'}}/30 hover:bg-muted/50"}`}>
                {coverFile ? (
                  <>
                    <FileText className="w-5 h-5 text-[#71BAED]" />
                    <span className="text-xs text-[#71BAED] font-medium truncate max-w-[160px]">{coverFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Carica lettera (PDF, DOC)</span>
                  </>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleFileChange(e, "cover")} />
              </label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={sending}
          className="w-full h-14 bg-[#71BAED] hover:bg-[#71BAED]/90 text-white font-bold rounded-xl text-base cursor-pointer"
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Invio in corso…</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Invia Candidatura</>
          )}
        </Button>
      </form>
    </motion.div>
  );
}