-- La pagina pubblica /risposta/:token (MagicLinkReply.jsx) gira come utente
-- anonimo: mancavano sia la policy di lettura sia un modo sicuro per inserire
-- la risposta, quindi il flusso falliva sempre (RLS 42501 su insert, select
-- vuota anche con token valido). Aggiunge:
-- 1) una policy di sola lettura per anon, valida solo per link non scaduti
--    e non ancora usati (il token stesso, 32 byte casuali, è il segreto);
-- 2) una funzione security definer che valida il token server-side, inserisce
--    la risposta del cliente e marca il link come usato in un'unica transazione,
--    cosi' l'anon non ha bisogno di permessi di insert diretti sulla tabella.

create policy "Anon legge nota tramite magic link valido"
  on pratica_note for select to anon
  using (
    link_token is not null
    and link_accessed_at is null
    and link_token_expires_at > now()
  );

create or replace function respond_to_magic_link_note(p_token text, p_testo text)
returns pratica_note
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original pratica_note;
  v_cliente_nome text;
  v_reply pratica_note;
begin
  if p_testo is null or btrim(p_testo) = '' then
    raise exception 'La risposta non può essere vuota';
  end if;

  select * into v_original
  from pratica_note
  where link_token = p_token
    and link_accessed_at is null
    and link_token_expires_at > now()
  limit 1;

  if v_original.id is null then
    raise exception 'Link non valido o scaduto';
  end if;

  select cliente_nome into v_cliente_nome
  from pratiche where id = v_original.pratica_id;

  insert into pratica_note (pratica_id, autore_nome, autore_ruolo, testo, visibile_cliente)
  values (v_original.pratica_id, coalesce(v_cliente_nome, 'Cliente'), 'cliente', p_testo, true)
  returning * into v_reply;

  update pratica_note
  set link_accessed_at = now()
  where id = v_original.id;

  return v_reply;
end;
$$;

grant execute on function respond_to_magic_link_note(text, text) to anon;
