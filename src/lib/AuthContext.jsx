import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const fetchedFor = useRef(null);
  const profileRef = useRef(null);

  // Keep ref in sync so fetchProfile can read current profile without depending on state
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const fetchProfile = useCallback(async (userId, { force = false } = {}) => {
    if (!userId) return null;
    if (!force && fetchedFor.current === userId) {
      console.log('[Auth] fetchProfile → skip (già fetched per questo utente)');
      return profileRef.current;
    }
    setAuthError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] fetchProfile error →', error);
        setAuthError(error.message);
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
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []); // stabile — legge profile tramite ref, non come dipendenza

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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, { force: true });
      } else {
        setIsLoadingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      console.log('[Auth] onAuthStateChange →', _event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Forza sempre il refetch dopo login/logout per evitare ruolo stale
        fetchedFor.current = null;
        await fetchProfile(session.user.id, { force: true });
      } else {
        setProfile(null);
        fetchedFor.current = null;
        setIsLoadingAuth(false);
      }
    });

    // Quando la tab torna in foreground, verifica se il token è prossimo alla scadenza.
    // Firefox/Chrome congelano i timer JS nelle tab in background: il timer interno di
    // Supabase non scatta e il token può scadere silenziosamente.
    // ATTENZIONE: chiamare refreshSession() senza una sessione valida causa un logout
    // a cascata con token corrotto → 400/403 sulle API. Quindi prima controlliamo.
    let isRefreshing = false;
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || isRefreshing) return;

      // Legge la sessione corrente SENZA fare richieste di rete
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Nessuna sessione attiva — non fare nulla

      // Controlla se il token scade entro 10 minuti (o è già scaduto)
      const expiresAt = (session.expires_at ?? 0) * 1000;
      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() < expiresAt - tenMinutes) {
        console.log('[Auth] tab visibile — token ancora valido, skip refresh');
        return;
      }

      isRefreshing = true;
      console.log('[Auth] tab visibile — token in scadenza, refresh in corso…');
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[Auth] refresh fallito:', error.message);
        } else {
          console.log('[Auth] sessione rinnovata');
        }
      } finally {
        isRefreshing = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile]);

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
