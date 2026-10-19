/** @type {import('next').NextConfig} */
const nextConfig = {
  // I nomi VITE_* restano quelli delle variabili d'ambiente su Vercel e in .env:
  // il codice client legge NEXT_PUBLIC_*, valorizzate da qui.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VITE_SITE_URL,
  },
  // Gli URL del vecchio sito terminano senza slash: Next non deve riscriverli.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
};

export default nextConfig;
