import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AnalyzeBody = {
  base64?: string;
  pages?: string[];
  mediaType?: string;
  text?: string;
};

type JsonRecord = Record<string, unknown>;

type ServizioNormalizzato = {
  codice: string | null;
  penale: number | string | null;
  originale: string | null;
};

type NormalizedPreventivo = {
  carrier: string | null;
  veicolo_marca: string | null;
  veicolo_modello: string | null;
  veicolo_versione: string | null;
  veicolo_allestimento: string | null;
  alimentazione: string | null;
  cambio: string | null;
  carrozzeria: string | null;
  colore_esterno: string | null;
  interni: string | null;
  potenza: number | null;
  durata_mesi: number | null;
  km_annui: number | null;
  anticipo: number | null;
  deposito_cauzionale: number | null;
  canone_mensile: number | null;
  quota_veicolo: number | null;
  quota_servizi: number | null;
  valore_listing: number | null;
  valore_optional: number | null;
  valore_accessori: number | null;
  servizi: Array<ServizioNormalizzato>;
  note_aggiuntive: string | null;
};

const SERVICE_GROUPS = [
  { canonical: "R.C.A. Responsabilità Civile", aliases: [
    "rca", "assicurazione rc", "rc auto", "responsabilita civile", "responsabilità civile",
    "rca max 25 milioni", "rca penale risarcitoria 250 euro",
    "rca max 25 milioni penale 250 i care", "rca penale 500",
    "massimale euro 26 000 000",
    "r c a responsabilita civile",
  ]},
  { canonical: "Incendio e Furto", aliases: [
    "incendio e furto", "copertura incendio e furto", "limitazione furto incendio",
    "limitazione responsabilita furto incendio", "assicurazione incendio e furto",
    "limitazione responsabilita furto incendio con penale risarcitoria 10",
    "incendio e furto penale 0 i care", "incendio e furto penale 10 i care",
    "furto quota cliente 10 valore commerciale",
    "furto e incendio", "furto incendio", "copertura furto e incendio",
    "assicurazione furto e incendio", "limitazione responsabilita furto e incendio",
    "furto e incendio penale 0", "furto e incendio penale 10",
    "furto e incendio penale 0 i care", "furto e incendio penale 10 i care",
    "furto incendio penale 10", "furto incendio penale 0",
  ]},
  { canonical: "Copertura Danni", aliases: [
    "copertura danni", "danni", "limitazione danni", "limitazione responsabilita danni",
    "copertura danni base", "copertura incendio furto danni", "kasko",
    "limitazione responsabilita danni penale risarcitoria 500",
    "copertura danni base penale 250 i care", "copertura danni base penale 500 i care",
    "penale come kasko", "danni al veicolo incendio furto parziale quota cliente 500",
  ]},
  { canonical: "Manutenzione Ordinaria e Straordinaria", aliases: [
    "manutenzione ordinaria e straordinaria", "manutenzione ordinaria straordinaria",
    "manutenzione ordinaria/straordinaria", "manutenzione meccanica",
    "manutenzione meccanica plus",
    "manutenzione ord e straord",
  ]},
  { canonical: "Soccorso Stradale", aliases: [
    "soccorso stradale", "assistenza stradale", "ald automotive assistance",
    "traino standard", "assistenza al parcheggio posteriore", "sostitutiva z traino",
    "assistenza stradale h24", "soccorso 365 giorni",
  ]},
  { canonical: "Cristalli", aliases: [
    "copertura cristalli", "cristalli", "cristalli penale",
    "cristalli penale 250", "cristalli penale 500", "cristalli penale 150",
  ]},
  { canonical: "Gestione Multe", aliases: [
    "gestione multe", "rinotifica contravvenzioni", "rinotifica al cliente",
    "multe rinotifica al cliente", "gestione multe 10 a notifica",
  ]},
  { canonical: "Gestione Sinistri", aliases: ["gestione sinistri"]},
  { canonical: "Pneumatici", aliases: [
    "pneumatici", "pneumatici performance a numero limitato",
    "pneumatici premium performance", "pneumatici performance a numero limitato x4",
  ]},
  { canonical: "Tassa di Proprietà", aliases: [
    "tassa di proprieta", "tassa di proprietà", "tassa di possesso",
    "tassa di possesso con riaddebito", "tassa automobilistica",
    "tassaautomobilistica riaddebito periodico", "servizio pagamento tasse auto",
    "tassa automobilistica con riaddebito", "tassa di possesso con riaddebito",
    "tassaautomobilistica riaddebitoperiodico",
  ]},
  { canonical: "Auto Sostitutiva", aliases: [
    "auto sostitutiva", "veicolo sostitutivo", "sostitutiva z",
    "auto piccola dopo 24h", "auto sostitutiva auto piccola dopo 24h",
    "sostitutiva",
  ]},
  { canonical: "Telematica", aliases: [
    "telematica", "gps", "blackbox", "telematica basic",
    "gosth primario installazione",
    "sistemi di localizzazione gps gsm", "blackbox incluso",
    "i care", "i care smart", "i care protection", "i care box", "i care connect",
    "my leasys app",
  ]},
  { canonical: "Infortuni Conducente", aliases: [
    "infortuni conducente", "pai", "assicurazione infortuni conducente",
    "garanzia infortuni del conducente", "infortuni conducente polizza assicurativa inclusa",
  ]},
  { canonical: "Tutela Legale", aliases: [
    "tutela legale", "tutela legale fino a 15 000",
    "tutela legale assistenza legale inclusa",
  ]},
  { canonical: "Consegna del Veicolo", aliases: [
    "consegna del veicolo", "consegna c o hub auto", "consegna c/o hub auto",
    "consegna vettura drivalia point",
  ]},
  { canonical: "Fatturazione Elettronica", aliases: ["fatturazione elettronica"]},
  { canonical: "Eventi Atmosferici", aliases: [
    "eventi atmosferici", "eventi atmosferici penale 250", "eventi atmosferici penale 500",
  ]},
  { canonical: "Immatricolazione", aliases: ["immatricolazione"]},
  { canonical: "Servizio Clienti", aliases: ["servizio clienti", "assistenza clienti"]},
];

