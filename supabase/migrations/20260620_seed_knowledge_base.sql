-- ============================================================
-- Seed Knowledge Base di Luca
-- Popolamento dati sui carrier, servizi Nolosubito e contratti
-- ============================================================

-- ── Documento 1: Guida ai Carrier NLT in Italia (Arval, Leasys, Ayvens, UnipolRental) ──
INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active) 
VALUES (
  'd0c00000-0000-4000-8000-000000000001'::uuid,
  'Guida ai Carrier NLT in Italia (Arval, Leasys, Ayvens, UnipolRental)',
  'I principali carrier (società di noleggio) operanti in Italia per il Noleggio a Lungo Termine (NLT) sono Arval, Leasys, Ayvens (nata dalla fusione di ALD Automotive e LeasePlan) e UnipolRental. Ciascun carrier ha regole specifiche, punti di forza e procedure di delibera finanziaria.

Arval (gruppo BNP Paribas) è leader di mercato per aziende e privati. Ha un processo di analisi creditizia molto strutturato. Le offerte includono sempre manutenzione ordinaria e straordinaria presso la rete di officine convenzionate Arval Premium Center, soccorso stradale h24, e coperture assicurative complete con franchigie personalizzabili (solitamente Kasko con franchigia a €500 o €1000, Furto/Incendio al 10% del valore del veicolo).

Leasys (gruppo Stellantis e Crédit Agricole) è il carrier di riferimento per i marchi Fiat, Jeep, Alfa Romeo, Lancia, Peugeot, Citroën, DS e Opel. Offre formule innovative come "Be Free" (che consente di restituire l''auto dopo 12 o 24 mesi senza alcuna penale di recesso anticipato) e formule "Miles" (noleggio pay-per-use in cui si paga una quota fissa mensile bassa più una tariffa al chilometro). Leasys ha tempi di delibera rapidi per i clienti privati e ditte individuali.

Ayvens (fusione di ALD Automotive e LeasePlan) rappresenta il più grande parco circolante in Italia ed è estremamente forte sul noleggio multi-brand. Offre pacchetti di servizi modulari ed è molto flessibile sui cambi contratto in corsa (ricalcolo dei chilometri o della durata durante il noleggio). Le franchigie assicurative standard di Ayvens prevedono Kasko a €500, RCA a €250 e Furto/Incendio al 10%.

UnipolRental è l''unico carrier a capitale interamente italiano, parte del Gruppo Unipol. Il suo punto di forza è l''integrazione assicurativa con la rete UnipolSai e l''utilizzo dei centri di riparazione convenzionati MyGlass e officine UnipolService. Offre canoni molto competitivi e un servizio clienti rapido per la gestione dei sinistri.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000001000001'::uuid,
  'd0c00000-0000-4000-8000-000000000001'::uuid,
  'I principali carrier (società di noleggio) operanti in Italia per il Noleggio a Lungo Termine (NLT) sono Arval, Leasys, Ayvens (nata dalla fusione di ALD Automotive e LeasePlan) e UnipolRental. Ciascun carrier ha regole specifiche, punti di forza e procedure di delibera finanziaria.

Arval (gruppo BNP Paribas) è leader di mercato per aziende e privati. Ha un processo di analisi creditizia molto strutturato. Le offerte includono sempre manutenzione ordinaria e straordinaria presso la rete di officine convenzionate Arval Premium Center, soccorso stradale h24, e coperture assicurative complete con franchigie personalizzabili (solitamente Kasko con franchigia a €500 o €1000, Furto/Incendio al 10% del valore del veicolo).',
  '{"index":0,"total":3}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000001000002'::uuid,
  'd0c00000-0000-4000-8000-000000000001'::uuid,
  'Leasys (gruppo Stellantis e Crédit Agricole) è il carrier di riferimento per i marchi Fiat, Jeep, Alfa Romeo, Lancia, Peugeot, Citroën, DS e Opel. Offre formule innovative come "Be Free" (che consente di restituire l''auto dopo 12 o 24 mesi senza alcuna penale di recesso anticipato) e formule "Miles" (noleggio pay-per-use in cui si paga una quota fissa mensile bassa più una tariffa al chilometro). Leasys ha tempi di delibera rapidi per i clienti privati e ditte individuali.',
  '{"index":1,"total":3}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000001000003'::uuid,
  'd0c00000-0000-4000-8000-000000000001'::uuid,
  'Ayvens (fusione di ALD Automotive e LeasePlan) rappresenta il più grande parco circolante in Italia ed è estremamente forte sul noleggio multi-brand. Offre pacchetti di servizi modulari ed è molto flessibile sui cambi contratto in corsa (ricalcolo dei chilometri o della durata durante il noleggio). Le franchigie assicurative standard di Ayvens prevedono Kasko a €500, RCA a €250 e Furto/Incendio al 10%.

UnipolRental è l''unico carrier a capitale interamente italiano, parte del Gruppo Unipol. Il suo punto di forza è l''integrazione assicurativa con la rete UnipolSai e l''utilizzo dei centri di riparazione convenzionati MyGlass e officine UnipolService. Offre canoni molto competitivi e un servizio clienti rapido per la gestione dei sinistri.',
  '{"index":2,"total":3}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;


-- ── Documento 2: Requisiti di Approvazione Finanziaria (Privati, P.IVA, Aziende, Garante) ──
INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active) 
VALUES (
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Requisiti di Approvazione Finanziaria (Privati, P.IVA, Aziende, Garante)',
  'Per poter sottoscrivere un contratto di Noleggio a Lungo Termine, il cliente (sia privato che azienda) deve superare un''analisi di affidabilità creditizia (chiamata "delibera" o "studio finanziario") effettuata dal carrier per verificare la capacità di pagamento dei canoni mensili.

Per i Privati, i documenti richiesti per la delibera sono: Documento d''identità valido, Codice fiscale o Tessera sanitaria, Ultimo CUD (Certificazione Unica) o Modello 730/Unico completo di ricevuta di presentazione, Ultime 3 buste paga, Coordinate bancarie (IBAN) per l''addebito diretto SDD. Canone mensile del noleggio non superiore al 30-35% del reddito netto mensile dimostrabile del nucleo familiare o del singolo richiedente. Il contratto di lavoro deve essere a tempo indeterminato e aver superato il periodo di prova.

Per le Partite IVA (Ditte Individuali e Liberi Professionisti), i documenti richiesti sono: Documento d''identità del titolare, Modello Unico dell''anno precedente con ricevuta di presentazione, Visura Camerale aggiornata (non più vecchia di 6 mesi, se iscritti alla CCIAA) o attribuzione Partita IVA, IBAN bancario. È richiesto che l''attività sia avviata da almeno 12-24 mesi per poter ottenere l''approvazione senza garanzie aggiuntive.

Per le Società di Persone (S.n.c., S.a.s.) e Società di Capitali (S.r.l., S.p.a.), i documenti richiesti sono: Ultimo bilancio depositato completo di nota integrativa e verbale di approvazione, Situazione contabile aggiornata dell''anno in corso (se sono passati più di 6 mesi dall''ultimo bilancio), Visura Camerale recente, Documento d''identità del legale rappresentante, IBAN per SDD. La società deve presentare indicatori finanziari positivi (patrimonio netto positivo, assenza di perdite rilevanti).

Qualora il richiedente non disponga dei requisiti minimi (ad esempio un privato con contratto di lavoro recente o part-time, o una ditta individuale neonata), è possibile inserire un Garante (Coobbligato). Il garante deve essere una persona fisica con reddito solido e dimostrabile (tramite busta paga a tempo indeterminato o pensione) che firma il contratto impegnandosi a pagare i canoni in caso di inadempienza del locatario principale. I documenti richiesti al garante sono gli stessi previsti per il cliente privato.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000002000001'::uuid,
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Per poter sottoscrivere un contratto di Noleggio a Lungo Termine, il cliente (sia privato che azienda) deve superare un''analisi di affidabilità creditizia (chiamata "delibera" o "studio finanziario") effettuata dal carrier per verificare la capacità di pagamento dei canoni mensili.',
  '{"index":0,"total":5}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000002000002'::uuid,
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Per i Privati, i documenti richiesti per la delibera sono: Documento d''identità valido, Codice fiscale o Tessera sanitaria, Ultimo CUD (Certificazione Unica) o Modello 730/Unico completo di ricevuta di presentazione, Ultime 3 buste paga, Coordinate bancarie (IBAN) per l''addebito diretto SDD. Canone mensile del noleggio non superiore al 30-35% del reddito netto mensile dimostrabile del nucleo familiare o del singolo richiedente. Il contratto di lavoro deve essere a tempo indeterminato e aver superato il periodo di prova.',
  '{"index":1,"total":5}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000002000003'::uuid,
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Per le Partite IVA (Ditte Individuali e Liberi Professionisti), i documenti richiesti sono: Documento d''identità del titolare, Modello Unico dell''anno precedente con ricevuta di presentazione, Visura Camerale aggiornata (non più vecchia di 6 mesi, se iscritti alla CCIAA) o attribuzione Partita IVA, IBAN bancario. È richiesto che l''attività sia avviata da almeno 12-24 mesi per poter ottenere l''approvazione senza garanzie aggiuntive.',
  '{"index":2,"total":5}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000002000004'::uuid,
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Per le Società di Persone (S.n.c., S.a.s.) e Società di Capitali (S.r.l., S.p.a.), i documenti richiesti sono: Ultimo bilancio depositato completo di nota integrativa e verbale di approvazione, Situazione contabile aggiornata dell''anno in corso (se sono passati più di 6 mesi dall''ultimo bilancio), Visura Camerale recente, Documento d''identità del legale rappresentante, IBAN per SDD. La società deve presentare indicatori finanziari positivi (patrimonio netto positivo, assenza di perdite rilevanti).',
  '{"index":3,"total":5}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000002000005'::uuid,
  'd0c00000-0000-4000-8000-000000000002'::uuid,
  'Qualora il richiedente non disponga dei requisiti minimi (ad esempio un privato con contratto di lavoro recente o part-time, o una ditta individuale neonata), è possibile inserire un Garante (Coobbligato). Il garante deve essere una persona fisica con reddito solido e dimostrabile (tramite busta paga a tempo indeterminato o pensione) che firma il contratto impegnandosi a pagare i canoni in caso di inadempienza del locatario principale. I documenti richiesti al garante sono gli stessi previsti per il cliente privato.',
  '{"index":4,"total":5}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;


-- ── Documento 3: I 19 Servizi Offerti da Nolosubito e Coperture Assicurative ──
INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active) 
VALUES (
  'd0c00000-0000-4000-8000-000000000003'::uuid,
  'I 19 Servizi Offerti da Nolosubito e Coperture Assicurative',
  'Nolosubito include un pacchetto completo di servizi all''interno del canone mensile di noleggio a lungo termine per garantire una formula "tutto incluso" senza pensieri per l''automobilista. I servizi principali gestiti e offerti sono 19, suddivisi per categorie.

I servizi Assicurativi includono:
1. RC Auto (RCA): Copertura della responsabilità civile verso terzi con massimali di legge elevati.
2. Copertura Danni (Kasko): Copertura per danni accidentali derivanti da collisioni, urti e uscite di strada, con franchigia variabile (generalmente €500 o €1000).
3. Furto e Incendio: Copertura in caso di perdita totale o parziale del veicolo dovuta a furto o incendio, con franchigia espressa in percentuale (es. 10%) o quota fissa.
4. Cristalli: Riparazione o sostituzione rapida dei vetri dell''auto presso centri specializzati (Carglass/Doctor Glass).
5. Infortuni Conducente (PAI): Polizza di tutela per infortuni subiti dal guidatore in caso di incidente con colpa.
6. Tutela Legale: Copertura delle spese legali in caso di controversie stradali o procedimenti penali legati alla circolazione del veicolo.
7. Eventi Atmosferici: Copertura per danni causati da grandine, tempeste, alluvioni o atti vandalici e sociopolitici.

I servizi di Manutenzione e Assistenza includono:
8. Manutenzione ordinaria e straordinaria: Tagliandi periodici, cambio pastiglie freni, rabbocchi, riparazione guasti meccanici o elettrici. Tutto è coperto, a patto di effettuare gli interventi presso officine convenzionate.
9. Cambio Pneumatici (Servizio On-Demand): Sostituzione dei pneumatici per usura o cambio stagionale estivo/invernale, comprensivo di equilibratura, convergenza e stoccaggio.
10. Soccorso Stradale: Assistenza stradale h24 su tutto il territorio nazionale ed europeo in caso di guasto, incidente o foratura, con traino del veicolo all''officina più vicina.
11. Auto Sostitutiva (Servizio On-Demand): Fornitura di un veicolo di cortesia per la durata del fermo tecnico dell''auto principale dovuto a riparazioni prolungate.

I servizi Amministrativi e di Logistica includono:
12. Consegna Veicolo: Consegna dell''auto immatricolata presso un hub di consegna o direttamente a domicilio.
13. Tassa di Proprietà (Bollo): Gestione del pagamento del bollo auto per tutta la durata del noleggio.
14. Gestione Multe: Rinotifica delle contravvenzioni al cliente e supporto amministrativo.
15. Gestione Sinistri: Gestione delle pratiche assicurative, denuncia di sinistro (modulo CID/CAI) e interfaccia con le compagnie.
16. Fatturazione Elettronica: Invio mensile della fattura elettronica del canone.
17. Immatricolazione: Gestione burocratica della messa su strada del veicolo nuovo.
18. Telematica: Installazione di una scatola nera (GPS) per localizzazione in caso di furto e diagnostica remota.
19. Servizio Clienti: Assistenza telefonica ed email dedicata per prenotazione tagliandi e informazioni sul contratto.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000003000001'::uuid,
  'd0c00000-0000-4000-8000-000000000003'::uuid,
  'Nolosubito include un pacchetto completo di servizi all''interno del canone mensile di noleggio a lungo termine per garantire una formula "tutto incluso" senza pensieri per l''automobilista. I servizi principali gestiti e offerti sono 19, suddivisi per categorie.',
  '{"index":0,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000003000002'::uuid,
  'd0c00000-0000-4000-8000-000000000003'::uuid,
  'I servizi Assicurativi includono:
1. RC Auto (RCA): Copertura della responsabilità civile verso terzi con massimali di legge elevati.
2. Copertura Danni (Kasko): Copertura per danni accidentali derivanti da collisioni, urti e uscite di strada, con franchigia variabile (generalmente €500 o €1000).
3. Furto e Incendio: Copertura in caso di perdita totale o parziale del veicolo dovuta a furto o incendio, con franchigia espressa in percentuale (es. 10%) o quota fissa.
4. Cristalli: Riparazione o sostituzione rapida dei vetri dell''auto presso centri specializzati (Carglass/Doctor Glass).
5. Infortuni Conducente (PAI): Polizza di tutela per infortuni subiti dal guidatore in caso di incidente con colpa.
6. Tutela Legale: Copertura delle spese legali in caso di controversie stradali o procedimenti penali legati alla circolazione del veicolo.
7. Eventi Atmosferici: Copertura per danni causati da grandine, tempeste, alluvioni o atti vandalici e sociopolitici.',
  '{"index":1,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000003000003'::uuid,
  'd0c00000-0000-4000-8000-000000000003'::uuid,
  'I servizi di Manutenzione e Assistenza includono:
8. Manutenzione ordinaria e straordinaria: Tagliandi periodici, cambio pastiglie freni, rabbocchi, riparazione guasti meccanici o elettrici. Tutto è coperto, a patto di effettuare gli interventi presso officine convenzionate.
9. Cambio Pneumatici (Servizio On-Demand): Sostituzione dei pneumatici per usura o cambio stagionale estivo/invernale, comprensivo di equilibratura, convergenza e stoccaggio.
10. Soccorso Stradale: Assistenza stradale h24 su tutto il territorio nazionale ed europeo in caso di guasto, incidente o foratura, con traino del veicolo all''officina più vicina.
11. Auto Sostitutiva (Servizio On-Demand): Fornitura di un veicolo di cortesia per la durata del fermo tecnico dell''auto principale dovuto a riparazioni prolungate.',
  '{"index":2,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000003000004'::uuid,
  'd0c00000-0000-4000-8000-000000000003'::uuid,
  'I servizi Amministrativi e di Logistica includono:
12. Consegna Veicolo: Consegna dell''auto immatricolata presso un hub di consegna o direttamente a domicilio.
13. Tassa di Proprietà (Bollo): Gestione del pagamento del bollo auto per tutta la durata del noleggio.
14. Gestione Multe: Rinotifica delle contravvenzioni al cliente e supporto amministrativo.
15. Gestione Sinistri: Gestione delle pratiche assicurative, denuncia di sinistro (modulo CID/CAI) e interfaccia con le compagnie.
16. Fatturazione Elettronica: Invio mensile della fattura elettronica del canone.
17. Immatricolazione: Gestione burocratica della messa su strada del veicolo nuovo.
18. Telematica: Installazione di una scatola nera (GPS) per localizzazione in caso di furto e diagnostica remota.
19. Servizio Clienti: Assistenza telefonica ed email dedicata per prenotazione tagliandi e informazioni sul contratto.',
  '{"index":3,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;


-- ── Documento 4: Funzionamento del Contratto NLT (Durata, KM, Anticipo, Penali e Recesso) ──
INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active) 
VALUES (
  'd0c00000-0000-4000-8000-000000000004'::uuid,
  'Funzionamento del Contratto NLT (Durata, KM, Anticipo, Penali e Recesso)',
  'Il contratto di Noleggio a Lungo Termine si basa su parametri definiti al momento della firma che determinano il canone mensile: la durata del noleggio, il chilometraggio totale consentito, e la presenza di un eventuale anticipo finanziario.

La durata standard del noleggio varia da un minimo di 24 mesi a un massimo di 60 mesi (2, 3, 4 o 5 anni). La scelta più comune è 36 o 48 mesi, poiché rappresenta il miglior compromesso tra canone mensile e obsolescenza tecnologica dell''auto. Il chilometraggio totale viene calcolato per l''intera durata del contratto (es. 15.000 km all''anno per 4 anni corrisponde a 60.000 km totali). Nel caso in cui alla restituzione del veicolo i chilometri percorsi siano superiori al limite pattuito, il cliente dovrà pagare una penale per i chilometri in eccedenza (eccedenza chilometrica), che varia da €0.06 a €0.15 per ogni km in più a seconda del veicolo e del carrier. Se invece i chilometri percorsi sono inferiori, alcuni contratti prevedono un rimborso parziale (chilometri a credito), ma con valori molto bassi (es. €0.02 per km).

L''anticipo è una somma versata al momento della stipula del contratto che serve a ridurre l''importo del canone mensile. L''anticipo non è un deposito cauzionale e non viene restituito alla fine del noleggio. Molte offerte Nolosubito sono strutturate ad "Anticipo Zero", consentendo l''accesso al noleggio senza sborsare capitale iniziale, previa approvazione creditizia più rigorosa da parte del carrier.

Il recesso anticipato dal contratto è sempre possibile, ma comporta l''addebito di una penale calcolata in base ai mesi rimanenti alla scadenza. La penale standard applicata dalla maggior parte dei carrier (come Arval o Ayvens) è pari al 30-35% dei canoni mensili residui che il cliente avrebbe dovuto pagare fino alla fine naturale del contratto. Esistono formule particolari come "Be Free" di Leasys che azzerano questa penale dopo il 12° o 24° mese di noleggio, ottimali per chi non è sicuro delle proprie esigenze future.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000004000001'::uuid,
  'd0c00000-0000-4000-8000-000000000004'::uuid,
  'Il contratto di Noleggio a Lungo Termine si basa su parametri definiti al momento della firma che determinano il canone mensile: la durata del noleggio, il chilometraggio totale consentito, e la presenza di un eventuale anticipo finanziario.',
  '{"index":0,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000004000002'::uuid,
  'd0c00000-0000-4000-8000-000000000004'::uuid,
  'La durata standard del noleggio varia da un minimo di 24 mesi a un massimo di 60 mesi (2, 3, 4 o 5 anni). La scelta più comune è 36 o 48 mesi, poiché rappresenta il miglior compromesso tra canone mensile e obsolescenza tecnologica dell''auto. Il chilometraggio totale viene calcolato per l''intera durata del contratto (es. 15.000 km all''anno per 4 anni corrisponde a 60.000 km totali). Nel caso in cui alla restituzione del veicolo i chilometri percorsi siano superiori al limite pattuito, il cliente dovrà pagare una penale per i chilometri in eccedenza (eccedenza chilometrica), che varia da €0.06 a €0.15 per ogni km in più a seconda del veicolo e del carrier. Se invece i chilometri percorsi sono inferiori, alcuni contratti prevedono un rimborso parziale (chilometri a credito), ma con valori molto bassi (es. €0.02 per km).',
  '{"index":1,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000004000003'::uuid,
  'd0c00000-0000-4000-8000-000000000004'::uuid,
  'L''anticipo è una somma versata al momento della stipula del contratto che serve a ridurre l''importo del canone mensile. L''anticipo non è un deposito cauzionale e non viene restituito alla fine del noleggio. Molte offerte Nolosubito sono strutturate ad "Anticipo Zero", consentendo l''accesso al noleggio senza sborsare capitale iniziale, previa approvazione creditizia più rigorosa da parte del carrier.',
  '{"index":2,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000004000004'::uuid,
  'd0c00000-0000-4000-8000-000000000004'::uuid,
  'Il recesso anticipato dal contratto è sempre possibile, ma comporta l''addebito di una penale calcolata in base ai mesi rimanenti alla scadenza. La penale standard applicata dalla maggior parte dei carrier (come Arval o Ayvens) è pari al 30-35% dei canoni mensili residui che il cliente avrebbe dovuto pagare fino alla fine naturale del contratto. Esistono formule particolari come "Be Free" di Leasys che azzerano questa penale dopo il 12° o 24° mese di noleggio, ottimali per chi non è sicuro delle proprie esigenze future.',
  '{"index":3,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;


-- ── Documento 5: Vantaggi Fiscali del Noleggio a Lungo Termine per P.IVA e Aziende ──
INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active) 
VALUES (
  'd0c00000-0000-4000-8000-000000000005'::uuid,
  'Vantaggi Fiscali del Noleggio a Lungo Termine per P.IVA e Aziende',
  'Il Noleggio a Lungo Termine offre importanti vantaggi fiscali ed economici per le aziende, i liberi professionisti e i lavoratori autonomi con Partita IVA in Italia, consentendo di dedurre i costi e detrarre l''IVA in base all''effettivo utilizzo del veicolo.

Per i Liberi Professionisti ed Esercenti Arti e Professioni (Partite IVA individuali):
- Deducibilità delle imposte dirette (IRPEF): È possibile dedurre il 20% del canone di noleggio. Esistono limiti massimi di spesa annua su cui calcolare la deduzione, che sono pari a €3.615,20 per il canone puro di locazione, mentre non ci sono limiti per la quota di servizi (manutenzione, assicurazione, ecc.).
- Detraibilità dell''IVA: L''IVA è detraibile al 40% se il veicolo non è utilizzato esclusivamente per l''attività professionale (uso promiscuo), mentre sale al 100% se si dimostra l''uso esclusivamente strumentale all''attività.

Per le Aziende (Società di capitali e di persone) con veicoli ad uso promiscuo concessi ai dipendenti come fringe benefit:
- Deducibilità delle imposte dirette (IRES/IRAP): L''azienda può dedurre il 70% dei costi totali di noleggio (sia quota locazione che quota servizi), senza limiti massimi di spesa annua. Questa formula è estremamente conveniente e ampiamente utilizzata per le flotte aziendali.
- Detraibilità dell''IVA: L''IVA è detraibile al 40% (o al 100% se l''addebito del fringe benefit al dipendente avviene con emissione di fattura soggetta ad IVA per un importo non inferiore al valore del benefit stesso).

Per gli Agenti di Commercio e Rappresentanti:
- Deducibilità delle imposte dirette: La percentuale di deduzione sale all''80% delle spese di noleggio, con un limite massimo per la quota locazione innalzato a €5.164,57 all''anno.
- Detraibilità dell''IVA: L''IVA è detraibile al 100%, trattandosi di uno strumento di lavoro indispensabile e primario per lo svolgimento dell''attività lavorativa.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000005000001'::uuid,
  'd0c00000-0000-4000-8000-000000000005'::uuid,
  'Il Noleggio a Lungo Termine offre importanti vantaggi fiscali ed economici per le aziende, i liberi professionisti e i lavoratori autonomi con Partita IVA in Italia, consentendo di dedurre i costi e detrarre l''IVA in base all''effettivo utilizzo del veicolo.',
  '{"index":0,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000005000002'::uuid,
  'd0c00000-0000-4000-8000-000000000005'::uuid,
  'Per i Liberi Professionisti ed Esercenti Arti e Professioni (Partite IVA individuali):
- Deducibilità delle imposte dirette (IRPEF): È possibile dedurre il 20% del canone di noleggio. Esistono limiti massimi di spesa annua su cui calcolare la deduzione, che sono pari a €3.615,20 per il canone puro di locazione, mentre non ci sono limiti per la quota di servizi (manutenzione, assicurazione, ecc.).
- Detraibilità dell''IVA: L''IVA è detraibile al 40% se il veicolo non è utilizzato esclusivamente per l''attività professionale (uso promiscuo), mentre sale al 100% se si dimostra l''uso esclusivamente strumentale all''attività.',
  '{"index":1,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000005000003'::uuid,
  'd0c00000-0000-4000-8000-000000000005'::uuid,
  'Per le Aziende (Società di capitali e di persone) con veicoli ad uso promiscuo concessi ai dipendenti come fringe benefit:
- Deducibilità delle imposte dirette (IRES/IRAP): L''azienda può dedurre il 70% dei costi totali di noleggio (sia quota locazione che quota servizi), senza limiti massimi di spesa annua. Questa formula è estremamente conveniente e ampiamente utilizzata per le flotte aziendali.
- Detraibilità dell''IVA: L''IVA è detraibile al 40% (o al 100% se l''addebito del fringe benefit al dipendente avviene con emissione di fattura soggetta ad IVA per un importo non inferiore al valore del benefit stesso).',
  '{"index":2,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

INSERT INTO knowledge_chunks (id, document_id, content, metadata) 
VALUES (
  'c8c00000-0000-4000-8000-000005000004'::uuid,
  'd0c00000-0000-4000-8000-000000000005'::uuid,
  'Per gli Agenti di Commercio e Rappresentanti:
- Deducibilità delle imposte dirette: La percentuale di deduzione sale all''80% delle spese di noleggio, con un limite massimo per la quota locazione innalzato a €5.164,57 all''anno.
- Detraibilità dell''IVA: L''IVA è detraibile al 100%, trattandosi di uno strumento di lavoro indispensabile e primario per lo svolgimento dell''attività lavorativa.',
  '{"index":3,"total":4}'::jsonb
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;


SELECT count(*) as total_documents FROM knowledge_documents;
SELECT count(*) as total_chunks FROM knowledge_chunks;
