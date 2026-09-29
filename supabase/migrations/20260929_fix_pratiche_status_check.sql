-- Il commit 4b131c3 ha aggiunto gli stati 'Crif negativa' e 'bocciato' nel
-- frontend e in schema.sql, ma non ha mai applicato una migration reale:
-- il vincolo pratiche_status_check in produzione non li accettava ancora,
-- causando un fallimento silenzioso (23514) al primo salvataggio di questi stati.
alter table pratiche drop constraint if exists pratiche_status_check;
alter table pratiche add constraint pratiche_status_check
  check (status in (
    'Nuova','In Lavorazione','Documenti Richiesti','Documenti Caricati',
    'Attesa Affidamento Finanziaria','Affidamento Ricevuto',
    'Stipula Contratto','Attesa Consegna','Approvata','Consegnata','Chiusa',
    'Crif negativa','bocciato'
  ));
