-- ============================================================
-- KB: Processo di Noleggio
-- Step-by-step dalla richiesta alla consegna
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Processo di Noleggio', '', 'manual')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 1: RICHIESTA E CONSULENZA. Il cliente contatta Nolosubito via chat, telefono o form. Un consulente raccoglie le esigenze: tipo di auto desiderata, budget mensile, durata, km annui, tipo cliente (privato, P.IVA, azienda), e requisiti (CUD o bilanci). Sulla base di queste info, il consulente propone le migliori opzioni disponibili.',
   '{"index": 0, "total": 6}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 2: PREVENTIVO. Il consulente prepara un preventivo personalizzato con: modello auto, canone mensile (con/senza anticipo), durata, km annui, franchigie, servizi inclusi, e eventuali promozioni attive. Il preventivo viene inviato al cliente via email e può essere rivisto insieme fino a che il cliente non è soddisfatto.',
   '{"index": 1, "total": 6}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 3: APPROVAZIONE E DOCUMENTI. Il cliente accetta il preventivo e fornisce i documenti richiesti: documento d''identità, codice fiscale, CUD (privati) o ultimi 2 bilanci (P.IVA/aziende), eventuale garante se necessario. Il consulente verifica la completezza e invia la pratica al carrier per la valutazione creditizia.',
   '{"index": 2, "total": 6}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 4: VALUTAZIONE CARRIER. Il carrier riceve la pratica e valuta la solvibilità del cliente. I tempi di risposta variano da 24 ore a 5 giorni lavorativi. In caso di esito positivo, il carrier emette il contratto definitivo. In caso di esito negativo, il consulente Nolosubito propone alternative (garante, anticipo più alto, veicolo diverso, carrier alternativo).',
   '{"index": 3, "total": 6}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 5: FIRMA E ATTIVAZIONE. Il cliente riceve il contratto da firmare digitalmente. Dopo la firma, si procede al pagamento della prima rata (o dell''anticipo se previsto). Il carrier attiva la polizza assicurativa e il cliente riceve conferma via email con la data di consegna stimata.',
   '{"index": 4, "total": 6}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'FASE 6: CONSEGNA. Il veicolo viene consegnato presso la concessionaria indicata dal carrier o, in alcuni casi, presso la sede del cliente. Alla consegna, il cliente verifica lo stato del veicolo e firma il verbale di consegna. Da quel momento, il contratto decorre e il cliente può utilizzare l''auto regolarmente. In caso di sinistri o problemi, il cliente contatta Nolosubito per assistenza nella gestione della pratica con il carrier.',
   '{"index": 5, "total": 6}')
ON CONFLICT DO NOTHING;
