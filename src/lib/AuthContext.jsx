import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Sessione corrente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setIsLoadingAuth(false);
    });

    // Listener cambi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      console.log('[Auth] fetchProfile →', { data, error });
      if (!error && data) setProfile(data);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[Auth] signIn →', { data, error });
    if (error) throw error;
    return data;
  };

  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/mia-pratica` },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isBackoffice = profile?.role === 'backoffice';
  const isAgente = profile?.role === 'agente';
  const isCliente = profile?.role === 'cliente';
  const isAuthenticated = !!user;
  const isStaff = isAdmin || isBackoffice;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      isAdmin,
      isBackoffice,
      isAgente,
      isCliente,
      isStaff,
      signIn,
      signInWithMagicLink,
      logout,
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
