-- Aggiunge lo stato "Sblocco anagrafica" al menu "Cambia stato" del backoffice.
alter table pratiche drop constraint if exists pratiche_status_check;
alter table pratiche add constraint pratiche_status_check
  check (status in (
    'Nuova','In Lavorazione','Documenti Richiesti','Documenti Caricati',
    'Attesa Affidamento Finanziaria','Affidamento Ricevuto',
    'Stipula Contratto','Attesa Consegna','Approvata','Consegnata','Chiusa',
    'Crif negativa','bocciato','Sblocco anagrafica'
  ));
