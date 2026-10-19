import { revalidatePath } from 'next/cache';

// Invalida le pagine renderizzate sul server quando cambiano offerte, prezzi o FAQ.
// Chiamata da un Database Webhook di Supabase (o a mano) con l'header "x-revalidate-secret".
// Richiede la variabile d'ambiente REVALIDATE_SECRET; senza, risponde 503 e non fa nulla.
export const dynamic = 'force-dynamic';

const PATHS = ['/'];

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: 'REVALIDATE_SECRET non configurato' }, { status: 503 });
  if (request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  for (const path of PATHS) revalidatePath(path);
  return Response.json({ revalidated: PATHS, at: new Date().toISOString() });
}
