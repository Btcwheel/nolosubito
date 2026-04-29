/**
 * Colori semantici per lo stato delle pratiche.
 * Fonte unica — importare da qui in tutti i componenti.
 *
 * Logica cromatica:
 *   navy    → stati brand (nuova, consegnata)
 *   electric (blue #2563EB) → azione richiesta / in progress
 *   fuel-petrol (amber) → documento richiesto / attesa cliente
 *   fuel-ev (green) → step positivo / approvato
 *   fuel-hybrid (teal) → in progressione contrattuale
 *   fuel-diesel (steel) → in attesa passiva
 *   muted   → neutro / chiuso
 */

export const PRATICA_STATUS_COLORS = {
  "Nuova":                         { badge: "bg-navy/10 text-navy border-navy/20",                       dot: "bg-navy" },
  "In Lavorazione":                { badge: "style={{backgroundColor:'#71BAED'}}/10 style={{color:'#71BAED'}} style={{borderColor:'#71BAED'}}/20",           dot: "style={{backgroundColor:'#71BAED'}}" },
  "Documenti Richiesti":           { badge: "bg-fuel-petrol/10 text-fuel-petrol border-fuel-petrol/20",  dot: "bg-fuel-petrol" },
  "Documenti Caricati":            { badge: "bg-fuel-ev/10 text-fuel-ev border-fuel-ev/20",              dot: "bg-fuel-ev" },
  "Attesa Affidamento Finanziaria":{ badge: "bg-fuel-diesel/10 text-fuel-diesel border-fuel-diesel/20",  dot: "bg-fuel-diesel" },
  "Affidamento Ricevuto":          { badge: "bg-fuel-ev/10 text-fuel-ev border-fuel-ev/20",              dot: "bg-fuel-ev" },
  "Stipula Contratto":             { badge: "bg-fuel-hybrid/10 text-fuel-hybrid border-fuel-hybrid/20",  dot: "bg-fuel-hybrid" },
  "Attesa Consegna":               { badge: "style={{backgroundColor:'#71BAED'}}/10 style={{color:'#71BAED'}} style={{borderColor:'#71BAED'}}/20",           dot: "style={{backgroundColor:'#71BAED'}}" },
  "Approvata":                     { badge: "bg-fuel-ev/15 text-fuel-ev border-fuel-ev/25",              dot: "bg-fuel-ev" },
  "Consegnata":                    { badge: "bg-navy/10 text-navy border-navy/20",                       dot: "bg-navy" },
  "Chiusa":                        { badge: "bg-muted text-muted-foreground border-border",              dot: "bg-muted-foreground" },
};

/** Fallback per stati non mappati */
export const DEFAULT_STATUS_COLOR = {
  badge: "bg-muted text-muted-foreground border-border",
  dot:   "bg-muted-foreground",
};
