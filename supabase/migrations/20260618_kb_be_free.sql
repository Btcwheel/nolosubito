-- ============================================================
-- Knowledge Base: Offerta Leasys Be Free (documento dedicato)
-- ============================================================

INSERT INTO knowledge_documents (id, title, content, source, created_by, is_active)
VALUES (
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Offerta Leasys Be Free — Noleggio Lungo Termine per Privati e Partite IVA',
  '## Cos''è Be Free

Be Free è una formula di noleggio a lungo termine di Leasys (gruppo Stellantis e Crédit Agricole) pensata per privati e partite IVA. Funziona come un "abbonamento auto": il cliente paga un canone mensile fisso e riceve un''auto nuova con tutti i servizi inclusi (assicurazione, manutenzione, bollo, soccorso stradale).

Il tratto distintivo di Be Free è la possibilità di restituire l''auto senza penale dopo il 12° mese fino al 24° mese — una flessibilità unica rispetto al noleggio tradizionale.

## Target

Be Free è nata principalmente per privati che vogliono un''alternativa all''acquisto o al finanziamento. È accessibile anche a partite IVA e professionisti. Per i privati il focus è sulla semplicità e sulla flessibilità (cambiare auto se cambiano le esigenze: figli, lavoro, trasferimento). Per i business il vantaggio è la trasformazione del costo auto in costo operativo (OPEX) con benefici fiscali.

## Durata e chilometraggio standard

La durata tipica di Be Free per privati è 48 mesi (4 anni) con 60.000 km totali (15.000 km/anno). Il chilometraggio è personalizzabile in fase di preventivo: aumentare o ridurre i km cambia il canone mensile. Se a fine contratto i km percorsi superano il limite, si paga un costo per km extra definito da contratto.

## Anticipo e canone

Molte offerte Be Free prevedono un anticipo iniziale (es. 3.000-4.000 € per segmento B/C) per ridurre il canone mensile. Sono possibili campagne con anticipo zero su modelli strategici. Il canone mensile copre veicolo + bundle servizi. La tassa automobilistica (bollo) viene fatturata separatamente ma gestita da Leasys.

## Servizi inclusi

Assicurativi: RCA con massimale 25 milioni di euro, Kasko/Collisione per danni da urto e uscita di strada, Furto e Incendio. Ogni copertura ha franchigie definite da contratto.

Manutenzione: ordinaria (tagliandi, filtri, liquidi) e straordinaria (guasti meccanici/elettronici non imputabili a dolo del cliente), eseguita presso rete convenzionata Leasys.

Assistenza: soccorso stradale h24 su tutto il territorio nazionale via numero verde o app My-Leasys. In caso di panne o sinistro: traino e, a seconda del contratto, vettura sostitutiva temporanea.

Digitali: app My-Leasys per consultare dati veicolo, scadenze, manutenzioni, aprire richieste assistenza. Servizio I-Care per monitoraggio telematico dello stato del veicolo.

## Servizi opzionali (a pagamento)

- Pneumatici e cambio gomme (fornitura, montaggio, equilibratura, stoccaggio stagionale)
- Vettura sostitutiva durante fermi per manutenzione o sinistri
- Garanzie accessorie (tipo "Be Safe") per perdita lavoro o invalidità
- Soluzioni di ricarica per elettriche/ibride plug-in (EasyWallbox)

## Flessibilità: restituzione senza penale

La caratteristica principale di Be Free: il cliente può restituire l''auto senza penale di recesso anticipato dopo il 12° mese fino al 24° mese circa (finestra variabile in base alla campagna). Oltre tale finestra si applicano le regole standard di recesso anticipato. La restituzione richiede un preavviso (tipicamente 30 giorni solari) e il rispetto delle condizioni contrattuali.

## Franchigie e gestione danni

Le coperture assicurative incluse NON azzerano il rischio economico: il cliente paga le franchigie previste da contratto in caso di sinistro (es. Kasko con franchigia 500-1000 €). A fine contratto possono essere addebitati: danni oltre la normale usura, chilometri eccedenti, accessori mancanti, multe non pagate. È fondamentale documentare lo stato del veicolo alla riconsegna.

## Vantaggi per il cliente privato

- Gestione unica: tutto incluso in un canone (assicurazione, manutenzione, assistenza)
- Canone fisso e prevedibilità di spesa
- Restituzione senza penale dopo 12 mesi se cambiano le esigenze
- Accesso a veicoli nuovi ogni pochi anni
- Nessun rischio di rivendita dell''usato
- App My-Leasys per gestione digitale

## Vantaggi per partite IVA e aziende

- Trasformazione CAPEX in OPEX: nessun capitale immobilizzato nell''acquisto
- Deducibilità fiscale e recupero IVA (nei limiti di legge)
- Prevedibilità del costo flotta
- Riduzione carico amministrativo (gestione sinistri, bolli, manutenzione in carico a Leasys)
- Flessibilità nel dimensionamento flotta (restituzione senza penale dopo 12 mesi)

## Rischi e attenzioni

- Franchigie su danni possono essere elevate
- Sottostimare i km annui genera extra costi a fine contratto
- Danni oltre la norma alla riconsegna possono essere addebitati
- Vincolo minimo di 12 mesi (prima non si può recedere senza penale)
- Il cliente non diventa mai proprietario del veicolo

## Domande da fare al cliente prima di firmare

- Che tipo di cliente è? (privato, P.IVA, azienda)
- Quanti km all''anno percorre?
- Che durata preferisce? (48 mesi standard)
- Ha già un modello in mente? (marchi Stellantis: Fiat, Jeep, Alfa Romeo, Lancia, Peugeot, Citroën, DS, Opel)
- Ha i requisiti per la delibera? (CUD per privati, bilancio per aziende)
- Vuole un anticipo per abbassare il canone?',
  'manual',
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

-- Chunk 1: Panoramica + target
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000001'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Be Free è una formula di noleggio a lungo termine di Leasys (gruppo Stellantis e Crédit Agricole) per privati e partite IVA. Funziona come "abbonamento auto": canone mensile fisso con servizi inclusi (assicurazione RCA Kasko FurtoIncendio, manutenzione ordinaria e straordinaria, bollo, soccorso stradale h24, app My-Leasys, servizio I-Care telematico). La caratteristica principale è la restituzione senza penale dopo il 12° mese entro una finestra che arriva circa al 24° mese. Per privati e partite IVA. Durata tipica 48 mesi. KM standard 60.000 totali (15.000/anno). Anticipo possibile da 0 a 4.000 € per ridurre il canone.',
   '{"index":0,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- Chunk 2: Flessibilità e restituzione anticipata
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000002'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Il tratto distintivo di Be Free è la restituzione anticipata senza penale. Il cliente può restituire l''auto senza costi di recesso dal 12° mese fino al 24° mese circa (finestra variabile in base alla campagna). Oltre tale finestra si applicano le regole standard di recesso anticipato con penale. La restituzione richiede un preavviso di 30 giorni solari e il rispetto delle condizioni contrattuali (assenza pendenze, km non eccessivamente oltre soglia). Prima del 12° mese il recesso anticipato è costoso come nel noleggio tradizionale.',
   '{"index":1,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- Chunk 3: Servizi inclusi e opzionali
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000003'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Servizi inclusi in Be Free: RCA con massimale 25 milioni, Kasko/Collisione per danni da urto con franchigia variabile, Furto e Incendio, manutenzione ordinaria (tagliandi, filtri, liquidi) e straordinaria (guasti meccanici e elettronici) presso rete convenzionata Leasys, soccorso stradale h24 nazionale, app My-Leasys per gestione scadenze e assistenza, servizio telematico I-Care. Servizi opzionali a pagamento: cambio pneumatici con stoccaggio stagionale, vettura sostitutiva durante fermi, garanzie accessorie tipo Be Safe per perdita lavoro o invalidità, soluzioni ricarica EasyWallbox per elettriche e ibride plug-in.',
   '{"index":2,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- Chunk 4: Aspetti economici e franchigie
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000004'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Il canone mensile Be Free copre veicolo e bundle servizi. Il bollo auto è gestito da Leasys ma fatturato separatamente come voce extracanone. Le coperture assicurative prevedono franchigie a carico del cliente: per Kasko solitamente 500-1000 €, per Furto una percentuale sul valore del veicolo. In caso di sinistro il cliente paga la franchigia, la parte eccedente è coperta dall''assicurazione Leasys. A fine contratto possono essere addebitati: danni oltre la normale usura, km eccedenti il limite contrattuale, accessori o dotazioni mancanti, multe e sanzioni non pagate. È importante documentare con foto lo stato del veicolo alla riconsegna.',
   '{"index":3,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- Chunk 5: Vantaggi per tipologia cliente
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000005'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Vantaggi Be Free per privati: tutto incluso in un canone fisso senza pensieri, possibilità di restituire l''auto senza penali dopo 12 mesi se cambiano esigenze (lavoro, famiglia, trasferimento), accesso a veicoli nuovi ogni 4 anni, nessun rischio di rivendita. Vantaggi per partite IVA e aziende: trasformazione costo auto da investimento (CAPEX) a costo operativo (OPEX) con miglioramento liquidità e bilancio, deducibilità fiscale del canone, recupero IVA nei limiti di legge, prevedibilità costo flotta, riduzione carico amministrativo interno, flessibilità nel dimensionare la flotta all''andamento del business.',
   '{"index":4,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- Chunk 6: Rischi e domande da fare
INSERT INTO knowledge_chunks (id, document_id, content, metadata)
VALUES (
  'c8c00000-0000-4000-8000-000006000006'::uuid,
  'd0c00000-0000-4000-8000-000000000006'::uuid,
  'Rischi e punti attenzione Be Free: franchigie su danni possono essere elevate, sottostimare i km annui per abbassare il canone genera extra costi a fine contratto (costo km extra definito da contratto), danni oltre la normale usura alla riconsegna possono essere addebitati, vincolo minimo 12 mesi (prima il recesso è costoso), il cliente non diventa mai proprietario del veicolo. Domande da fare al cliente prima di procedere: che tipo di cliente è (privato/P.IVA/azienda), quanti km all''anno percorre, durata preferita (48 mesi standard), modello desiderato (marchi Stellantis: Fiat Jeep Alfa Romeo Lancia Peugeot Citroën DS Opel), requisiti per delibera (CUD per privati, bilancio per aziende), eventuale anticipo per ridurre canone.',
   '{"index":5,"total":6}'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

SELECT 'KB Be Free: 1 documento, 6 chunk inseriti' as result;
