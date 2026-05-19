import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogIn, Mail, Eye, EyeOff, ArrowLeft, CheckCircle2, Zap, Shield, Users, TrendingUp, Car, FileText, HandshakeIcon, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Contenuto pannello sinistro per ogni contesto
const CONTEXT_CONFIG = {
  internal: {
    badge: "Piattaforma Noleggio Lungo Termine",
    headline: <>Tutto il tuo<br />business,<br /><span className="text-electric">un solo posto.</span></>,
    sub: "Gestisci preventivi, pratiche e team con una piattaforma costruita per il noleggio a lungo termine italiano.",
    features: [
      { icon: TrendingUp, title: "Pratiche in tempo reale",  desc: "Stato aggiornato ad ogni cambio" },
      { icon: Users,      title: "Multi-ruolo",              desc: "Admin, backoffice, agenti, clienti" },
      { icon: Shield,     title: "Documenti sicuri",          desc: "Archiviazione cifrata end-to-end" },
    ],
    formTitle: "Bentornato 👋",
    formSub: "Accedi alla tua area riservata",
    mobileTitle: "Area Riservata",
  },
  partner: {
    badge: "Portale Partner",
    headline: <>Il tuo portale<br />partner.<br /><span className="text-electric">Tutto sotto controllo.</span></>,
    sub: "Gestisci le tue pratiche, accedi ai materiali di vendita e monitora le tue commissioni in tempo reale.",
    features: [
      { icon: FileText,        title: "Le tue pratiche",           desc: "Pipeline aggiornata in tempo reale" },
      { icon: HandshakeIcon,   title: "Materiali di vendita",      desc: "Brochure, listini e offerte" },
      { icon: TrendingUp,      title: "Commissioni trasparenti",   desc: "Monitora i tuoi guadagni" },
    ],
    formTitle: "Ciao, partner 👋",
    formSub: "Accedi al tuo portale agente",
    mobileTitle: "Portale Partner",
  },
  cliente: {
    badge: "Area Cliente",
    headline: <>La tua auto<br />è in arrivo.<br /><span className="text-electric">Segui ogni passo.</span></>,
    sub: "Consulta lo stato della tua pratica, carica i documenti richiesti e comunica direttamente con il nostro team.",
    features: [
      { icon: Car,    title: "Stato pratica live",    desc: "Aggiornamenti in tempo reale" },
      { icon: FileText, title: "Carica documenti",   desc: "Upload semplice e sicuro" },
      { icon: Bell,   title: "Notifiche immediate",  desc: "Sai sempre cosa succede" },
    ],
    formTitle: "Accedi alla tua area 👋",
    formSub: "Segui la tua pratica di noleggio",
    mobileTitle: "La Mia Pratica",
  },
};

