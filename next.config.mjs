import { readFileSync } from 'node:fs';

// Redirect, 410 e header del vecchio sito (generati da scripts/generate-legacy-redirects.mjs):
// qui e non in vercel.json, così valgono anche fuori da Vercel.
const routes = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url), 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Node autonomo per l'hosting del cliente; su Vercel non cambia nulla.
  output: 'standalone',
  redirects: async () => routes.redirects,
  // beforeFiles come in vercel.json: le regole valgono prima delle pagine.
  rewrites: async () => ({ beforeFiles: routes.rewrites }),
  headers: async () => routes.headers,
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