const SERVIZI_TO_CODE: Record<string, string> = {
  "R.C.A. Responsabilità Civile": "RCA",
  "Incendio e Furto": "FURTO_INCENDIO",
  "Copertura Danni": "DANNI",
  "Manutenzione Ordinaria e Straordinaria": "MANUTENZIONE",
  "Soccorso Stradale": "SOCCORSO",
  "Cristalli": "CRISTALLI",
  "Gestione Multe": "MULTE",
  "Gestione Sinistri": "SINISTRI",
  "Pneumatici": "CAMBIO_PNEUMATICI",
  "Tassa di Proprietà": "BOLLO",
  "Auto Sostitutiva": "AUTO_SOSTITUTIVA",
  "Telematica": "TELEMATICA",
  "Infortuni Conducente": "INFORTUNI",
  "Tutela Legale": "TUTELA_LEGALE",
  "Consegna del Veicolo": "CONSEGNA",
  "Fatturazione Elettronica": "FATTURAZIONE",
  "Eventi Atmosferici": "ATMOSFERICI",
  "Immatricolazione": "IMMATRICOLAZIONE",
  "Servizio Clienti": "SERVIZIO_CLIENTI",
};

const SERVICE_ALIAS_ENTRIES = SERVICE_GROUPS
  .flatMap(({ canonical, aliases }) => aliases.map((alias) => ({ canonical, key: normalizeKey(alias) })))
  .sort((a, b) => b.key.length - a.key.length);

const CARRIER_ALIASES: Array<{ canonical: string; key: string }> = [
  { canonical: "Ayvens", key: normalizeKey("Ayvens") },
  { canonical: "Ayvens", key: normalizeKey("ALD Automotive") },
  { canonical: "Drivalia", key: normalizeKey("Drivalia") },
  { canonical: "Leasys", key: normalizeKey("Leasys") },
  { canonical: "Santander Consumer Renting", key: normalizeKey("Santander") },
  { canonical: "Santander Consumer Renting", key: normalizeKey("Santander Consumer Renting") },
  { canonical: "Volkswagen Financial Services", key: normalizeKey("Volkswagen Financial Services") },
  { canonical: "Volkswagen Financial Services", key: normalizeKey("Volkswagen Leasing") },
  { canonical: "Volkswagen Financial Services", key: normalizeKey("Volkswagen") },
];

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = normalizeSpaces(String(value).replace(/\u00a0/g, " "));
  if (!text) return null;
  const lowered = normalizeKey(text);
  if (
    lowered === "null" ||
    lowered === "none" ||
    lowered === "n a" ||
    lowered === "na" ||
    lowered === "n d" ||
    lowered === "nd" ||
    lowered === "non disponibile" ||
    lowered === "-"
  ) {
    return null;
  }
  return text;
}

