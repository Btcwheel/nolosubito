-- ============================================================
-- KB: FAQ Noleggio Lungo Termine
-- 20 domande frequenti con risposte
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'FAQ Noleggio Lungo Termine', '', 'manual')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cos''è il noleggio a lungo termine?
RISPOSTA: Il noleggio a lungo termine (NLT) è un contratto con cui un carrier ti fornisce un''auto in uso per un periodo stabilito (24-60 mesi) dietro pagamento di un canone mensile fisso. Il canone include RCA, Kasko, manutenzione ordinaria e straordinaria, soccorso stradale H24, bollo auto e auto sostitutiva in caso di sinistro. Il conducente paga solo il carburante e le franchigie in caso di sinistro.',
   '{"index": 0, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Quali sono i requisiti per noleggiare un''auto?
RISPOSTA: Per privati: CUD (Certificazione Unica Dipendenti) con reddito adeguato al canone. Per partite IVA e aziende: due bilanci approvati. In assenza di questi requisiti, è possibile richiedere un garante (persona fisica con CUD). La valutazione viene fatta dal carrier al momento della richiesta.',
   '{"index": 1, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Quali sono le durate minime e massime?
RISPOSTA: Le durate standard vanno da 24 a 60 mesi. Le durate più comuni sono 36 e 48 mesi. In alcuni casi particolari (es. offerte promozionali) possono esserci durate specifiche come 48 mesi per Be Free di Leasys.',
   '{"index": 2, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Quanti km posso fare all''anno?
RISPOSTA: I contratti standard partono da 10.000 km annui fino a 40.000 km annui. Puoi scegliere il chilometraggio più adatto alle tue esigenze in fase di preventivo. Il superamento del limite contrattuale comporta un costo aggiuntivo al momento della riconsegna (di solito 0,05-0,15 €/km extra a seconda del carrier e del modello).',
   '{"index": 3, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: È previsto un anticipo?
RISPOSTA: L''anticipo è facoltativo e può variare da 0 a 10.000 euro. Un anticipo più alto riduce il canone mensile. Puoi scegliere di non versare alcun anticipo (canone più alto) o versare un importo per abbassare la rata mensile.',
   '{"index": 4, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa succede se supero i km del contratto?
RISPOSTA: Alla riconsegna, il carrier calcola i km eccedenti rispetto al contratto. Il costo aggiuntivo varia in base al modello e al carrier (tipicamente tra 0,05 e 0,15 €/km extra). Puoi anche valutare un''estensione del contratto o un adeguamento del chilometraggio in corso d''opera.',
   '{"index": 5, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: È possibile recedere anticipatamente?
RISPOSTA: Sì, ma con costi di recesso anticipato. Le penali variano in base al carrier e al momento del recesso. Generalmente si paga il 50% dei canoni residui fino a un massimale. Alcuni carrier applicano costi fissi. Arval: penale del 50% dei canoni residui con cap. Leasys (Be Free): senza penale dal 12° al 24° mese, poi penale standard. Ayvens: penale del 50% dei canoni residui. UnipolRental: penale proporzionale ai canoni residui.',
   '{"index": 6, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa copre la Kasko inclusa?
RISPOSTA: La Kasko inclusa nel canone copre: collisione, incendio, furto, eventi naturali, atti vandalici, rottura cristalli. Le franchigie sono a carico del conducente in caso di sinistro con colpa. Le franchigie variano da 500 a 2.000 € a seconda del carrier e del modello scelto. La Kasko non copre: uso improprio del veicolo, guida in stato di ebbrezza, danni a carico del conducente.',
   '{"index": 7, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Come funziona la manutenzione?
RISPOSTA: La manutenzione ordinaria (tagliandi programmati) è inclusa e gestita dal carrier presso le officine convenzionate. Anche la manutenzione straordinaria (gomme, freni, ecc.) è inclusa. Devi solo prenotare l''appuntamento e presentarti. Il soccorso stradale H24 è incluso in tutti i contratti.',
   '{"index": 8, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Posso personalizzare gli allestimenti?
RISPOSTA: Di solito no. Le auto sono proposte con allestimenti e optional fissi definiti dal carrier per ogni offerta. In alcuni casi puoi scegliere tra diversi pacchetti di optional (cerchi, interni, colori). Le personalizzazioni estreme non sono previste nel NLT standard. Per esigenze particolari, contatta il tuo consulente.',
   '{"index": 9, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa succede in caso di sinistro?
