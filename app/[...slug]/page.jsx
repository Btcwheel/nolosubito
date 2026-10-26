import { notFound } from "next/navigation";
import SpaClient from "../spa-client";

// Le rotte pubbliche sono pagine Next.js. Il catch-all serve la SPA solo per i prefissi
// che esistono davvero in src/App.jsx (area riservata, login, link magici, stampa).
// Qualsiasi altro URL risponde 404 vero: prima rispondeva 200 con la SPA vuota
// e Google lo trattava come pagina duplicata senza canonical.
const SPA_PREFIXES = new Set([
  "login", "accedi", "partner", "password-reset", "risposta", "mia-pratica", "print",
  "hero-compare", "admin", "cms", "backoffice", "agente",
]);

// Aree riservate e pagine di servizio: mai nell'indice.
export const metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }) {
  const { slug } = await params;
  if (!SPA_PREFIXES.has(slug?.[0])) notFound();
  return <SpaClient />;
}
