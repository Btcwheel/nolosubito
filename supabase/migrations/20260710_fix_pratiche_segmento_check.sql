-- Aggiunge i segmenti mancanti al check constraint di pratiche.segmento.
-- "ReUse" era assente → insert falliva per richieste da veicoli Re-Use (es. Full Hybrid usati).
-- "Veicoli Commerciali" aggiunto per coerenza con i valori inviati dal frontend.
alter table pratiche drop constraint if exists pratiche_segmento_check;
alter table pratiche
  add constraint pratiche_segmento_check
  check (segmento in ('P.IVA','Fleet','Privati','Moto','Green','ReUse','Veicoli Commerciali'));