RISPOSTA: In caso di sinistro, contatta il soccorso stradale H24 incluso nel contratto. Successivamente, apri la pratica con il carrier (o con Nolosubito che ti assiste nella gestione). La riparazione avviene presso un''officina convenzionata. Dovrai pagare la franchigia prevista dal contratto se il sinistro è con colpa. In alcuni casi, con la formula franchigia zero, non paghi nulla.',
   '{"index": 10, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cos''è la franchigia?
RISPOSTA: La franchigia è l''importo che resta a tuo carico in caso di sinistro con colpa. Per esempio, con franchigia di 1.000 €, se fai un danno da 3.000 €, paghi solo i primi 1.000 €. Le franchigie variano da 500 a 2.000 € a seconda del carrier e del modello. Alcuni carrier (es. UnipolRental) offrono pacchetti franchigia zero a canone maggiorato.',
   '{"index": 11, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa sono i costi di riconsegna?
RISPOSTA: Alla riconsegna dell''auto, il carrier valuta: chilometraggio eccedente (costo/km extra), usura anomala (danneggiamenti oltre il normale utilizzo), e stato generale del veicolo. I danni da normale utilizzo (piccoli graffi, usura interni) sono tollerati. Un rapporto di riconsegna viene redatto con eventuali addebiti.',
   '{"index": 12, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Come funziona per partite IVA e aziende?
RISPOSTA: Per partite IVA e aziende, il canone di noleggio è deducibile: 80% per partite IVA (se l''auto è strumentale), 100% per aziende con auto strumentale (es. auto di servizio). L''IVA sul canone è recuperabile al 40% per partite IVA, 100% per aziende se l''auto è strumentale. I requisiti richiesti sono 2 bilanci approvati.',
   '{"index": 13, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Posso cambiare auto durante il contratto?
RISPOSTA: Non direttamente. Il contratto è vincolato al veicolo scelto per tutta la durata. Per cambiare auto, devi recedere dal contratto (con relative penali) e stipularne uno nuovo. In alcuni casi, verso la fine del contratto, puoi concordare un''estensione o un passaggio a un nuovo veicolo con condizioni agevolate.',
   '{"index": 14, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa copre esattamente il canone mensile?
RISPOSTA: Il canone mensile include: noleggio del veicolo, RCA (responsabilità civile auto), Kasko (furto e incendio, collisione), manutenzione ordinaria e straordinaria, pneumatici (stagionali e sostituzione), soccorso stradale H24, bollo auto, auto sostitutiva in caso di sinistro o riparazione. Non include: carburante, franchigie in caso di sinistro, pedaggi autostradali, multe.',
   '{"index": 15, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Quali sono i vantaggi del NLT rispetto all''acquisto?
RISPOSTA: Vantaggi del NLT: canone mensile fisso e prevedibile, nessun imprevisto di manutenzione, nessun costo di acquisto iniziale elevato, auto sempre in garanzia, possibilità di cambiare auto ogni 2-4 anni, gestione burocratica zero (bollo, assicurazione, tagliandi), deducibilità fiscale per aziende, nessun problema di rivendita. Svantaggi: non diventi proprietario dell''auto, hai limiti di km, penali per recesso anticipato.',
   '{"index": 16, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Quanto tempo ci vuole per avere l''auto?
RISPOSTA: I tempi di consegna variano in base al modello e alla disponibilità. In media: 2-4 settimane per modelli con disponibilità immediata, 2-4 mesi per modelli da ordinare. Il consulente Nolosubito ti informa sui tempi specifici al momento del preventivo.',
   '{"index": 17, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Posso aggiungere un secondo conducente?
RISPOSTA: Sì, è possibile aggiungere un secondo conducente. Il costo aggiuntivo varia in base al carrier (tipicamente 20-50 €/mese in più sul canone). Il secondo conducente deve avere i requisiti di guida previsti dal contratto e di solito deve essere un familiare convivente o un dipendente dell''azienda.',
   '{"index": 18, "total": 20}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000002',
   'DOMANDA: Cosa succede se l''auto viene rubata?
RISPOSTA: In caso di furto, la Kasko inclusa copre il valore del veicolo. Dovrai denunciare il furto alle autorità e comunicarlo al carrier. La franchigia furto (di solito 10-15% del valore del veicolo) resta a tuo carico se prevista dal contratto. Alcuni carrier hanno franchigia furto separata dalla franchigia collisione. Una volta chiusa la pratica, il contratto si risolve senza ulteriori costi.',
   '{"index": 19, "total": 20}')
ON CONFLICT DO NOTHING;
