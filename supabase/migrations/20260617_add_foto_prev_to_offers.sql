-- Aggiunge la colonna foto_prev alla tabella offers
-- Usata per la foto che appare nel PDF preventivo (800x450px PNG consigliato)
alter table offers add column if not exists foto_prev text;
