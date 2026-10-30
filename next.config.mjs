// Redirect, rewrite e header del vecchio sito stanno in vercel.json (generati da scripts/generate-legacy-redirects.mjs).
// Next.js li legge da lì, così valgono anche fuori da Vercel (server proprio con `next start`).
// Su Vercel si applicano due volte (prima vercel.json, poi Next.js) con lo stesso risultato.
import vercelConfig from "./vercel.json" with { type: "json" };

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
  async redirects() {
    return vercelConfig.redirects ?? [];
  },
  async rewrites() {
    return { beforeFiles: vercelConfig.rewrites ?? [], afterFiles: [], fallback: [] };
  },
  async headers() {
    return vercelConfig.headers ?? [];
  },
};

export default nextConfig;
