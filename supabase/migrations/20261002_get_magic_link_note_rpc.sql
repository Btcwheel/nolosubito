-- getMagicLinkNote (MagicLinkReply.jsx) fa una select con join su pratiche
-- per mostrare il nome del cliente, ma anon non ha alcuna policy di lettura
-- sulla tabella pratiche: il join torna sempre null. Una funzione dedicata
-- evita di dover aprire pratiche in lettura per l'anon.
create or replace function get_magic_link_note(p_token text)
returns table (
  id uuid,
  pratica_id uuid,
  autore_nome text,
  testo text,
  created_at timestamptz,
  cliente_nome text,
  cliente_email text
)
language sql
security definer
set search_path = public
stable
as $$
  select pn.id, pn.pratica_id, pn.autore_nome, pn.testo, pn.created_at,
         p.cliente_nome, p.cliente_email
  from pratica_note pn
  join pratiche p on p.id = pn.pratica_id
  where pn.link_token = p_token
    and pn.link_accessed_at is null
    and pn.link_token_expires_at > now()
  limit 1;
$$;

grant execute on function get_magic_link_note(text) to anon;
