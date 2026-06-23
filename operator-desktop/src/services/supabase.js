import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nowoiywrzfnjocvsbmih.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd29peXdyemZuam9jdnNibWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTg1MDUsImV4cCI6MjA5MjA3NDUwNX0.0Qr7mgoNnpaxO3l8QKX_g-_LuS7-u2ZelSaCEa9gRIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}
