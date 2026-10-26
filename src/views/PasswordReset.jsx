import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function PasswordReset() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  // Supabase emette PASSWORD_RECOVERY quando il link è valido per il flusso classico.
  // Aggiungiamo anche il supporto per token_hash e per catturare gli errori nell'URL istantaneamente.
  useEffect(() => {
    let alive = true;
    
    // Controlla se c'è un errore nell'URL (hash o query)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");
    
    if (errorDesc) {
      setTokenValid(false);
      return;
    }

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    // Nuovo flusso raccomandato: Token Hash (previene i click automatici degli antivirus/email scanner)
    if (tokenHash && type === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ error }) => {
          if (!alive) return;
          if (error) {
            setTokenValid(false);
          } else {
            setTokenValid(true);
          }
        });
      return;
    }

    // Flusso classico: attendiamo PASSWORD_RECOVERY
    const timeoutId = window.setTimeout(() => {
      if (alive) setTokenValid((current) => current === null ? false : current);
    }, 15000); // 15 secondi invece di 30

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (session?.user) {
        setTokenValid(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setTokenValid(true);
      }
    });

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "Password troppo corta", description: "Minimo 8 caratteri.", variant: "destructive" });
      return;
    }

    if (password !== passwordConfirm) {
      toast({ title: "Le password non coincidono", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Supabase ha già autenticato l'utente dal recovery link
      // Ora facciamo il cambio password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = profile?.role ?? user?.user_metadata?.role ?? "cliente";
      const destination =
        {
          admin: "/admin",
          backoffice: "/backoffice",
          agente: "/agente",
          cms: "/cms",
          cliente: "/mia-pratica",
        }[role] || "/mia-pratica";

      toast({
        title: "Password aggiornata con successo!",
        description: "Ti stiamo portando nella tua area.",
      });

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Reset password error:", err);
      toast({
        title: "Errore durante l'aggiornamento",
        description: err.message || "Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 border-4 border-t-electric border-electric/20 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle className="size-5" />
            <h1 className="text-lg font-bold">Link non valido</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Il link di reset password è scaduto o non valido. Richiedi un nuovo link.
          </p>
          <Button onClick={() => navigate("/accedi", { replace: true })} className="w-full">
            Torna al login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 mb-4">
          <h1 className="text-2xl font-bold text-navy-dark mb-2">Nuova Password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Inserisci una nuova password per il tuo account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caratteri"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Conferma Password</label>
              <Input
                type={showPw ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Ripeti la password"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              {loading ? "Aggiornamento..." : "Aggiorna Password"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Ricordati la tua password?{" "}
          <button type="button"
            onClick={() => navigate("/accedi", { replace: true })}
            className="text-electric hover:text-electric/80 font-medium transition-colors"
          >
            Torna al login
          </button>
        </p>
      </div>
    </div>
  );
}
