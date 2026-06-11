-- ==============================================================================
-- ROLLBACK URGENTE: rimuove STABLE da get_user_role()/get_user_email()
-- ==============================================================================
-- La migration 20260610_fix_rls_performance.sql ha marcato queste funzioni
-- come STABLE. Da quel momento si e' osservato un leak cross-utente sulla
-- tabella profiles (un utente riceve la riga profilo di un altro utente),
-- probabilmente per cache/riuso del risultato tra richieste diverse sotto
-- connection pooling. Si rimuove STABLE (torna al comportamento precedente,
-- VOLATILE di default) mantenendo SECURITY DEFINER.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  select role from profiles where id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  select email from profiles where id = auth.uid();
$$;