function normalizeKey(value: string) {
  return normalizeSpaces(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .toLowerCase(),
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJsonFromText(raw: string): JsonRecord {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return {};
  const chunk = raw.slice(first, last + 1);
  try {
    const parsed = JSON.parse(chunk);
    return parsed && typeof parsed === "object" ? parsed as JsonRecord : {};
  } catch {
    return {};
  }
}

function toNumberString(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;

  const compact = text.replace(/[€$£]/g, "").replace(/\s+/g, "");
  if (!compact) return null;

  let normalized = compact;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  } else if (hasDot) {
    if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/\./g, "");
    }
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed.toFixed(2);
}

function toNumber(value: unknown, { integer = false }: { integer?: boolean } = {}): number | null {
  const normalized = toNumberString(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return integer ? Math.round(parsed) : Number(parsed.toFixed(2));
}

function textOrNull(value: unknown) {
  return cleanText(value);
}

function normalizeCarrier(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const key = normalizeKey(text);
  for (const entry of CARRIER_ALIASES) {
    if (key === entry.key || key.includes(entry.key)) return entry.canonical;
  }
  return text;
}

const CARRIER_TERMS = /\b(i[- ]?care|my[- ]?leasys)\b/gi;

function stripCarrierTerms(text: string | null): string | null {
  if (!text) return null;
  const stripped = text.replace(CARRIER_TERMS, '').replace(/\s{2,}/g, ' ').trim();
  return stripped || null;
}

function extractPenale(texto: string | null): number | string | null {
  if (!texto) return null;
  const lower = texto.toLowerCase();
  const matchPct = lower.match(/penal[ei]\s*(?:risarcitoria\s+)?(\d{1,3}(?:[.,]\d{1,2})?)\s*%/);
  if (matchPct) {
    const val = matchPct[1].replace(",", ".");
    return `${val}%`;
  }
  const match = lower.match(/penal[ei]\s*(?:risarcitoria\s+)?(\d{1,6}(?:[.,]\d{1,2})?)/);
  if (match) {
    const val = Number(match[1].replace(",", "."));
    return Number.isFinite(val) ? val : null;
  }
  return null;
}

function canonicalizeService(value: unknown): { canonical: string; codice: string | null; penale: number | string | null; original: string | null } | null {
  const text = cleanText(value);
  if (!text) return null;
  const key = normalizeKey(text);
  let canonical: string | null = null;

  for (const group of SERVICE_GROUPS) {
    if (normalizeKey(group.canonical) === key) {
      canonical = group.canonical;
      break;
    }
  }

  if (!canonical) {
    for (const entry of SERVICE_ALIAS_ENTRIES) {
      if (key === entry.key || key.includes(entry.key)) {
        canonical = entry.canonical;
        break;
      }
    }
  }

  if (!canonical) {
    return { canonical: text, codice: null, penale: null, original: text };
  }

  const codice = SERVIZI_TO_CODE[canonical] ?? null;
  const penale = extractPenale(text);
  const originalText = normalizeKey(text) === normalizeKey(canonical) ? null : text;
  const original = stripCarrierTerms(originalText);

  return { canonical, codice, penale, original };
}

function normalizeServices(value: unknown): Array<ServizioNormalizzato> {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: Array<ServizioNormalizzato> = [];

  for (const item of value) {
    const mapped = canonicalizeService(item);
    if (!mapped) continue;
    const key = normalizeKey(mapped.canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ codice: mapped.codice, penale: mapped.penale, originale: mapped.original });
  }

  return result;
}

