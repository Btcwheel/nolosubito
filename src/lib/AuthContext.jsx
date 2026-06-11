import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

// Timeout massimo per il caricamento auth (evita pagina bianca infinita)
const AUTH_INIT_TIMEOUT = 8000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const fetchedFor = useRef(null);
  const profileRef = useRef(null);
  const initTimerRef = useRef(null);
  const lastReloadRef = useRef(0);

  // Keep ref in sync so fetchProfile can read current profile without depending on state
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Reload sicuro: evita loop infiniti ricaricando al massimo una volta ogni 10s
  const safeReload = useCallback(() => {
    const now = Date.now();
    if (now - lastReloadRef.current < 10000) {
      console.warn('[Auth] Reload già fatto recentemente, skip');
      return;
    }
    lastReloadRef.current = now;
    console.warn('[Auth] Reload pagina per resettare stato auth');
    window.location.reload();
  }, []);

  // Timeout di sicurezza: se isLoadingAuth resta true troppo a lungo, sblocca
  useEffect(() => {
    if (isLoadingAuth) {
      clearTimeout(initTimerRef.current);
      initTimerRef.current = setTimeout(() => {
        console.warn('[Auth] INIT TIMEOUT — sblocco dopo', AUTH_INIT_TIMEOUT, 'ms');
        setIsLoadingAuth(false);
      }, AUTH_INIT_TIMEOUT);
    }
    return () => clearTimeout(initTimerRef.current);
  }, [isLoadingAuth]);

  const fetchProfile = useCallback(async (userId, { force = false } = {}) => {
    if (!userId) return null;
    if (!force && fetchedFor.current === userId) {
      console.log('[Auth] fetchProfile → skip (già fetched per questo utente)');
      return profileRef.current;
    }
    setAuthError(null);
    try {
      let data, error;
      // Dopo il resume dal background a volte la prima query torna senza
      // riga né errore (race con il refresh del token) — un retry risolve.
      for (let attempt = 0; attempt <= 1; attempt++) {
        ({ data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle());

        if (error || data) break;
        console.warn('[Auth] fetchProfile → nessun profile, retry tra 1s...', userId);
        await new Promise(r => setTimeout(r, 1000));
      }

      if (error) {
        console.error('[Auth] fetchProfile error →', error);
        setAuthError(error.message);
        // Probabile connessione "morta" dopo resume dal background — reload pulito
        safeReload();
        return null;
      }

      if (!data) {
        console.warn('[Auth] fetchProfile → nessun profile per userId', userId);
        return null;
      }

      console.log('[Auth] fetchProfile OK → role:', data.role, 'is_active:', data.is_active);
      fetchedFor.current = userId;
      setProfile(data);
      return data;
    } catch (e) {
      console.error('[Auth] fetchProfile exception →', e);
      setAuthError(String(e));
      // Probabile connessione "morta" dopo resume dal background — reload pulito
      safeReload();
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [safeReload]);

  // Espone diagnostica in console per debug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__authDebug = {
        getState: () => ({ user, profile, isLoadingAuth, authError }),
        refreshProfile: () => user ? fetchProfile(user.id, { force: true }) : null,
        clearCache: async () => {
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          setProfile(null);
          fetchedFor.current = null;
          console.log('[Auth] cache cleared, reload consigliato');
        },
      };
    }
  }, [user, profile, isLoadingAuth, authError, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Init: controlla sessione con timeout
    const initPromise = supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, { force: true });
      } else {
        setUser(null);
        setProfile(null);
        setIsLoadingAuth(false);
      }
    });

    // Se getSession() si blocca, sblocca dopo 5s
    const initTimeout = setTimeout(() => {
      if (mounted && isLoadingAuth) {
        console.warn('[Auth] getSession timeout — sblocco');
        setIsLoadingAuth(false);
      }
    }, 5000);

    initPromise.finally(() => clearTimeout(initTimeout));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('[Auth] onAuthStateChange →', event, session?.user?.email);

      // Se l'evento indica che la sessione è scaduta o il refresh è fallito
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setProfile(null);
        fetchedFor.current = null;
        setIsLoadingAuth(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        fetchedFor.current = null;
        await fetchProfile(session.user.id, { force: true });
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchedFor.current = null;
        await fetchProfile(session.user.id, { force: true });
      } else {
        setProfile(null);
        fetchedFor.current = null;
        setIsLoadingAuth(false);
      }
    });

    // Quando la tab torna in foreground, forza un refresh della sessione
    // se il token è scaduto o in scadenza. Se si blocca, reload della pagina.
    let isRefreshing = false;
    let refreshTimeoutId = null;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || isRefreshing) return;

      isRefreshing = true;
      console.log('[Auth] Tab in foreground — check sessione...');

      // Timeout di sicurezza: se il check si blocca, reload della pagina
      refreshTimeoutId = setTimeout(() => {
        console.warn('[Auth] visibility check TIMEOUT — reload pagina');
        safeReload();
      }, 4000);

      try {
        // getSession() legge da localStorage (no rete)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('[Auth] Nessuna sessione — redirect a login');
          setUser(null);
          setProfile(null);
          setIsLoadingAuth(false);
          return;
        }

        const expiresAt = (session.expires_at ?? 0) * 1000;
        const now = Date.now();

        // Token già scaduto o scade entro 2 minuti
        if (now >= expiresAt - 2 * 60 * 1000) {
          console.log('[Auth] Token scaduto/in scadenza — refresh...');
          const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
          if (error || !newSession) {
            console.warn('[Auth] Refresh fallito:', error?.message || 'nessuna sessione');
            // Reload invece di pulire user (resetta tutto lo stato)
            safeReload();
            return;
          }
          console.log('[Auth] Sessione rinnovata');
          setUser(newSession.user);
          fetchedFor.current = null;
          await fetchProfile(newSession.user.id, { force: true });
        } else {
          console.log('[Auth] Token valido (scade tra', Math.round((expiresAt - now) / 60000), 'min)');
        }
      } catch (e) {
        console.warn('[Auth] Errore visibility change:', e.message);
        // Reload invece di pulire user (resetta tutto lo stato)
        safeReload();
      } finally {
        clearTimeout(refreshTimeoutId);
        isRefreshing = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(initTimerRef.current);
      clearTimeout(refreshTimeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, safeReload]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[Auth] signIn →', { email, hasUser: !!data?.user, error: error?.message });
    if (error) throw error;
    return data;
  };

  const signInWithMagicLink = async (email) => {
    const siteUrl = import.meta.env.VITE_SITE_URL ?? "https://nolosubito.it";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/mia-pratica` },
    });
    if (error) throw error;
  };

  const sendOtp = async (email) => {
    const siteUrl = import.meta.env.VITE_SITE_URL ?? "https://nolosubito.it";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/mia-pratica` },
    });
    if (error) throw error;
  };

  const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    fetchedFor.current = null;
  };

  const refreshProfile = useCallback(() => {
    if (user) return fetchProfile(user.id, { force: true });
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === 'admin';
  const isBackoffice = profile?.role === 'backoffice';
  const isAgente = profile?.role === 'agente';
  const isCms = profile?.role === 'cms';
  const isCliente = profile?.role === 'cliente';
  const isAuthenticated = !!user;
  const isStaff = isAdmin || isBackoffice;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      isAdmin,
      isBackoffice,
      isAgente,
      isCms,
      isCliente,
      isStaff,
      signIn,
      signInWithMagicLink,
      sendOtp,
      verifyOtp,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
