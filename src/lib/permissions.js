// Definizione moduli e permessi default per ruolo base

export const MODULI = [
  { id: 'pratiche',      label: 'Gestione pratiche',       desc: 'Aprire, modificare e assegnare le pratiche clienti' },
  { id: 'preventivi',    label: 'Preventivi broker',        desc: 'Caricare preventivi broker e generare PDF Nolosubito' },
  { id: 'lead',          label: 'Gestione lead',            desc: 'Visualizzare e gestire i lead in entrata' },
  { id: 'escalation',    label: 'Chat Luca (escalation)',   desc: 'Rispondere alle escalation dell\'agente AI' },
  { id: 'knowledge_base',label: 'Knowledge Base',           desc: 'Aggiungere documenti e addestrare Luca' },
  { id: 'report',        label: 'Report e statistiche',     desc: 'Accesso alle statistiche e ai grafici' },
];

export const RUOLI_BASE = [
  { id: 'operatore_base',   label: 'Operatore Base',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'operatore_senior', label: 'Operatore Senior', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'supervisore',      label: 'Supervisore',      color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

// Permessi default per ogni ruolo base
export const DEFAULT_PERMISSIONS = {
  operatore_base: {
    pratiche:       true,
    preventivi:     true,
    lead:           true,
    escalation:     false,
    knowledge_base: false,
    report:         false,
  },
  operatore_senior: {
    pratiche:       true,
    preventivi:     true,
    lead:           true,
    escalation:     true,
    knowledge_base: true,
    report:         false,
  },
  supervisore: {
    pratiche:       true,
    preventivi:     false,
    lead:           true,
    escalation:     true,
    knowledge_base: true,
    report:         true,
  },
};

// Calcola i permessi effettivi: default del ruolo + override espliciti
export function getEffectivePermissions(backofficeRole, permissionsOverride = {}) {
  const base = DEFAULT_PERMISSIONS[backofficeRole] ?? DEFAULT_PERMISSIONS.operatore_base;
  return { ...base, ...permissionsOverride };
}

// Hook-free helper: dato un profilo, ha accesso a un modulo?
export function canAccess(profile, modulo) {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  if (profile.role !== 'backoffice') return false;
  if (!profile.is_active) return false;
  const perms = getEffectivePermissions(profile.backoffice_role, profile.permissions ?? {});
  return perms[modulo] === true;
}
