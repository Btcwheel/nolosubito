import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Bypassa il Web Locks API cross-tab: il lock nativo (navigator.locks)
    // può restare "appeso" da una tab in background e bloccare getSession()/
    // refreshSession() nella tab in foreground dopo il resume (freeze su /cms
    // dopo background su Mac/Chrome). Nessun impatto funzionale su questo sito.
    lock: (_name, _acquireTimeout, fn) => fn(),
  },
  global: {
    headers: {
      'X-Client-Info': 'fleet-flow-nolo',
    },
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        return await fetch(url, {
          ...options,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    },
  },
});
