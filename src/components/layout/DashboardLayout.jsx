import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, ClipboardList, Layers, FileText,
  LogOut, Menu, X, ChevronRight, ExternalLink,
  Users, FolderOpen, KeyRound, Eye, EyeOff, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";

// ── Modal cambio password (recovery + primo accesso) ─────────────────────────

function ChangePasswordModal({ onClose }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword]         = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPw, setShowPw]                   = useState(false);
  const [saving, setSaving]                   = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password troppo corta", description: "Minimo 8 caratteri.", variant: "destructive" });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast({ title: "Le password non coincidono", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password aggiornata!" });
      onClose();
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-electric" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-base text-foreground">Imposta la tua password</h3>
            <p className="text-xs text-muted-foreground">Scegli una password sicura per il tuo account</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Nuova password (min. 8 caratteri)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Conferma password"
            value={newPasswordConfirm}
            onChange={e => setNewPasswordConfirm(e.target.value)}
            required
          />
          <Button type="submit" disabled={saving} className="w-full bg-electric hover:bg-electric/90 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Salva password</>}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Configurazione sidebar per ruolo ──────────────────────────────────────────

const NAV_BY_ROLE = {
  admin: {
    areaLabel: "Admin Panel",
    links: [
      { path: "/admin",        label: "Dashboard",    icon: LayoutDashboard, exact: true },
      { path: "/admin/leads",  label: "Lead",         icon: Users,           exact: true },
      { path: "/cms",          label: "CMS",          icon: Layers,          exact: true },
    ],
  },
  backoffice: {
    areaLabel: "Backoffice",
    links: [
      { path: "/backoffice", label: "Pratiche", icon: ClipboardList, exact: true },
    ],
  },
  agente: {
    areaLabel: "Portale Agente",
    links: [
      { path: "/agente",           label: "Le Mie Pratiche", icon: ClipboardList, exact: true },
      { path: "/agente/materiali", label: "Materiali",       icon: FolderOpen,    exact: true },
    ],
  },
  cms: {
    areaLabel: "CMS",
    links: [
      { path: "/cms", label: "Gestione Contenuti", icon: Layers, exact: true },
    ],
  },
  cliente: {
    areaLabel: "Area Cliente",
    links: [
      { path: "/mia-pratica", label: "La Mia Pratica", icon: FileText, exact: true },
    ],
  },
};

// ── Sidebar content (riusata su mobile e desktop) ────────────────────────────

function SidebarContent({ config, profile, role, onLogout, onLinkClick }) {
  const location = useLocation();

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const initials =
    profile?.full_name
      ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
      : profile?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex flex-col h-full bg-navy">
      {/* Logo + area label */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <Link to="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 group">
          <img
            src="/logo-bianco.png"
            alt="Nolosubito"
            width="160"
            height="28"
            className="h-7 w-auto object-contain"
            onError={e => { e.target.style.display = "none"; }}
          />
          <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
        </Link>
        <p className="mt-2 text-[11px] font-bold text-electric uppercase tracking-widest">
          {config.areaLabel}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {config.links.map(({ path, label, icon: Icon, exact }) => {
          const active = isActive(path, exact);
          return (
            <Link
              key={path}
              to={path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "style={{backgroundColor:'#71BAED'}}/15 text-white border style={{borderColor:'#71BAED'}}/25"
                  : "text-white/55 hover:text-white hover:bg-white/6"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-electric/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-electric/20 border border-electric/25 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-electric">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {profile?.full_name || profile?.email || "Utente"}
            </p>
            <p className="text-[11px] text-white/35 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-white hover:bg-white/6 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Disconnetti
        </button>
      </div>
    </div>
  );
}

// ── Layout principale ─────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(
    () => window.location.hash.includes("type=recovery")
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setShowChangePw(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const role = profile?.role ?? "cliente";
  const config = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.cliente;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebarProps = {
    config,
    profile,
    role,
    onLogout: handleLogout,
    onLinkClick: () => setSidebarOpen(false),
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop sidebar (fixed) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 z-30 border-r border-white/6">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile sidebar (drawer) — CSS transition ── */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/55 z-40 lg:hidden transition-opacity duration-200 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 z-50 lg:hidden border-r border-white/6 transition-transform duration-250 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent {...sidebarProps} />
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">

        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 h-14 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <img
            src="/logo-bianco.png"
            alt="Nolosubito"
            width="160"
            height="24"
            className="h-6 w-auto object-contain"
            onError={e => { e.target.style.display = "none"; }}
          />
          <div className="flex-1" />
          <div className="w-7 h-7 rounded-full bg-electric/20 border border-electric/25 flex items-center justify-center">
            <span className="text-[10px] font-bold text-electric">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? profile?.email?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <OnboardingWelcome profile={profile} />
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