function inferFurtoIncendioPenalty(text: string | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const furtoIncendio = "(?:furto\\s*(?:e|\\/)\\s*incendio|incendio\\s*(?:e|\\/)\\s*furto)";
  const amount = "(\\d{1,3}(?:[.,]\\d{1,2})?)";
  const patterns = [
    // "Furto e Incendio ... 10%" (qualsiasi testo in mezzo, anche a capo)
    new RegExp(`${furtoIncendio}[\\s\\S]{0,100}?${amount}\\s*%`, "i"),
    // "10% ... Furto e Incendio"
    new RegExp(`${amount}\\s*%[\\s\\S]{0,100}?${furtoIncendio}`, "i"),
    // "Furto e Incendio ... 10 percento"
    new RegExp(`${furtoIncendio}[\\s\\S]{0,100}?${amount}\\s*(?:%|percento)`, "i"),
    // con keyword penale/franchigia/quota/a carico
    new RegExp(`${furtoIncendio}[\\s\\S]{0,80}?(?:penale|franchigia|quota|a carico)[\\s\\S]{0,60}?${amount}\\s*%`, "i"),
    new RegExp(`(?:penale|franchigia|quota|a carico)[\\s\\S]{0,60}?${amount}\\s*%[\\s\\S]{0,80}?${furtoIncendio}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const val = match[1].replace(",", ".");
      return `${val}%`;
    }
  }
  return null;
}

function hasFurtoIncendio(services: Array<ServizioNormalizzato>): boolean {
  return services.some((s) => {
    const text = normalizeKey(`${s.originale || ""} ${s.codice || ""}`);
    return text.includes("furto") && text.includes("incendio");
  });
}

function mentionsFurtoIncendio(text: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return /(?:furto\s*(?:e|\/)\s*incendio|incendio\s*(?:e|\/)\s*furto)/i.test(lower);
}

function inferDanniPenalty(text: string | null): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const danniPattern = "(?:copertura danni|kasko|collisione|danni al veicolo|limitazione responsabilita danni)";
  const amount = "(\\d{1,6}(?:[.,]\\d{1,2})?)";
  const patterns = [
    new RegExp(`${danniPattern}[\\s\\S]{0,100}?${amount}\\s*€`, "i"),
    new RegExp(`${amount}\\s*€[\\s\\S]{0,100}?${danniPattern}`, "i"),
    new RegExp(`${danniPattern}[\\s\\S]{0,80}?(?:penale|franchigia|quota|a carico)[\\s\\S]{0,60}?${amount}\\s*€`, "i"),
    new RegExp(`(?:penale|franchigia|quota|a carico)[\\s\\S]{0,60}?${amount}\\s*€[\\s\\S]{0,80}?${danniPattern}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const val = Number(match[1].replace(",", "."));
      return Number.isFinite(val) ? val : null;
    }
  }
  return null;
}

function stripLeadingPrefix(value: string, prefix: string) {
  if (!prefix) return value;
  const pattern = new RegExp(`^${escapeRegex(prefix)}\\s+`, "i");
  return value.replace(pattern, "").trim();
}

function stripTrailingSuffix(value: string, suffix: string) {
  if (!suffix) return value;
  const escaped = escapeRegex(suffix);
  const pattern = new RegExp(`(?:\\s*[-–—:]?\\s*)${escaped}$`, "i");
  return value.replace(pattern, "").trim();
}

