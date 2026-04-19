import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2, CheckCircle, User, Building, Briefcase, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DocumentUploader from "./DocumentUploader";

const CLIENT_TYPES = [
  { id: "Privato", label: "Privato", icon: User },
  { id: "P.IVA", label: "P.IVA / Titolare", icon: Briefcase },
  { id: "Azienda", label: "Azienda", icon: Building },
];

export default function LeadForm({ prefilledConfig }) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const isPrivate = prefilledConfig?.segment === "Privati";
  const [clientType, setClientType] = useState(isPrivate ? "Privato" : "Azienda");
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    vatNumber: "",
    fiscalCode: "",
    email: "",
    phone: "",
    notes: "",
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const docSummary = uploadedDocs.length > 0
      ? `\n\nDocumenti allegati (${uploadedDocs.length}):\n${uploadedDocs.map(d => `- ${d.name}: ${d.url}`).join("\n")}`
      : "\n\nNessun documento allegato.";

    const configSummary = prefilledConfig
      ? `Vehicle: ${prefilledConfig.make} ${prefilledConfig.model}\nSegment: ${prefilledConfig.segment}\nDuration: ${prefilledConfig.duration} months\nAnnual KM: ${prefilledConfig.annualKm?.toLocaleString()}\nAdvance: €${prefilledConfig.advance?.toLocaleString()}\nMonthly Rent: €${prefilledConfig.monthlyRent || 'Custom quote'}`
      : "General inquiry";

    const contactName = isPrivate
      ? `${form.firstName} ${form.lastName}`
      : form.companyName;

    const emailBody = `
<h2>Nuova Richiesta Offerta NLT — ${clientType}</h2>
<hr/>
<h3>Dati Cliente</h3>
<p><strong>Tipo cliente:</strong> ${clientType}</p>
${clientType === "Privato" ? `
<p><strong>Nome:</strong> ${form.firstName}</p>
<p><strong>Cognome:</strong> ${form.lastName}</p>
<p><strong>Codice Fiscale:</strong> ${form.fiscalCode}</p>
` : clientType === "P.IVA" ? `
<p><strong>Nome/Ragione Sociale:</strong> ${form.companyName || form.firstName + " " + form.lastName}</p>
<p><strong>Partita IVA:</strong> ${form.vatNumber}</p>
` : `
<p><strong>Ragione Sociale:</strong> ${form.companyName}</p>
<p><strong>Partita IVA:</strong> ${form.vatNumber}</p>
`}
<p><strong>Email:</strong> ${form.email}</p>
<p><strong>Telefono:</strong> ${form.phone}</p>
${form.notes ? `<p><strong>Note:</strong> ${form.notes}</p>` : ""}
<hr/>
<h3>Configurazione Veicolo</h3>
<pre>${configSummary}</pre>
<hr/>
<h3>Documenti Allegati</h3>
<pre>${docSummary}</pre>
    `.trim();

    // Crea pratica automaticamente
    const codice = `NS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    await base44.entities.Pratica.create({
      codice,
      status: "Nuova",
      cliente_nome: clientType === "Privato" || isPrivate
        ? `${form.firstName} ${form.lastName}`.trim()
        : form.companyName,
      cliente_email: form.email,
      cliente_telefono: form.phone,
      cliente_tipo: clientType,
      cliente_piva: clientType === "Privato" || isPrivate ? form.fiscalCode : form.vatNumber,
      veicolo_marca: prefilledConfig?.make || "",
      veicolo_modello: prefilledConfig?.model || "",
      segmento: prefilledConfig?.segment || null,
      durata_mesi: prefilledConfig?.duration || null,
      km_annui: prefilledConfig?.annualKm || null,
      anticipo: prefilledConfig?.advance || null,
      canone_mensile: prefilledConfig?.monthlyRent || null,
      note_cliente: form.notes,
      documenti_urls: uploadedDocs.map(d => d.url),
      ultimo_aggiornamento_stato: new Date().toISOString(),
    });

    await base44.integrations.Core.SendEmail({
      to: "offerte@nolosubito.it",
      subject: `NLT Quote Request: ${prefilledConfig?.make || "General"} ${prefilledConfig?.model || ""} — ${contactName}`,
      body: emailBody,
    });

    setSending(false);
    setSubmitted(true);
    toast({
      title: "Richiesta inviata!",
      description: "Il nostro team ti contatterà entro 24 ore.",
    });
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-heading font-bold text-xl text-foreground mb-2">
          Richiesta Inviata con Successo
        </h3>
        <p className="text-muted-foreground">
          Il nostro team B2B ti contatterà entro 24 ore con un'offerta personalizzata.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Tipo cliente selector */}
      {!prefilledConfig && (
        <div>
          <Label className="text-xs font-medium mb-2 block">Tipo di cliente *</Label>
          <div className="grid grid-cols-3 gap-2">
            {CLIENT_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setClientType(id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  clientType === id
                    ? "bg-navy border-navy text-white shadow-sm"
                    : "border-border text-foreground hover:border-electric hover:text-electric"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(clientType === "Privato" || isPrivate) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-xs font-medium">Nome *</Label>
            <Input
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="Mario"
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-xs font-medium">Cognome *</Label>
            <Input
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Rossi"
              className="mt-1.5 h-11"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="fiscalCode" className="text-xs font-medium">Codice Fiscale *</Label>
            <Input
              id="fiscalCode"
              required
              value={form.fiscalCode}
              onChange={(e) => handleChange("fiscalCode", e.target.value)}
              placeholder="RSSMRA80A01H501U"
              className="mt-1.5 h-11"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName" className="text-xs font-medium">Ragione Sociale *</Label>
            <Input
              id="companyName"
              required
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Acme S.r.l."
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="vatNumber" className="text-xs font-medium">Partita IVA *</Label>
            <Input
              id="vatNumber"
              required
              value={form.vatNumber}
              onChange={(e) => handleChange("vatNumber", e.target.value)}
              placeholder="IT12345678901"
              className="mt-1.5 h-11"
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="text-xs font-medium">Email Aziendale *</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="info@acme.it"
            className="mt-1.5 h-11"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs font-medium">Telefono *</Label>
          <Input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+39 02 1234567"
            className="mt-1.5 h-11"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes" className="text-xs font-medium">Note Aggiuntive</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Dimensione flotta, esigenze particolari…"
          className="mt-1.5 h-24"
        />
      </div>
      {/* Document upload section */}
      <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-3">
        <div className="flex items-center gap-2">
          <FileUp className="w-4 h-4 text-electric" />
          <h3 className="font-heading font-semibold text-sm text-foreground">
            Documenti per il Preventivo
          </h3>
          <span className="text-xs text-muted-foreground ml-auto">PDF, JPG, PNG</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Carica i documenti richiesti per accelerare la pratica. Un agente AI verificherà che siano completi e validi.
        </p>
        <DocumentUploader
          clientType={clientType}
          onDocumentsChange={setUploadedDocs}
        />
      </div>

      <Button
        type="submit"
        disabled={sending}
        className="w-full h-12 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl text-base cursor-pointer"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Invio in corso…
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Richiedi Offerta Business
          </>
        )}
      </Button>
    </form>
  );
}