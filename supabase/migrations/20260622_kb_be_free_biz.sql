-- ============================================================
-- Knowledge Base: Leasys Be Free Biz (veicoli usati)
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active)
VALUES (
  'd0c00000-0000-4000-8000-000000000007'::uuid,
  'Offerta Leasys Be Free Biz — Noleggio Veicoli Usati',
  'Be Free Biz è una formula di noleggio a lungo termine di Leasys dedicata esclusivamente ai veicoli usati.

Durata fissa di 12 o 24 mesi con chilometraggio di 20.000 km annui.

Servizi inclusi:
- Assicurazione RCA con franchigia di €450
- Copertura Furto/Incendio e Kasko con franchigia di €2.000
- Manutenzione ordinaria e straordinaria

La formula prevede il pagamento di un canone anticipato e non consente modifiche alla durata contrattuale, al chilometraggio previsto o alle franchigie assicurative.

I veicoli disponibili sono selezionati da un catalogo dedicato e a disponibilità limitata, composto da vetture immatricolate negli anni 2023, 2024 e 2025.',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000007000001'::uuid,
  'd0c00000-0000-4000-8000-000000000007'::uuid,
  'Be Free Biz è una formula di noleggio a lungo termine di Leasys dedicata esclusivamente ai veicoli usati. Durata fissa di 12 o 24 mesi con chilometraggio di 20.000 km annui. Include assicurazione RCA con franchigia di €450, coperture Furto Incendio e Kasko con franchigia di €2.000, manutenzione ordinaria e straordinaria. Prevede pagamento di un canone anticipato. Non consente modifiche a durata, chilometraggio o franchigie. Veicoli da catalogo dedicato a disponibilità limitata, immatricolazioni 2023-2024-2025.',
  '{"index":0,"total":1}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

SELECT 'KB Be Free Biz: 1 documento, 1 chunk inserito' as result;
