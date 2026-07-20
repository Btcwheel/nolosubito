import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  UserPlus, Mail, Shield, CheckCircle2, XCircle, Edit2,
  Power, PowerOff, ChevronDown, ChevronUp, Users, Briefcase, Crown,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MODULI, RUOLI_BASE, DEFAULT_PERMISSIONS, getEffectivePermissions } from '@/lib/permissions';

const INVITE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-team-member`;

const TIPI_ACCOUNT = [
  { id: 'backoffice', label: 'Backoffice', desc: 'Operatore con permessi per modulo' },
  { id: 'agente',     label: 'Agente',     desc: 'Portale agente, materiali, provvigioni' },
  { id: 'admin',      label: 'Admin',      desc: 'Accesso completo alla piattaforma', ownerOnly: true },
];

// ── Colore badge ruolo ────────────────────────────────────────────────────────

function RuoloBadge({ ruolo }) {
  const cfg = RUOLI_BASE.find(r => r.id === ruolo);
  if (!cfg) return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Checkbox permesso ─────────────────────────────────────────────────────────

function PermessoToggle({ modulo, checked, onChange, isDefault }) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
      ${checked ? 'border-electric/30 bg-electric/5' : 'border-border/40 bg-muted/20 opacity-60'}`}>
      <div
        onClick={() => onChange(!checked)}
        className={`mt-0.5 size-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors
          ${checked ? 'bg-electric border-electric' : 'border-muted-foreground/30'}`}
      >
        {checked && <CheckCircle2 className="size-2.5 text-white" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">{modulo.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{modulo.desc}</p>
        {isDefault !== checked && (
          <p className="text-xs text-electric mt-0.5 font-medium">
            {checked ? '↑ Aggiunto rispetto al ruolo base' : '↓ Rimosso rispetto al ruolo base'}
          </p>
        )}
      </div>
    </label>
  );
}

// ── Dialog modifica permessi ──────────────────────────────────────────────────

