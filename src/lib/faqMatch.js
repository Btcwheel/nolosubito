// Regole di assegnazione delle FAQ (tabella faq_targets).
// Una FAQ compare su un veicolo se almeno una sua regola corrisponde; a parità di
// pagina vengono prima le più specifiche (modello > caratteristica > tutte le schede).

export const TARGET_TYPES = {
  home: { label: "Home", specificity: 0 },
  vehicles: { label: "Tutte le schede veicolo", specificity: 1 },
  fuel: { label: "Alimentazione", specificity: 2 },
  category: { label: "Categoria", specificity: 2 },
  make: { label: "Marca", specificity: 2 },
  segment: { label: "Segmento", specificity: 2 },
  ready_delivery: { label: "Pronta consegna", specificity: 2 },
  model: { label: "Modello", specificity: 3 },
};

const norm = (s) => String(s ?? "").trim().toLowerCase();

export const modelKey = (make, model) => `${String(make ?? "").trim()}|${String(model ?? "").trim()}`;

function ruleMatches(t, v) {
  switch (t.target_type) {
    case "vehicles": return true;
    case "fuel": return norm(v.fuel_type) === norm(t.target_value);
    case "category": return norm(v.category) === norm(t.target_value);
    case "make": return norm(v.make) === norm(t.target_value);
    case "segment": return (v.segments ?? []).some(s => norm(s) === norm(t.target_value));
    case "ready_delivery": return v.is_ready_delivery === true;
    case "model": return norm(modelKey(v.make, v.model)) === norm(t.target_value);
    default: return false;
  }
}

// Specificità migliore tra le regole che corrispondono; null se nessuna.
function bestSpecificity(faq, vehicle) {
  let best = null;
  for (const t of faq.faq_targets ?? []) {
    if (t.target_type === "home" || !ruleMatches(t, vehicle)) continue;
    const s = TARGET_TYPES[t.target_type].specificity;
    if (best === null || s > best) best = s;
  }
  return best;
}

export function selectVehicleFaqs(faqs, vehicle, limit = 6) {
  if (!vehicle) return [];
  return faqs
    .map(f => ({ f, s: bestSpecificity(f, vehicle) }))
    .filter(x => x.s !== null)
    .sort((a, b) => b.s - a.s || a.f.sort_order - b.f.sort_order)
    .slice(0, limit)
    .map(x => x.f);
}

export function selectHomeFaqs(faqs, limit = 8) {
  return faqs
    .filter(f => (f.faq_targets ?? []).some(t => t.target_type === "home"))
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, limit);
}

// Quanti veicoli del catalogo vedranno questa FAQ (anteprima nel CMS).
export function countVehiclesForTargets(targets, vehicles) {
  const faq = { faq_targets: targets };
  const seen = new Set();
  for (const v of vehicles) {
    if (bestSpecificity(faq, v) !== null) seen.add(modelKey(v.make, v.model).toLowerCase());
  }
  return seen.size;
}