function normalizeVehicleFields(raw: JsonRecord) {
  const veicolo_marca = textOrNull(raw.veicolo_marca);
  let veicolo_modello = textOrNull(raw.veicolo_modello);
  let veicolo_versione = textOrNull(raw.veicolo_versione);
  const veicolo_allestimento = textOrNull(raw.veicolo_allestimento);

  if (!veicolo_versione && veicolo_allestimento) {
    veicolo_versione = veicolo_allestimento;
  }

  if (veicolo_modello && veicolo_marca) {
    veicolo_modello = stripLeadingPrefix(veicolo_modello, veicolo_marca);
  }

  if (veicolo_modello && veicolo_versione) {
    const normalizedModel = normalizeKey(veicolo_modello);
    const normalizedVersion = normalizeKey(veicolo_versione);

    if (normalizedModel === normalizedVersion) {
      veicolo_versione = null;
    } else {
      const strippedVersion = stripTrailingSuffix(veicolo_modello, veicolo_versione);
      if (strippedVersion && normalizeKey(strippedVersion) !== normalizeKey(veicolo_modello)) {
        veicolo_modello = strippedVersion;
      }

      if (veicolo_modello && veicolo_versione && normalizeKey(veicolo_versione).startsWith(`${normalizeKey(veicolo_modello)} `)) {
        veicolo_versione = veicolo_versione.slice(veicolo_modello.length).trim();
      }
    }
  }

  if (!veicolo_modello && veicolo_versione) {
    veicolo_modello = veicolo_versione;
    veicolo_versione = null;
  }

  return {
    veicolo_marca,
    veicolo_modello,
    veicolo_versione,
    veicolo_allestimento: veicolo_versione,
    alimentazione: textOrNull(raw.alimentazione),
    cambio: textOrNull(raw.cambio),
    carrozzeria: textOrNull(raw.carrozzeria),
    colore_esterno: textOrNull(raw.colore_esterno),
    interni: textOrNull(raw.interni),
    potenza: toNumber(raw.potenza, { integer: true }),
    durata_mesi: toNumber(raw.durata_mesi, { integer: true }),
    km_annui: toNumber(raw.km_annui, { integer: true }),
    anticipo: toNumber(raw.anticipo),
    deposito_cauzionale: toNumber(raw.deposito_cauzionale),
    canone_mensile: toNumber(raw.canone_mensile),
    valore_listing: toNumber(raw.valore_listing),
    valore_optional: toNumber(raw.valore_optional),
    valore_accessori: toNumber(raw.valore_accessori),
  };
}

function normalizePreventivo(raw: JsonRecord, rawText?: string | null): NormalizedPreventivo {
  const vehicle = normalizeVehicleFields(raw);
  let servizi = normalizeServices(raw.servizi);

  const textSource = rawText || textOrNull(raw.note_aggiuntive);

  if (!hasFurtoIncendio(servizi)) {
    const penale = inferFurtoIncendioPenalty(textSource) || (mentionsFurtoIncendio(textSource) ? "10%" : null);
    if (penale) {
      servizi = [
        ...servizi,
        { codice: "FURTO_INCENDIO", penale, originale: `Furto e Incendio Penale ${penale}` },
      ];
    }
  }

  // Recupera la penale di Copertura Danni dal testo broker se l'AI non l'ha estratta
  servizi = servizi.map((s) => {
    if (s.codice === "DANNI" && s.penale == null) {
      const penale = inferDanniPenalty(textSource);
      if (penale != null) {
        return { ...s, penale, originale: s.originale || `Copertura Danni Penale ${penale}` };
      }
    }
    return s;
  });

  return {
    carrier: normalizeCarrier(raw.carrier),
    veicolo_marca: vehicle.veicolo_marca,
    veicolo_modello: vehicle.veicolo_modello,
    veicolo_versione: vehicle.veicolo_versione,
    veicolo_allestimento: vehicle.veicolo_allestimento,
    alimentazione: vehicle.alimentazione,
    cambio: vehicle.cambio,
    carrozzeria: vehicle.carrozzeria,
    colore_esterno: vehicle.colore_esterno,
    interni: vehicle.interni,
    potenza: vehicle.potenza,
    durata_mesi: vehicle.durata_mesi,
    km_annui: vehicle.km_annui,
    anticipo: vehicle.anticipo,
    deposito_cauzionale: vehicle.deposito_cauzionale,
    canone_mensile: vehicle.canone_mensile,
    quota_veicolo: toNumber(raw.quota_veicolo),
    quota_servizi: toNumber(raw.quota_servizi),
    valore_listing: vehicle.valore_listing,
    valore_optional: vehicle.valore_optional,
    valore_accessori: vehicle.valore_accessori,
    servizi,
    note_aggiuntive: textOrNull(raw.note_aggiuntive),
  };
}

