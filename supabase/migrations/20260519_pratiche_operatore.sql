ALTER TABLE pratiche
  ADD COLUMN IF NOT EXISTS operatore_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS operatore_nome text;
