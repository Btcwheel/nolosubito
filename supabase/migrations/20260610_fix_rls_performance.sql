-- ==============================================================================
-- RISOLUZIONE PROBLEMA PERFORMANCE RLS (Blocchi per utenti non-admin)
-- ==============================================================================
-- Quando un utente non-admin (come un Agente o un Backoffice) accede al sistema,
-- Supabase valuta le regole di sicurezza (RLS) riga per riga per decidere
-- quali dati può vedere. 
--
-- Problema: La funzione 'get_user_role()' non era marcata come "stable". 
-- Di conseguenza, PostgreSQL eseguiva una query SELECT per ricalcolare
-- il ruolo per OGNI SINGOLA RIGA letta dal database. Su migliaia di pratiche,
-- lead o veicoli, questo causava decine di migliaia di query, bloccando
-- completamente il database per gli agenti.
-- 
-- Per l'admin (lcoccimiglio) il blocco non si notava perché la regola per 
-- l'admin era la prima della lista e faceva "short-circuit" (ritornava true
-- subito, evitando il calcolo sulle righe successive).
-- ==============================================================================

-- 1. Aggiorniamo la funzione per il ruolo rendendola "stable"
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE -- IMPORTANTE: Dice a Postgres di memorizzare il risultato (eseguita 1 volta sola per query)
SECURITY DEFINER
AS $$
  select role from profiles where id = auth.uid();
$$;

-- 2. Creiamo una funzione "stable" anche per recuperare l'email dell'utente
-- (usata nella RLS delle pratiche e dei documenti)
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
AS $$
  select email from profiles where id = auth.uid();
$$;

-- 3. Aggiorniamo la RLS delle pratiche per usare la nuova funzione stable
DROP POLICY IF EXISTS "Cliente vede la propria pratica via access_token" ON pratiche;
CREATE POLICY "Cliente vede la propria pratica via access_token"
  ON pratiche FOR SELECT 
  USING (cliente_email = public.get_user_email());

-- 4. Aggiorniamo la RLS dei documenti
DROP POLICY IF EXISTS "Cliente vede i propri documenti" ON pratica_documenti;
CREATE POLICY "Cliente vede i propri documenti"
  ON pratica_documenti FOR SELECT 
  USING (
    exists (
      select 1 from pratiche p
      where p.id = pratica_id and p.cliente_email = public.get_user_email()
    )
  );

-- 5. Aggiorniamo la RLS delle note
DROP POLICY IF EXISTS "Cliente vede note visibili" ON pratica_note;
CREATE POLICY "Cliente vede note visibili"
  ON pratica_note FOR SELECT 
  USING (
    visibile_cliente = true and
    exists (
      select 1 from pratiche p
      where p.id = pratica_id and p.cliente_email = public.get_user_email()
    )
  );
