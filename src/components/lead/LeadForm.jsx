import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { praticheService } from "@/services/pratiche";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowRight, Loader2, CheckCircle2, ExternalLink,
  User, Briefcase, Building,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// ─── Static data ────────────────────────────────────────────────────────────

const PROVINCE = [
  "AG","AL","AN","AO","AP","AQ","AR","AT","AV",
  "BA","BG","BI","BL","BN","BO","BR","BS","BT","BZ",
  "CA","CB","CE","CH","CL","CN","CO","CR","CS","CT","CZ",
  "EN","FC","FE","FG","FI","FM","FR",
  "GE","GO","GR",
  "IM","IS",
  "KR",
  "LC","LE","LI","LO","LT","LU",
  "MB","MC","ME","MI","MN","MO","MS","MT",
  "NA","NO","NU",
  "OR",
  "PA","PC","PD","PE","PG","PI","PN","PO","PR","PT","PU","PV","PZ",
  "RA","RC","RE","RG","RI","RM","RN","RO",
  "SA","SI","SO","SP","SR","SS","SU","SV",
  "TA","TE","TN","TO","TP","TR","TS","TV",
  "UD",
  "VA","VB","VC","VE","VI","VR","VT","VV",
];

const MARCHE = [
  "Alfa Romeo","Audi","BMW","Citroen","Dacia","Fiat","Ford","Honda",
  "Hyundai","Jeep","Kia","Mazda","Mercedes-Benz","Nissan","Opel",
  "Peugeot","Renault","SEAT","Skoda","Tesla","Toyota","Volkswagen","Volvo","Altro",
];

const ALIMENTAZIONI = [
  "Benzina",
  "Diesel",
  "Full Hybrid Benzina",
  "Full Hybrid Diesel",
  "Plug-in Hybrid",
  "Elettrica",
  "Metano",
  "GPL",
];

const KM_OPTIONS = [
  { value: "10000",  label: "10.000 km/anno" },
  { value: "15000",  label: "15.000 km/anno" },
  { value: "20000",  label: "20.000 km/anno" },
  { value: "25000",  label: "25.000 km/anno" },
  { value: "30000",  label: "30.000 km/anno" },
  { value: "40000",  label: "40.000 km/anno" },
  { value: "50000",  label: "50.000 km/anno" },
];

const ANNI = Array.from(
  { length: 50 },
  (_, i) => String(new Date().getFullYear() - i)
);

const CLIENT_TYPES = [
  { id: "Privato",  label: "Privato",           icon: User },
  { id: "P.IVA",   label: "P.IVA / Titolare",  icon: Briefcase },
  { id: "Azienda", label: "Azienda",             icon: Building },
];

// ─── Small helpers ───────────────────────────────────────────────────────────

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