function EditPermissionsDialog({ member, open, onClose, onSave }) {
  const [ruolo, setRuolo] = useState(member?.backoffice_role ?? 'operatore_base');
  const [perms, setPerms] = useState(() => getEffectivePermissions(member?.backoffice_role, member?.permissions ?? {}));

  // Quando cambia il ruolo, resetta i permessi al default del nuovo ruolo
  function handleRuoloChange(r) {
    setRuolo(r);
    setPerms(DEFAULT_PERMISSIONS[r]);
  }

  function handleModuloChange(moduloId, val) {
    setPerms(prev => ({ ...prev, [moduloId]: val }));
  }

  // Calcola gli override rispetto al default del ruolo scelto
  function buildOverride() {
    const def = DEFAULT_PERMISSIONS[ruolo];
    const override = {};
    for (const m of MODULI) {
      if (perms[m.id] !== def[m.id]) override[m.id] = perms[m.id];
    }
    return override;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Permessi — {member?.full_name || member?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Ruolo base */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ruolo base</p>
            <div className="flex gap-2 flex-wrap">
              {RUOLI_BASE.map(r => (
                <button type="button"
                  key={r.id}
                  onClick={() => handleRuoloChange(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${ruolo === r.id ? `${r.color} ring-2 ring-offset-1 ring-electric` : 'border-border/50 text-muted-foreground hover:border-electric/40'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Il ruolo base definisce i permessi di partenza. Puoi personalizzare ogni modulo sotto.
            </p>
          </div>

          {/* Moduli */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accesso per modulo</p>
            <div className="space-y-2">
              {MODULI.map(m => (
                <PermessoToggle
                  key={m.id}
                  modulo={m}
                  checked={perms[m.id] ?? false}
                  onChange={val => handleModuloChange(m.id, val)}
                  isDefault={DEFAULT_PERMISSIONS[ruolo][m.id] ?? false}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button onClick={onClose} variant="outline" className="flex-1">Annulla</Button>
          <Button onClick={() => onSave(ruolo, buildOverride())} className="flex-1">Salva permessi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Card membro team ──────────────────────────────────────────────────────────

function MemberCard({ member, onEdit, onToggleActive }) {
  const [expanded, setExpanded] = useState(false);
  const perms = getEffectivePermissions(member.backoffice_role, member.permissions ?? {});

  return (
    <div className={`bg-card border rounded-xl transition-all ${!member.is_active ? 'opacity-50 border-border/30' : 'border-border/50'}`}>
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="size-9 rounded-full bg-electric/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-electric">
            {(member.full_name || member.email)[0].toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              {member.full_name || <span className="text-muted-foreground italic">Nome non impostato</span>}
            </p>
            <RuoloBadge ruolo={member.backoffice_role} />
            {!member.is_active && (
              <span className="text-xs text-destructive font-medium">Disattivato</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{member.email}</p>
          {member.invited_at && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Invitato il {format(new Date(member.invited_at), "d MMM yyyy", { locale: it })}
            </p>
          )}
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-1 shrink-0">
          <button type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button type="button"
            onClick={() => onEdit(member)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Edit2 className="size-4" />
          </button>
          <button type="button"
            onClick={() => onToggleActive(member)}
            className={`p-1.5 rounded-lg transition-colors ${member.is_active
              ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/5'
              : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'}`}
            title={member.is_active ? 'Disattiva account' : 'Riattiva account'}
          >
            {member.is_active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
          </button>
        </div>
      </div>

      {/* Permessi espansi */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/20 pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accesso ai moduli</p>
          <div className="grid grid-cols-2 gap-1.5">
            {MODULI.map(m => (
              <div key={m.id} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg
                ${perms[m.id] ? 'text-green-700 bg-green-50' : 'text-muted-foreground/50 bg-muted/30'}`}>
                {perms[m.id]
                  ? <CheckCircle2 className="size-3 shrink-0" />
                  : <XCircle className="size-3 shrink-0" />}
                {m.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Riga membro semplice (Agenti / Admin, senza permessi per modulo) ──────────

function SimpleMemberRow({ member, badgeLabel, badgeClass, badgeIcon: BadgeIcon, onToggleActive, showToggle = true }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${!member.is_active ? 'opacity-50 border-border/30' : 'bg-muted/20 border-border/30'}`}>
      <div className="size-8 rounded-full bg-electric/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-electric">
          {(member.full_name || member.email)[0].toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{member.full_name || member.email}</p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      {member.is_owner && (
        <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-semibold flex items-center gap-1">
          <Crown className="size-3" /> Titolare
        </span>
      )}
      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${badgeClass}`}>
        {BadgeIcon && <BadgeIcon className="size-3" />} {badgeLabel}
      </span>
      {!member.is_active && (
        <span className="text-xs text-destructive font-medium">Disattivato</span>
      )}
      {showToggle && (
        <button type="button"
          onClick={() => onToggleActive(member)}
          className={`p-1.5 rounded-lg transition-colors ${member.is_active
            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/5'
            : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'}`}
          title={member.is_active ? 'Disattiva account' : 'Riattiva account'}
        >
          {member.is_active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
        </button>
      )}
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function AdminTeam() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const isOwner = !!profile?.is_owner;
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form invito
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', tipoAccount: 'backoffice', ruolo: 'operatore_base' });
  const [invitePerms, setInvitePerms] = useState(DEFAULT_PERMISSIONS.operatore_base);
  const [inviting, setInviting] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, backoffice_role, permissions, is_active, is_owner, invited_at, created_at')
        .in('role', ['backoffice', 'admin', 'agente'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.fullName) {
      toast({ title: 'Compila nome ed email.', variant: 'destructive' });
      return;
    }
    setInviting(true);
    try {
      const isBackoffice = inviteForm.tipoAccount === 'backoffice';

      // Calcola override rispetto al default (solo per backoffice)
      let override = {};
      if (isBackoffice) {
        const def = DEFAULT_PERMISSIONS[inviteForm.ruolo];
        for (const m of MODULI) {
          if (invitePerms[m.id] !== def[m.id]) override[m.id] = invitePerms[m.id];
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(INVITE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          targetRole: inviteForm.tipoAccount,
          ...(isBackoffice ? { backofficeRole: inviteForm.ruolo, permissions: override } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);

      toast({ title: `Invito inviato a ${inviteForm.email}` });
      setShowInvite(false);
      setInviteForm({ fullName: '', email: '', tipoAccount: 'backoffice', ruolo: 'operatore_base' });
      setInvitePerms(DEFAULT_PERMISSIONS.operatore_base);
      qc.invalidateQueries(['team-members']);
    } catch (err) {
      toast({ title: 'Errore invito', description: String(err), variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  }

  const updatePermsMut = useMutation({
    mutationFn: async ({ id, ruolo, override }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ backoffice_role: ruolo, permissions: override })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Permessi aggiornati.' });
      setEditingMember(null);
      qc.invalidateQueries(['team-members']);
    },
    onError: e => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const toggleActiveMut = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('profiles').update({ is_active: !is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      toast({ title: is_active ? 'Account disattivato.' : 'Account riattivato.' });
      qc.invalidateQueries(['team-members']);
    },
    onError: e => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const admins = members.filter(m => m.role === 'admin');
  const operatori = members.filter(m => m.role === 'backoffice');
  const agenti = members.filter(m => m.role === 'agente');
  const tipiDisponibili = TIPI_ACCOUNT.filter(t => !t.ownerOnly || isOwner);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" /> Team
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {operatori.length} operator{operatori.length === 1 ? 'e' : 'i'} · {agenti.length} agent{agenti.length === 1 ? 'e' : 'i'} · invita e gestisci il team
          </p>
        </div>
        <Button onClick={() => setShowInvite(v => !v)} className="gap-2">
          <UserPlus className="size-4" />
          Invita
        </Button>
      </div>

      {/* Form invito */}
      {showInvite && (
        <div className="bg-card border border-electric/30 rounded-xl p-5 space-y-5">
          <p className="text-sm font-semibold text-foreground">Nuovo membro del team</p>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Tipo account</label>
            <div className="flex gap-2 flex-wrap">
              {tipiDisponibili.map(t => (
                <button type="button"
                  key={t.id}
                  onClick={() => setInviteForm(p => ({ ...p, tipoAccount: t.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${inviteForm.tipoAccount === t.id ? 'bg-electric/10 text-electric border-electric/40 ring-2 ring-offset-1 ring-electric' : 'border-border/50 text-muted-foreground hover:border-electric/40'}`}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {!isOwner && (
              <p className="text-xs text-muted-foreground mt-2">
                Solo il titolare può invitare nuovi account Admin.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Nome completo</label>
              <Input
                value={inviteForm.fullName}
                onChange={e => setInviteForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Alessia Rossi"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Email</label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                placeholder="alessia@nolosubito.it"
              />
            </div>
            {inviteForm.tipoAccount === 'backoffice' && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Ruolo base</label>
                <Select
                  value={inviteForm.ruolo}
                  onValueChange={r => {
                    setInviteForm(p => ({ ...p, ruolo: r }));
                    setInvitePerms(DEFAULT_PERMISSIONS[r]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RUOLI_BASE.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Permessi moduli — solo backoffice */}
          {inviteForm.tipoAccount === 'backoffice' && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accesso ai moduli</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODULI.map(m => (
                  <PermessoToggle
                    key={m.id}
                    modulo={m}
                    checked={invitePerms[m.id] ?? false}
                    onChange={val => setInvitePerms(p => ({ ...p, [m.id]: val }))}
                    isDefault={DEFAULT_PERMISSIONS[inviteForm.ruolo][m.id] ?? false}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Mail className="size-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700">
              Riceverà un'email con il link per impostare la password e accedere alla piattaforma.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInvite} disabled={inviting || !inviteForm.email || !inviteForm.fullName} className="flex-1">
              {inviting ? 'Invio...' : 'Invia invito'}
            </Button>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Annulla</Button>
          </div>
        </div>
      )}

      {/* Lista operatori */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {operatori.length === 0 && !showInvite && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nessun operatore ancora.</p>
              <p className="text-xs mt-1">Clicca "Invita operatore" per aggiungere il primo membro del team.</p>
            </div>
          )}
          {operatori.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              onEdit={setEditingMember}
              onToggleActive={({ id, is_active }) => toggleActiveMut.mutate({ id, is_active })}
            />
          ))}
        </div>
      )}

      {/* Sezione agenti */}
      {agenti.length > 0 && (
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agenti</p>
          <div className="space-y-2">
            {agenti.map(m => (
              <SimpleMemberRow
                key={m.id}
                member={m}
                badgeLabel="Agente"
                badgeClass="bg-blue-50 text-blue-700 border-blue-200"
                badgeIcon={Briefcase}
                onToggleActive={({ id, is_active }) => toggleActiveMut.mutate({ id, is_active })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sezione admin */}
      {admins.length > 0 && (
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Amministratori</p>
          <div className="space-y-2">
            {admins.map(m => (
              <SimpleMemberRow
                key={m.id}
                member={m}
                badgeLabel="Admin"
                badgeClass="bg-purple-50 text-purple-700 border-purple-200"
                badgeIcon={Shield}
                showToggle={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialog modifica permessi */}
      {editingMember && (
        <EditPermissionsDialog
          member={editingMember}
          open={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(ruolo, override) => updatePermsMut.mutate({ id: editingMember.id, ruolo, override })}
        />
      )}
    </div>
  );
}