export default function Login({ context = "internal" }) {
  const cfg = CONTEXT_CONFIG[context] ?? CONTEXT_CONFIG.internal;
  const { signIn, sendOtp, verifyOtp, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [mode, setMode]               = useState(() => searchParams.get("mode") === "otp" ? "otp" : "password");
  const [email, setEmail]             = useState(() => searchParams.get("email") ?? "");
  const [resetSent, setResetSent]     = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [otpSent, setOtpSent]         = useState(false);
  const [otpDigits, setOtpDigits]     = useState(["", "", "", "", "", ""]);
  const [focused, setFocused]         = useState(null);
  const otpRefs                        = useRef([]);

  // Sync email/mode da searchParams (fallback per mobile che perde i params al mount)
  useEffect(() => {
    const e = searchParams.get("email");
    const m = searchParams.get("mode");
    if (e) setEmail(e);
    if (m === "otp") setMode("otp");
  }, [searchParams]);

  React.useEffect(() => {
    if (!isAuthenticated || !profile) return;
    // Contesto cliente: sempre /mia-pratica indipendentemente dal ruolo nel DB
    if (context === "cliente") {
      navigate("/mia-pratica", { replace: true });
      return;
    }
    const dest = { admin: "/admin", backoffice: "/backoffice", agente: "/agente", cms: "/cms", cliente: "/mia-pratica" }[profile.role] || "/";
    navigate(dest, { replace: true });
  }, [isAuthenticated, profile, navigate, context]);

  const handleResetPassword = async () => {
    if (!email) {
      toast({ title: "Inserisci la tua email per ricevere il link.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL ?? "https://nolosubito.it";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/backoffice`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await signIn(email, password); }
    catch (err) { toast({ title: "Accesso negato", description: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await sendOtp(email); setOtpSent(true); }
    catch (err) { toast({ title: "Errore", description: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length < 6) return;
    setLoading(true);
    try { await verifyOtp(email, token); }
    catch (err) {
      toast({ title: "Codice non valido", description: "Controlla il codice e riprova.", variant: "destructive" });
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
    finally { setLoading(false); }
  };

  const handleOtpInput = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...otpDigits];
    text.split("").forEach((d, idx) => { next[idx] = d; });
    setOtpDigits(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-[hsl(220,100%,10%)]">

        {/* Layered glow blobs */}
        <div className="absolute top-[-120px] left-[-80px]  w-[500px] h-[500px] rounded-full bg-electric/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full bg-electric/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-electric/5 blur-[140px] pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* Top bar */}
        <div className="relative z-10 p-10">
          <Link to="/">
            <img
              src="/logo-bianco.png"
              alt="Nolosubito"
              width="160"
              height="32"
              className="h-8 w-auto object-contain"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-electric tracking-widest uppercase bg-electric/10 border border-electric/20 rounded-full px-3 py-1 mb-6">
              <Zap className="w-3 h-3" /> {cfg.badge}
            </span>

            <h2 className="font-heading font-bold text-[42px] leading-[1.15] text-white">
              {cfg.headline}
            </h2>

            <p className="mt-5 text-white/45 text-[15px] leading-relaxed max-w-[340px]">
              {cfg.sub}
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="mt-10 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {cfg.features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-electric/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-electric" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-10 pb-8 flex items-center justify-between">
          <p className="text-xs text-white/20">© 2025 Nolosubito</p>
          <div className="flex items-center gap-1.5 text-xs text-white/25">
            <Shield className="w-3 h-3" /> Connessione sicura SSL
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[380px]"
        >

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-navy mb-4">
              <Zap className="w-5 h-5 text-electric" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-foreground">{cfg.mobileTitle}</h1>
            <p className="text-muted-foreground text-sm mt-1">Nolosubito</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-heading font-bold text-[28px] text-foreground tracking-tight">
              {cfg.formTitle}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {cfg.formSub}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="relative flex bg-muted rounded-xl p-1 mb-7 gap-1">
            <div
              className="absolute top-1 bottom-1 bg-white rounded-[10px] shadow-sm"
              style={{
                width: "calc(50% - 4px)",
                left: mode === "password" ? "4px" : "calc(50%)",
                transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            {[{ id: "password", label: "Password" }, { id: "otp", label: "Codice OTP" }].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setOtpSent(false); setOtpDigits(["", "", "", "", "", ""]); }}
                className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 cursor-pointer rounded-[10px] ${
                  mode === id ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "password" ? (
              <motion.form
                key="pw"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                {/* Email field */}
                <div className="relative">
                  <label
                    htmlFor="email"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                      focused === "email" || email
                        ? "top-2 text-[10px] font-semibold style={{color:'#71BAED'}}"
                        : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    }`}
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className={`h-14 pt-5 pb-1 bg-muted/40 border transition-all duration-200 rounded-xl ${
                      focused === "email" ? "border-electric/60 ring-1 ring-electric/20 bg-electric/[0.03]" : "border-border/60"
                    }`}
                    autoComplete="email"
                  />
                </div>

                {/* Password field */}
                <div className="relative">
                  <label
                    htmlFor="password"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                      focused === "password" || password
                        ? "top-2 text-[10px] font-semibold style={{color:'#71BAED'}}"
                        : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    }`}
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className={`h-14 pt-5 pb-1 bg-muted/40 border transition-all duration-200 rounded-xl pr-12 ${
                      focused === "password" ? "border-electric/60 ring-1 ring-electric/20 bg-electric/[0.03]" : "border-border/60"
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl cursor-pointer transition-all duration-200 mt-1 shadow-lg shadow-navy/20 py-3.5"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Accedi</span>
                  }
                </Button>

                {resetSent ? (
                  <p className="text-center text-sm text-green-600 font-medium pt-1">
                    Email inviata! Controlla la tua casella.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="w-full text-center text-xs text-muted-foreground hover:text-electric transition-colors pt-1 cursor-pointer"
                  >
                    {resetLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Password dimenticata?"}
                  </button>
                )}
              </motion.form>

            ) : otpSent ? (
              <motion.form
                key="otp-verify"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="text-center">
                  <p className="font-heading font-bold text-lg text-foreground">Inserisci il codice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Codice inviato a <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                {/* 6 digit boxes */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-muted/40 outline-none transition-all duration-150 ${
                        d ? "border-electric/60 ring-1 ring-electric/20 text-foreground" : "border-border/60 text-foreground"
                      } focus:border-electric/60 focus:ring-1 focus:ring-electric/20`}
                      autoComplete="one-time-code"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loading || otpDigits.join("").length < 6}
                  className="w-full h-13 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl cursor-pointer transition-all duration-200 shadow-lg shadow-navy/20 py-3.5"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Verifica e accedi</span>
                  }
                </Button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpDigits(["", "", "", "", "", ""]); }}
                  className="w-full text-xs text-electric hover:underline cursor-pointer"
                >
                  Cambia email o reinvia il codice
                </button>
              </motion.form>

            ) : (
              <motion.form
                key="otp-email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="relative">
                  <label
                    htmlFor="otp-email"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                      focused === "otp" || email
                        ? "top-2 text-[10px] font-semibold"
                        : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    }`}
                  >
                    Email
                  </label>
                  <Input
                    id="otp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("otp")}
                    onBlur={() => setFocused(null)}
                    className={`h-14 pt-5 pb-1 bg-muted/40 border transition-all duration-200 rounded-xl ${
                      focused === "otp" ? "border-electric/60 ring-1 ring-electric/20 bg-electric/[0.03]" : "border-border/60"
                    }`}
                    autoComplete="email"
                  />
                </div>

                <div className="flex items-start gap-2.5 bg-electric/5 border border-electric/15 rounded-xl px-4 py-3">
                  <Zap className="w-3.5 h-3.5 text-electric shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ricevi un codice a 6 cifre via email — funziona su qualsiasi browser, anche in azienda.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl cursor-pointer transition-all duration-200 shadow-lg shadow-navy/20 py-3.5"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Invia codice OTP</span>
                  }
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border/40">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              Torna al sito
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