function SelField({ value, onValueChange, placeholder, options }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-11">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) =>
          typeof opt === "string" ? (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ) : (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadForm({ prefilledConfig }) {
  const { toast } = useToast();
  const [submitted, setSubmitted]         = useState(false);
  const [sending, setSending]             = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const isPrivate = prefilledConfig?.segment === "Privati";
  const [clientType, setClientType] = useState(isPrivate ? "Privato" : "P.IVA");

  const [f, setF] = useState({
    // personal
    nome: "", cognome: "", cf: "", telefono: "", email: "",
    indirizzo: "", citta: "", provincia: "", cap: "",
    // business
    piva: "", denominazione: "",
    // employment (Privato only)
    occupazione: "", tipoContratto: "", garante: "", annoInizioLavoro: "",
    // vehicle
    marca:        prefilledConfig?.make        || "",
    modello:      prefilledConfig?.model       || "",
     alimentazione: "",
     anticipo:      "",
     kmAnnui:      prefilledConfig?.annualKm    ? String(prefilledConfig.annualKm) : "",
     note: "",
  });
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  const [privacy1, setPrivacy1] = useState(false);
  const [privacy2, setPrivacy2] = useState(false);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!privacy1) {
      toast({
        title: "Consenso richiesto",
        description: "Accetta il trattamento dei dati per procedere.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const clienteNome =
        clientType === "Azienda"
          ? f.denominazione.trim()
          : `${f.nome.trim()} ${f.cognome.trim()}`.trim();

      await praticheService.create({
        cliente_nome:             clienteNome,
        cliente_cognome:          f.cognome.trim()  || null,
        cliente_email:            f.email.trim().toLowerCase(),
        cliente_telefono:         f.telefono.trim() || null,
        cliente_tipo:             clientType,
        cliente_cf:               f.cf.trim().toUpperCase() || null,
        cliente_piva:             f.piva.trim()             || null,
        cliente_denominazione:    f.denominazione.trim()    || null,
        cliente_indirizzo:        f.indirizzo.trim()        || null,
        cliente_citta:            f.citta.trim()            || null,
        cliente_provincia:        f.provincia               || null,
        cliente_cap:              f.cap.trim()              || null,
        cliente_occupazione:      f.occupazione             || null,
        cliente_tipo_contratto:   f.tipoContratto           || null,
        cliente_garante:          f.garante === "si" ? true : f.garante === "no" ? false : null,
        cliente_anno_inizio_lavoro: f.annoInizioLavoro ? parseInt(f.annoInizioLavoro) : null,
        veicolo_marca:            f.marca            || null,
        veicolo_modello:          f.modello.trim()   || null,
        veicolo_alimentazione:    f.alimentazione    || null,
        anticipo:                 f.anticipo === "con" ? true : f.anticipo === "senza" ? false : (prefilledConfig?.advance ?? null),
        segmento:                 ["P.IVA","Fleet","Privati"].includes(prefilledConfig?.segment) ? prefilledConfig.segment : null,
        durata_mesi:              prefilledConfig?.duration || null,
        km_annui:                 f.kmAnnui ? parseInt(f.kmAnnui) : (prefilledConfig?.annualKm || null),
        canone_mensile:           prefilledConfig?.monthlyRent || null,
        note_cliente:             f.note.trim() || null,
      });

      setSubmittedEmail(f.email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err) {
      console.error("LeadForm error:", err);
      toast({
        title: "Errore nell'invio",
        description: err?.message || "Si è verificato un problema. Riprova tra qualche minuto.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="py-8 px-2"
      >
        <div className="w-16 h-16 rounded-2xl bg-fuel-ev/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-fuel-ev" />
        </div>
        <h3 className="font-heading font-bold text-xl text-foreground text-center mb-2">
          Richiesta ricevuta!
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs mx-auto leading-relaxed">
          Il nostro team elaborerà il preventivo e ti contatterà entro 24 ore.
          Puoi intanto seguire la tua pratica dalla tua area personale.
        </p>
        <Link to={`/mia-pratica?email=${encodeURIComponent(submittedEmail)}`}>
          <Button className="w-full h-12 bg-[#71BAED] hover:bg-[#71BAED]/90 text-white font-semibold rounded-xl text-sm cursor-pointer">
            Accedi alla Tua Area Pratica
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Usa la tua email{" "}
          <span className="font-medium text-foreground">{submittedEmail}</span>{" "}
          per accedere
        </p>
      </motion.div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const showOccupazione  = clientType === "Privato";
  const isDipendente     = f.occupazione === "Dipendente";
  const isDeterminato    = f.tipoContratto === "Determinato";
  const isAutonomo       = f.occupazione === "Autonomo / Libero professionista";
  const isPensionato     = f.occupazione === "Pensionato";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Tipo cliente */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
          Tipo di cliente
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {CLIENT_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setClientType(id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer ${
                clientType === id
                  ? "bg-navy border-navy text-white shadow-sm"
                  : "border-border text-foreground hover:style={{borderColor:'#71BAED'}}/40 hover:style={{backgroundColor:'#71BAED'}}/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

        {/* ────────────────── LEFT: Dati personali ────────────────── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">
            Dati personali
          </p>

          {/* Ragione sociale (Azienda) */}
          {clientType === "Azienda" && (
            <FieldGroup label="Ragione Sociale" required>
              <Input
                required
                value={f.denominazione}
                onChange={(e) => set("denominazione", e.target.value)}
                placeholder="Acme S.r.l."
                className="h-11"
              />
            </FieldGroup>
          )}

          {/* Nome + Cognome */}
          {clientType !== "Azienda" ? (
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Nome" required>
                <Input
                  required
                  value={f.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Mario"
                  className="h-11"
                />
              </FieldGroup>
              <FieldGroup label="Cognome" required>
                <Input
                  required
                  value={f.cognome}
                  onChange={(e) => set("cognome", e.target.value)}
                  placeholder="Rossi"
                  className="h-11"
                />
              </FieldGroup>
            </div>
          ) : (
            <FieldGroup label="Referente" required>
              <Input
                required
                value={f.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Mario Rossi"
                className="h-11"
              />
            </FieldGroup>
          )}

          {/* Codice Fiscale (Privato) */}
          {clientType === "Privato" && (
            <FieldGroup label="Codice Fiscale" required>
              <Input
                required
                value={f.cf}
                onChange={(e) => set("cf", e.target.value.toUpperCase())}
                placeholder="RSSMRA80A01H501Z"
                maxLength={16}
                className="h-11 font-mono tracking-widest"
              />
            </FieldGroup>
          )}

          {/* Partita IVA (P.IVA / Azienda) */}
          {(clientType === "P.IVA" || clientType === "Azienda") && (
            <FieldGroup label="Partita IVA" required>
              <Input
                required
                value={f.piva}
                onChange={(e) => set("piva", e.target.value)}
                placeholder="12345678901"
                maxLength={11}
                className="h-11"
              />
            </FieldGroup>
          )}

          {/* Telefono + Email */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Telefono" required>
              <Input
                required
                type="tel"
                value={f.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+39 333 123456"
                className="h-11"
              />
            </FieldGroup>
            <FieldGroup label="Email" required>
              <Input
                required
                type="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="mario@email.it"
                className="h-11"
              />
            </FieldGroup>
          </div>

          {/* Indirizzo */}
          <FieldGroup label="Indirizzo">
            <Input
              value={f.indirizzo}
              onChange={(e) => set("indirizzo", e.target.value)}
              placeholder="Via Roma, 1"
              className="h-11"
            />
          </FieldGroup>

          {/* Città + Provincia + CAP */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2">
              <FieldGroup label="Città" required>
                <Input
                  required
                  value={f.citta}
                  onChange={(e) => set("citta", e.target.value)}
                  placeholder="Milano"
                  className="h-11"
                />
              </FieldGroup>
            </div>
            <div className="col-span-2">
              <FieldGroup label="Provincia" required>
                <SelField
                  value={f.provincia}
                  onValueChange={(v) => set("provincia", v)}
                  placeholder="Prov."
                  options={PROVINCE}
                />
              </FieldGroup>
            </div>
            <div>
              <FieldGroup label="CAP">
                <Input
                  value={f.cap}
                  onChange={(e) => set("cap", e.target.value)}
                  placeholder="20121"
                  maxLength={5}
                  className="h-11"
                />
              </FieldGroup>
            </div>
          </div>

          {/* Occupazione (Privato only) */}
          {showOccupazione && (
            <>
              <FieldGroup label="Occupazione" required>
                <SelField
                  value={f.occupazione}
                  onValueChange={(v) => {
                    set("occupazione", v);
                    set("tipoContratto", "");
                    set("garante", "");
                    set("annoInizioLavoro", "");
                  }}
                  placeholder="Seleziona…"
                  options={[
                    "Dipendente",
                    "Autonomo / Libero professionista",
                    "Pensionato",
                    "Studente / Non occupato",
                  ]}
                />
              </FieldGroup>

              {isDipendente && (
                <>
                  <FieldGroup label="Tipo di contratto" required>
                    <SelField
                      value={f.tipoContratto}
                      onValueChange={(v) => { set("tipoContratto", v); set("garante", ""); }}
                      placeholder="Seleziona…"
                      options={["Indeterminato", "Determinato"]}
                    />
                  </FieldGroup>

                  {isDeterminato && (
                    <FieldGroup label="Garante disponibile?" required>
                      <SelField
                        value={f.garante}
                        onValueChange={(v) => set("garante", v)}
                        placeholder="Seleziona…"
                        options={[
                          { value: "si", label: "Sì, ho un garante" },
                          { value: "no", label: "No, non ho un garante" },
                        ]}
                      />
                    </FieldGroup>
                  )}

                  <FieldGroup label="Anno inizio lavoro" required>
                    <SelField
                      value={f.annoInizioLavoro}
                      onValueChange={(v) => set("annoInizioLavoro", v)}
                      placeholder="Anno…"
                      options={ANNI}
                    />
                  </FieldGroup>
                </>
              )}

              {isAutonomo && (
                <FieldGroup label="Anno inizio attività" required>
                  <SelField
                    value={f.annoInizioLavoro}
                    onValueChange={(v) => set("annoInizioLavoro", v)}
                    placeholder="Anno…"
                    options={ANNI}
                  />
                </FieldGroup>
              )}

              {isPensionato && (
                <FieldGroup label="Anno di pensionamento" required>
                  <SelField
                    value={f.annoInizioLavoro}
                    onValueChange={(v) => set("annoInizioLavoro", v)}
                    placeholder="Anno…"
                    options={ANNI}
                  />
                </FieldGroup>
              )}
            </>
          )}
        </div>

        {/* ────────────────── RIGHT: Preferenze veicolo ────────────── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">
            Preferenze veicolo
          </p>

          <FieldGroup label="Marca">
            <SelField
              value={f.marca}
              onValueChange={(v) => set("marca", v)}
              placeholder="Seleziona marca…"
              options={MARCHE}
            />
          </FieldGroup>

          <FieldGroup label="Modello">
            <Input
              value={f.modello}
              onChange={(e) => set("modello", e.target.value)}
              placeholder="es. Golf, Classe A, Panda…"
              className="h-11"
            />
          </FieldGroup>

          <FieldGroup label="Alimentazione">
            <SelField
              value={f.alimentazione}
              onValueChange={(v) => set("alimentazione", v)}
              placeholder="Seleziona…"
              options={ALIMENTAZIONI}
            />
          </FieldGroup>

          <FieldGroup label="Anticipo">
            <SelField
              value={f.anticipo}
              onValueChange={(v) => set("anticipo", v)}
              placeholder="Con o senza anticipo?"
              options={[
                { value: "con", label: "Con anticipo" },
                { value: "senza", label: "Senza anticipo" },
              ]}
            />
          </FieldGroup>

          <FieldGroup label="Km annui previsti">
            <SelField
              value={f.kmAnnui}
              onValueChange={(v) => set("kmAnnui", v)}
              placeholder="Seleziona…"
              options={KM_OPTIONS}
            />
          </FieldGroup>

          <FieldGroup label="Note e preferenze aggiuntive">
            <Textarea
              value={f.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Colore preferito, allestimento, accessori, budget indicativo…"
              className="min-h-[120px] resize-none"
            />
          </FieldGroup>
        </div>
      </div>

      {/* Privacy */}
      <div className="space-y-3 pt-2 border-t border-border/40">
        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy1"
            checked={privacy1}
            onCheckedChange={setPrivacy1}
            className="mt-0.5 shrink-0"
          />
          <label htmlFor="privacy1" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            * Acconsento al trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679
            (GDPR) per la gestione della richiesta di preventivo.{" "}
            <Link to="/privacy" style={{color:'#71BAED'}} className=" underline hover:text-[#71BAED]/80">
              Leggi la Privacy Policy
            </Link>
          </label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy2"
            checked={privacy2}
            onCheckedChange={setPrivacy2}
            className="mt-0.5 shrink-0"
          />
          <label htmlFor="privacy2" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            Acconsento a ricevere comunicazioni commerciali e offerte personalizzate via email/SMS.
            (Facoltativo)
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={sending || !privacy1}
        className="w-full h-12 bg-[#71BAED] hover:bg-[#71BAED]/90 text-white font-bold rounded-xl text-base cursor-pointer shadow-md style={{boxShadow:'0 4px 6px -1px rgba(113,186,237,0.25)'}}/20 transition-all duration-200 disabled:opacity-50"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Invio in corso…
          </>
        ) : (
          <>
            Richiedi Preventivo Veloce
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}
