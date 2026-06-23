-- ============================================================
-- KB: Chi è Nolosubito
-- Identità aziendale, mission, valori, storia, sede
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Chi è Nolosubito', '', 'manual')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Nolosubito è un broker di noleggio a lungo termine (NLT) italiano, fondato per rendere accessibile a privati e aziende il noleggio auto senza i costi e gli imprevisti della proprietà. La nostra sede operativa è in Italia e operiamo su tutto il territorio nazionale.',
   '{"index": 0, "total": 4}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'La nostra missione è semplificare la mobilità: offriamo consulenza trasparente e personalizzata per trovare la soluzione di noleggio più adatta a ogni esigenza. Lavoriamo con i principali carrier italiani (Arval, Leasys, Ayvens, UnipolRental) per garantire le migliori condizioni di mercato.',
   '{"index": 1, "total": 4}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Ci distinguiamo per la consulenza one-to-one: ogni cliente viene seguito da un consulente dedicato dalla scelta del veicolo fino alla riconsegna. Offriamo supporto nella gestione di sinistri, franchigie, e pratiche amministrative, facendo da ponte tra cliente e carrier.',
   '{"index": 2, "total": 4}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'I nostri valori: trasparenza (nessun costo nascosto, franchigie chiare fin dall''inizio), competenza (conoscenza approfondita del mercato NLT e dei contratti carrier), e vicinanza al cliente (supporto continuativo per tutta la durata del contratto). Siamo un interlocutore unico tra il cliente e il carrier.',
   '{"index": 3, "total": 4}')
ON CONFLICT DO NOTHING;
