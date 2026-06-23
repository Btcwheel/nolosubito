-- ============================================================
-- KB: Optional e Accessori
-- Cosa si può aggiungere, costi, compatibilità
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'Optional e Accessori', '', 'manual')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000005',
   'Negli annunci di Nolosubito, gli optional e gli allestimenti sono già fissati dal carrier per ogni offerta. Non è possibile personalizzare gli optional al di fuori di quelli previsti per il singolo annuncio. Gli allestimenti sono scelti dal carrier per ottimizzare il rapporto qualità-prezzo e garantire le migliori condizioni di canone.',
   '{"index": 0, "total": 5}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000005',
   'Per ogni veicolo, la scheda dettaglio mostra gli optional inclusi di serie nell''allestimento proposto. Esempi comuni di optional includono: climatizzatore automatico, sensori di parcheggio, navigatore GPS, Apple CarPlay/Android Auto, cerchi in lega, sedili riscaldati, e sistemi di assistenza alla guida (ADAS). Il cliente deve verificare la lista degli optional sull''annuncio specifico.',
   '{"index": 1, "total": 5}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000005',
   'Opzioni accessorie contrattuali (non legate all''auto ma al contratto): secondo conducente (20-50 €/mese extra a seconda del carrier), chilometraggio aggiuntivo (acquistabile in corso di contratto, più conveniente che pagare gli extra alla riconsegna), estensione contratto (possibile verso la scadenza a condizioni agevolate). Queste opzioni variano per costi e disponibilità in base al carrier.',
   '{"index": 2, "total": 5}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000005',
   'Per esigenze specifiche non coperte dall''annuncio (es. colore particolare, interni in pelle, tetto apribile, gancio traino), è possibile verificare con il consulente Nolosubito se esistono offerte alternative con gli optional desiderati. In alcuni casi, il carrier può proporre un veicolo diverso con allestimento superiore o diverso. Le personalizzazioni non previste dal carrier non sono realizzabili nel NLT standard.',
   '{"index": 3, "total": 5}')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_chunks (document_id, content, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000005',
   'Optional e accessori hanno un impatto diretto sul canone mensile. Allestimenti superiori e pacchetti optional più ricchi aumentano il canone ma mantengono meglio il valore residuo dell''auto. Per scegliere la combinazione migliore tra optional desiderati e canone sostenibile, il consulente Nolosubito può consigliare le opzioni più adatte alle esigenze del cliente.',
   '{"index": 4, "total": 5}')
ON CONFLICT DO NOTHING;
