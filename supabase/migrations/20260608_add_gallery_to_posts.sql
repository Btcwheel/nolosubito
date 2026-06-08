-- Aggiunge colonna gallery_images alla tabella posts
-- Permette di inserire più foto oltre alla copertina negli articoli news

ALTER TABLE posts ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