const PROMPT_TEXT = `Sei un esperto di preventivi NLT italiani. Estrai i dati dal documento e restituisci SOLO JSON valido, senza markdown, senza spiegazioni, senza testo aggiuntivo.

Se sono presenti sia testo estratto che immagini, usa le immagini come fonte primaria e il testo solo come supporto.
Se una pagina contiene la scheda tecnica del veicolo, trattala come fonte di verità per marca, modello, versione/allestimento, alimentazione, cambio, carrozzeria, colore esterno, interni e potenza.
Non concatenare marca, modello e versione in un solo campo.
Non inventare servizi inclusi: estrai solo quelli esplicitamente elencati come inclusi.
Ignora banner, claim promozionali e sezioni di marketing come "Perché scegliere..." se non contengono dati del preventivo.

Testo estratto opzionale:
{{TEXT_INPUT}}

Campi richiesti:
{
  "carrier": string|null,
  "veicolo_marca": string|null,
  "veicolo_modello": string|null,
  "veicolo_versione": string|null,
  "veicolo_allestimento": string|null,
  "alimentazione": string|null,
  "cambio": string|null,
  "carrozzeria": string|null,
  "colore_esterno": string|null,
  "interni": string|null,
  "potenza": number|null,
  "durata_mesi": number|null,
  "km_annui": number|null,
  "anticipo": number|null,
  "deposito_cauzionale": number|null,
  "canone_mensile": number|null,
  "quota_veicolo": number|null,
  "quota_servizi": number|null,
  "valore_listing": number|null,
  "valore_optional": number|null,
  "valore_accessori": number|null,
  "servizi": string[],
  "note_aggiuntive": string|null
}

Per il campo "servizi", restituisci un array di stringhe con i nomi ESATTI dei servizi come appaiono nel documento. Non normalizzare i nomi. Estrai TUTTI i servizi inclusi elencati nel preventivo.

Per gli importi delle penali (franchigie) di ogni servizio, includile SEMPRE nel nome del servizio quando presenti nel documento.
IMPORTANTE: ogni servizio deve avere la SUA penale corretta, non confondere le penali tra servizi diversi.
Usa il formato: "Nome Servizio Penale VALORE" dove VALORE è il numero con eventuale %.
Esempi corretti:
- "Incendio e Furto Penale 10%" (se il documento indica penale 10% per furto/incendio)
- "Copertura Danni Penale 500" (se il documento indica penale 500€ per kasko/danni)
- "RCA Penale 250" (se il documento indica penale 250€ per RCA)
Se un servizio non ha penale indicata, ometti la penale dal nome.
Se la penale è una percentuale, includi il simbolo % (es. "Penale 10%").
I campi "quota_veicolo" e "quota_servizi" rappresentano la suddivisione del canone mensile tra quota veicolo e quota servizi, così come riportata nel preventivo broker originale. Estrai SEMPRE i valori che trovi nel documento, senza calcolarli. Usa valori IVA inclusa quando presenti. Se il documento non ha la suddivisione, lascia null.
Il campo "valore_listing" è il prezzo totale del veicolo (es. "Valore veicolo", "Prezzo veicolo", "Valore di listino", "Prezzo di listino"). Cercalo in tutte le pagine, spesso nella sezione "Scheda tecnica" o "Dati veicolo" o nella sezione economica.
Linee guida pratiche:
- DRIVALIA: il valore canone è normalmente IVA esclusa, quindi usa il totale quando indicato e convertilo a IVA inclusa solo se il documento lo richiede.
- AYVENS/ALD, LEASYS, VW, SANTANDER: preferisci sempre i valori IVA inclusa quando esplicitati.
- Se il documento mostra solo km totali, converti in km annui usando la durata.
- Se trovi una versione/allestimento ripetuta nel modello, separala nel campo versione e lascia il modello pulito.
- Se un servizio è esplicitamente incluso ma il suo nome non è standard, preservalo come stringa leggibile e deduplicala solo per equivalenza semantica.
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as AnalyzeBody;

    // Anthropic: content array con text + image blocks
    const userContent: unknown[] = [];

    if (body.pages && body.pages.length > 0) {
      for (const pageB64 of body.pages) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: pageB64 },
        });
      }
    } else if (body.base64 && body.mediaType) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: body.mediaType, data: body.base64 },
      });
    }

    const textInputClean = cleanText(body.text);
    const textInput = textInputClean || "(nessuno)";
    userContent.push({
      type: "text",
      text: PROMPT_TEXT.replace("{{TEXT_INPUT}}", textInput),
    });

    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseText || `Anthropic API error (${response.status})` }), {
        status: response.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Risposta Anthropic: content[0].text
    const payload = JSON.parse(responseText) as { content?: Array<{ text?: string }> };
    const raw = payload.content?.[0]?.text ?? "{}";
    const parsed = parseJsonFromText(raw);
    const data = normalizePreventivo(parsed, textInputClean);

    return new Response(JSON.stringify({ data }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
