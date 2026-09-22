-- Aggiungi supporto per magic link nelle note
-- Permette agli utenti di rispondere via link pubblico senza login

-- Aggiungi colonne a pratica_note per tracciare il magic link
ALTER TABLE pratica_note ADD COLUMN link_token TEXT UNIQUE;
ALTER TABLE pratica_note ADD COLUMN link_token_expires_at TIMESTAMPTZ;
ALTER TABLE pratica_note ADD COLUMN link_accessed_at TIMESTAMPTZ;

-- Index per cercare velocemente i token
CREATE INDEX idx_pratica_note_link_token ON pratica_note(link_token) WHERE link_token IS NOT NULL;
