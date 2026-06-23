import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Login from './components/Login';
import EscalationList from './components/EscalationList';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (loading) return <div className="app-loading">Caricamento...</div>;
  if (!user) return <Login />;

  return <EscalationList user={user} />;
}
