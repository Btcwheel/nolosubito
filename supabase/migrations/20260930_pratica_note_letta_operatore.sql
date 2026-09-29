-- Traccia se una nota è stata vista dallo staff, per mostrare un badge
-- "risposta cliente non letta" in backoffice senza dover aprire ogni pratica.
-- Le note scritte dallo staff sono marcate lette subito (le ha scritte lui);
-- le risposte del cliente via magic link restano null finché non si apre la pratica.
alter table pratica_note
  add column if not exists letta_operatore_at timestamptz;

-- Le note già esistenti non sono "nuove risposte da leggere"
update pratica_note
  set letta_operatore_at = created_at
  where letta_operatore_at is null;
