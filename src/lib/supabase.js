import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Bypassa il Web Locks API cross-tab: evita il loop di furti del lock
    // tra tab multiple. Nessun impatto funzionale su questo sito.
    lock: (_name, _acquireTimeout, fn) => fn(),
  },
});
