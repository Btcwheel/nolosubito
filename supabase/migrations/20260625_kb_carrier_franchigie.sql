-- ============================================================
-- KB: Carrier - Franchigie e Penali
-- Arval, Leasys, Ayvens, UnipolRental
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'Carrier: Franchigie e Penali', '', 'manual')
ON CONFLICT (id) DO NOTHING;

-- ARVAL
INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'ARVAL — FRANCHIGIE. Le franchigie Arval variano in base al modello e all''allestimento scelto. Tipicamente: collisione da 500 a 1.200 €, furto e incendio 10-15% del valore del veicolo. È possibile ridurre le franchigie con pacchetti aggiuntivi. Arval offre anche la formula "franchigia zero" a canone maggiorato. In caso di sinistro con colpa, la franchigia è a carico del conducente. La gestione sinistri avviene tramite la Centrale Operativa Arval.',
   '{"index": 0, "total": 8}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'ARVAL — PENALI RECESSO. In caso di recesso anticipato dal contratto, Arval applica una penale pari al 50% dei canoni residui, con un massimale variabile in base al modello e alla durata del contratto. Non sono previsti costi di recesso per i primi mesi salvo diversa indicazione contrattuale. Per recessi per giusta causa (es. perdita requisiti, mobilità internazionale), la penale può essere ridotta o annullata previa documentazione.',
   '{"index": 1, "total": 8}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'ARVAL — KM EXTRA E RIENTRO. Il costo km extra per Arval è di circa 0,08-0,15 €/km a seconda del modello. Alla riconsegna, viene valutata l''usura del veicolo secondo il manuale Arval (danni da normale utilizzo tollerati, danni anomali addebitati). Per il rientro anticipato volontario (dopo almeno 12 mesi), Arval può proporre un''offerta di acquisto del veicolo o un''estensione del contratto.',
   '{"index": 2, "total": 8}')
ON CONFLICT DO NOTHING;

-- LEASYS
INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'LEASYS — FRANCHIGIE. Leasys applica franchigie standard: collisione 600-1.500 €, furto e incendio 10-15% del valore del veicolo. Per le offerte Be Free: franchigia collisione 1.000 €, furto e incendio 1.500 €. Per Be Free Biz: franchigie personalizzabili in fase di preventivo. Leasys offre la possibilità di ridurre le franchigie con pacchetti aggiuntivi opzionali. In caso di sinistro, il conducente paga la franchigia solo se il sinistro è con colpa.',
   '{"index": 3, "total": 8}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'LEASYS — PENALI RECESSO. Per Leasys: recesso anticipato con penale del 50% dei canoni residui. Per l''offerta Be Free: nessuna penale di recesso dal 12° al 24° mese (recesso agevolato senza costi). Oltre il 24° mese, si applica la penale standard del 50% dei canoni residui. Per Be Free Biz: condizioni di recesso definite in fase contrattuale. Leasys valuta anche proposte di rientro anticipato con possibile subentro di un nuovo cliente.',
   '{"index": 4, "total": 8}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'LEASYS — KM EXTRA E RIENTRO. Il costo km extra Leasys varia da 0,06 a 0,12 €/km a seconda del modello e del contratto. Per le offerte Be Free il costo km extra è definito in fase di preventivo. Alla riconsegna, Leasys applica il manuale di usura per valutare eventuali danni. Il cliente può acquistare km aggiuntivi in corso di contratto (di solito più conveniente che pagare gli extra alla riconsegna).',
   '{"index": 5, "total": 8}')
ON CONFLICT DO NOTHING;

-- AYVENS
INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'AYVENS — FRANCHIGIE. Ayvens (ex Banque Popolare NLT) applica franchigie standard: collisione 700-1.200 €, furto e incendio 10% del valore del veicolo. Ayvens offre pacchetti di protezione optional: Protezione Piena (riduce la franchigia a 0 in caso di sinistro), Protezione Gomme (copre la sostituzione degli pneumatici), Protezione Furto (copre l''intero valore del veicolo in caso di furto senza franchigia aggiuntiva).',
   '{"index": 6, "total": 8}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'AYVENS — PENALI RECESSO E KM EXTRA. Ayvens applica una penale del 50% dei canoni residui per recesso anticipato. Il costo km extra è di circa 0,08-0,12 €/km. Ayvens è considerato tra i carrier più flessibili per la gestione dei sinistri e delle pratiche amministrative. Offre anche la possibilità di estendere il contratto oltre la scadenza a condizioni agevolate.',
   '{"index": 7, "total": 8}')
ON CONFLICT DO NOTHING;

-- UNIPOLRENTAL
INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000004',
   'UNIPOLRENTAL — FRANCHIGIE. UnipolRental offre pacchetti franchigia flessibili: Franchigia Base (collisione 1.000 €, furto 1.000 €), Franchigia Ridotta (collisione 500 €, furto 500 €), e Franchigia Zero (nessuna franchigia su collisione e furto, a canone maggiorato). UnipolRental si distingue per la trasparenza delle franchigie e la possibilità di scegliere il livello di copertura desiderato in fase di preventivo.',
   '{"index": 8, "total": 8}')
ON CONFLICT DO NOTHING;
