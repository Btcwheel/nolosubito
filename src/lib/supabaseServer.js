import { createClient } from '@supabase/supabase-js';

// Client Supabase per il rendering sul server (ISR): solo lettura con la chiave anon,
// senza sessione né storage. Il client del browser (src/lib/supabase.js) non va importato qui.
export function createServerSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'X-Client-Info': 'nolosubito-next-server' } },
  });
}
