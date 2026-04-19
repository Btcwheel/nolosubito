import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, LogIn, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const { signIn, signInWithMagicLink, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // Redirect se già loggato
  React.useEffect(() => {
    if (isAuthenticated && profile) {
      const dest = {
        admin: "/admin",
        backoffice: "/backoffice",
        agente: "/agente",
        cliente: "/mia-pratica",
      }[profile.role] || "/";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, profile, navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      toast({ title: "Errore di accesso", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setMagicSent(true);
    } catch (err) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <Link to="/">
            <img
              src="https://www.nolosubito.it/wp-content/uploads/2025/10/logo-BIANCO350x100.png"
              alt="NoloSubito"
              className="h-10 w-auto object-contain mx-auto mb-6"
            />
          </Link>
          <h1 className="font-heading font-bold text-2xl text-white">Accedi</h1>
          <p className="text-white/50 text-sm mt-1">Area riservata NoloSubito</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          {/* Tab selector */}
          <div className="flex rounded-xl border border-border/50 p-1 mb-6 gap-1">
            {[
              { id: "password", label: "Password" },
              { id: "magic", label: "Magic Link" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === id
                    ? "bg-navy text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><LogIn className="w-4 h-4 mr-2" /> Accedi</>
                )}
              </Button>
            </form>
          ) : magicSent ? (
            <div className="text-center py-4">
              <Mail className="w-10 h-10 text-electric mx-auto mb-3" />
              <p className="font-semibold text-foreground">Email inviata!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Controlla la tua casella di posta e clicca il link per accedere.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <Label htmlFor="magic-email" className="text-sm">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  className="mt-1.5 h-11"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Riceverai un link di accesso via email. Nessuna password richiesta.
              </p>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-electric hover:bg-electric/90 text-white font-semibold rounded-xl cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Mail className="w-4 h-4 mr-2" /> Invia Magic Link</>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors">← Torna al sito</Link>
        </p>
      </motion.div>
    </div>
  );
}
