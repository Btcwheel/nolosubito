-- ============================================================
-- NoloSubito — Dati di esempio (seed)
-- Esegui nel SQL Editor di Supabase dopo lo schema
-- ============================================================

-- ── OFFERS (catalogo veicoli) ────────────────────────────────

INSERT INTO offers (make, model, category, fuel_type, transmission, power_hp, co2_emissions, description, features, is_active) VALUES
('BMW',        '5 Series',     'Business Sedan',  'Diesel',   'Automatic', 190, 118, 'La berlina executive per eccellenza. Design raffinato, tecnologia all-in e comfort ai vertici della categoria.',      ARRAY['Navigatore', 'Sedili riscaldati', 'Tetto panoramico', 'Assistente parcheggio'], true),
('Mercedes',   'Classe C',     'Business Sedan',  'Hybrid',   'Automatic', 204, 32,  'La berlina ibrida plug-in più venduta al mondo. Zero emissioni in città, comfort premium in autostrada.',            ARRAY['MBUX', 'Ambient light', 'Guida semi-autonoma', 'Ricarica wireless'], true),
('Audi',       'A6',           'Business Sedan',  'Diesel',   'Automatic', 204, 122, 'Tecnologia quattro e abitacolo digitale per il manager che non scende a compromessi.',                                  ARRAY['Virtual cockpit', 'Matrix LED', 'quattro', 'Head-up display'], true),
('Tesla',      'Model 3',      'Electric Exec',   'Electric', 'Automatic', 283, 0,   'La berlina elettrica più premiata al mondo. Autonomia reale 500km, Autopilot incluso, zero costi carburante.',         ARRAY['Autopilot', 'Supercharging', 'OTA updates', 'App control'], true),
('Tesla',      'Model Y',      'Electric SUV',    'Electric', 'Automatic', 299, 0,   'Il SUV elettrico più venduto in Europa. Spazio per 7, autonomia 500km, tecnologia senza rivali.',                     ARRAY['Autopilot', '7 posti', 'Tetto in vetro', 'Supercharging'], true),
('BMW',        'X5',           'Business SUV',    'Diesel',   'Automatic', 286, 149, 'Il SUV premium per chi non vuole rinunciare a niente. Potenza, spazio e tecnologia di alto livello.',                  ARRAY['xDrive', 'Sedili massaggianti', 'HUD', 'Harman Kardon'], true),
('Mercedes',   'GLC',          'Business SUV',    'Hybrid',   'Automatic', 313, 28,  'SUV ibrido plug-in con autonomia elettrica fino a 100km. Perfetto per chi percorre molto il centro città.',            ARRAY['PHEV 100km EV', 'MBUX', '4MATIC', 'Ambient light'], true),
('Volkswagen', 'Transporter',  'Commercial Van',  'Diesel',   'Manual',    150, 165, 'Il furgone commerciale più affidabile sul mercato. Carico 1.000kg, allestimento modulare, manutenzione facile.',      ARRAY['Cassone modulare', 'Bluetooth', 'Cruise control', 'ABS'], true),
('Peugeot',    'e-Expert',     'Commercial Van',  'Electric', 'Automatic', 136, 0,   'Il furgone elettrico per le consegne urbane. Zero emissioni, autonomia 230km, costo/km imbattibile.',                 ARRAY['100% elettrico', 'Carico 1.000kg', 'Ricarica rapida 100kW', 'App fleet'], true),
('Porsche',    'Panamera',     'Premium Sedan',   'Hybrid',   'Automatic', 462, 48,  'La gran berlina sportiva ibrida. Prestazioni da supercar, consumi da berlina premium.',                                ARRAY['PHEV 50km EV', 'Sport Chrono', 'Bose 3D', 'Matrix LED'], true),
('Volvo',      'XC90',         'Business SUV',    'Hybrid',   'Automatic', 455, 27,  'Il SUV premium svedese più sicuro al mondo. 7 posti, ibrido plug-in, interni in legno naturale.',                     ARRAY['7 posti', 'PHEV 80km EV', 'Bowers & Wilkins', 'Pilot Assist'], true),
('Audi',       'Q4 e-tron',    'Electric SUV',    'Electric', 'Automatic', 204, 0,   'Il SUV compatto elettrico Audi. Design coupé, abitacolo hi-tech, autonomia reale 400km.',                             ARRAY['Matrix LED', 'Augmented HUD', 'quattro', 'Ricarica 125kW'], true);


-- ── OFFER CONFIGS (prezzi) ───────────────────────────────────

INSERT INTO offer_configs (make, model, segment, duration_months, annual_km, advance_payment, monthly_rent, is_active) VALUES

-- BMW 5 Series
('BMW', '5 Series', 'P.IVA',   24, 20000, 5000,  890,  true),
('BMW', '5 Series', 'P.IVA',   36, 20000, 3000,  820,  true),
('BMW', '5 Series', 'P.IVA',   48, 20000, 2000,  780,  true),
('BMW', '5 Series', 'Fleet',   36, 30000, 5000,  850,  true),
('BMW', '5 Series', 'Fleet',   48, 30000, 3000,  810,  true),
('BMW', '5 Series', 'Privati', 36, 15000, 4000,  940,  true),
('BMW', '5 Series', 'Privati', 48, 15000, 2000,  880,  true),

-- Mercedes Classe C
('Mercedes', 'Classe C', 'P.IVA',   24, 20000, 4000,  720,  true),
('Mercedes', 'Classe C', 'P.IVA',   36, 20000, 2500,  670,  true),
('Mercedes', 'Classe C', 'P.IVA',   48, 20000, 1500,  640,  true),
('Mercedes', 'Classe C', 'Fleet',   36, 30000, 4000,  690,  true),
('Mercedes', 'Classe C', 'Privati', 36, 15000, 3000,  750,  true),
('Mercedes', 'Classe C', 'Privati', 48, 15000, 1500,  710,  true),

-- Tesla Model 3
('Tesla', 'Model 3', 'P.IVA',   24, 20000, 3000,  650,  true),
('Tesla', 'Model 3', 'P.IVA',   36, 20000, 2000,  590,  true),
('Tesla', 'Model 3', 'P.IVA',   48, 20000, 1000,  560,  true),
('Tesla', 'Model 3', 'Fleet',   36, 30000, 3000,  610,  true),
('Tesla', 'Model 3', 'Privati', 36, 15000, 2500,  680,  true),
('Tesla', 'Model 3', 'Privati', 48, 15000, 1000,  640,  true),

-- Tesla Model Y
('Tesla', 'Model Y', 'P.IVA',   24, 20000, 4000,  750,  true),
('Tesla', 'Model Y', 'P.IVA',   36, 20000, 2500,  690,  true),
('Tesla', 'Model Y', 'P.IVA',   48, 20000, 1500,  660,  true),
('Tesla', 'Model Y', 'Fleet',   36, 30000, 4000,  710,  true),
('Tesla', 'Model Y', 'Privati', 36, 15000, 3000,  780,  true),

-- BMW X5
('BMW', 'X5', 'P.IVA',   24, 20000, 6000,  1150, true),
('BMW', 'X5', 'P.IVA',   36, 20000, 4000,  1050, true),
('BMW', 'X5', 'Fleet',   36, 30000, 5000,  1080, true),
('BMW', 'X5', 'Privati', 36, 15000, 4000,  1200, true),

-- Mercedes GLC
('Mercedes', 'GLC', 'P.IVA',   24, 20000, 5000,  920,  true),
('Mercedes', 'GLC', 'P.IVA',   36, 20000, 3000,  860,  true),
('Mercedes', 'GLC', 'Fleet',   36, 30000, 4000,  890,  true),
('Mercedes', 'GLC', 'Privati', 36, 15000, 3500,  980,  true),

-- Volkswagen Transporter
('Volkswagen', 'Transporter', 'P.IVA',  24, 30000, 2000,  620,  true),
('Volkswagen', 'Transporter', 'P.IVA',  36, 30000, 1500,  570,  true),
('Volkswagen', 'Transporter', 'Fleet',  36, 40000, 2000,  590,  true),
('Volkswagen', 'Transporter', 'Fleet',  48, 40000, 1000,  550,  true),

-- Peugeot e-Expert
('Peugeot', 'e-Expert', 'P.IVA',  24, 30000, 2500,  580,  true),
('Peugeot', 'e-Expert', 'P.IVA',  36, 30000, 1500,  530,  true),
('Peugeot', 'e-Expert', 'Fleet',  36, 40000, 2000,  550,  true),

-- Audi A6
('Audi', 'A6', 'P.IVA',   24, 20000, 5000,  870,  true),
('Audi', 'A6', 'P.IVA',   36, 20000, 3000,  800,  true),
('Audi', 'A6', 'Fleet',   36, 30000, 4000,  820,  true),
('Audi', 'A6', 'Privati', 36, 15000, 3500,  920,  true),

-- Volvo XC90
('Volvo', 'XC90', 'P.IVA',   36, 20000, 5000,  1080, true),
('Volvo', 'XC90', 'Fleet',   36, 30000, 5000,  1100, true),
('Volvo', 'XC90', 'Privati', 36, 15000, 4000,  1180, true),

-- Audi Q4 e-tron
('Audi', 'Q4 e-tron', 'P.IVA',   36, 20000, 3000,  720,  true),
('Audi', 'Q4 e-tron', 'Fleet',   36, 30000, 3500,  740,  true),
('Audi', 'Q4 e-tron', 'Privati', 36, 15000, 2500,  790,  true),

-- Porsche Panamera
('Porsche', 'Panamera', 'P.IVA',   36, 20000, 8000,  1650, true),
('Porsche', 'Panamera', 'Fleet',   36, 20000, 8000,  1680, true),
('Porsche', 'Panamera', 'Privati', 36, 15000, 7000,  1750, true);


-- ── POSTS (news) ─────────────────────────────────────────────

INSERT INTO posts (title, slug, summary, content, category, cover_image_url, is_published, published_date) VALUES

('Il noleggio a lungo termine batte l''acquisto: i numeri del 2025',
 'nlt-batte-acquisto-2025',
 'Per la prima volta in Italia il NLT supera il leasing finanziario tra le PMI. Ecco perché sempre più aziende scelgono il canone fisso mensile.',
 '## Il sorpasso storico

Nel primo trimestre 2025 il noleggio a lungo termine ha superato per la prima volta il leasing finanziario come forma preferita di accesso all''auto aziendale tra le PMI italiane.

I dati ANIASA parlano chiaro: **+34% di contratti NLT** rispetto allo stesso periodo del 2024.

## Perché le aziende scelgono il NLT

I vantaggi sono concreti:

- **Canone fisso e deducibile** — nessuna sorpresa di bilancio
- **Zero immobilizzo di capitale** — il parco auto non pesa sullo stato patrimoniale
- **Manutenzione inclusa** — assicurazione, tagliandi, pneumatici: tutto nel canone
- **Flessibilità** — cambio veicolo al termine del contratto

## Il ruolo dell''elettrico

La crescita è trainata soprattutto dai veicoli elettrici. Il NLT è la formula ideale per elettrificare la flotta senza rischi: se la tecnologia evolve, a fine contratto si cambia.

> "Con il NLT abbiamo elettrificato il 70% della flotta in 18 mesi senza toccare il capitale aziendale." — Mario B., Fleet Manager, Milano',
 'Notizie',
 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80',
 true,
 now() - interval '2 days'),

('Tesla Model Y: la nostra flotta più richiesta del 2025',
 'tesla-model-y-flotta-2025',
 'Il SUV elettrico di Tesla è il veicolo più noleggiato della nostra piattaforma. Vi spieghiamo perché i clienti business lo scelgono rispetto ai competitor.',
 '## Model Y domina le richieste

Da gennaio 2025 la Tesla Model Y è il veicolo più richiesto sulla nostra piattaforma, superando per la prima volta i classici BMW Serie 5 e Mercedes Classe C.

## I numeri

- **42%** delle nuove pratiche include un Model Y
- Autonomia media reale rilevata dai clienti: **480km**
- Costo carburante medio mensile: **€38** (vs €180 diesel equivalente)

## Cosa dicono i clienti

I feedback che raccogliamo convergono su tre punti:

1. **Costo totale di gestione** nettamente inferiore
2. **Aggiornamenti OTA** — l''auto migliora senza portarla in officina
3. **Immagine aziendale** — i clienti notano il veicolo

## Configurazione più scelta

Il pacchetto più popolare in NLT: **36 mesi, 20.000km/anno, anticipo €2.500, canone €690/mese** per P.IVA (IVA inclusa e deducibile al 40%).',
 'Offerte',
 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=80',
 true,
 now() - interval '5 days'),

('Green Mobility 2025: gli incentivi per le flotte aziendali',
 'incentivi-flotte-aziendali-2025',
 'Il decreto ministeriale 2025 conferma gli incentivi per l''elettrificazione delle flotte. Ecco come accedere ai contributi e cosa cambia rispetto al 2024.',
 '## Il decreto 2025

Il Ministero delle Imprese ha confermato il pacchetto incentivi per l''elettrificazione delle flotte aziendali anche per il 2025, con alcune novità importanti.

## Cosa cambia

### Contributo diretto
- **€4.000 per veicolo** BEV (batteria) per aziende con flotta ≥5 veicoli
- **€2.000 per veicolo** PHEV (ibrido plug-in)
- Cumulabile con le detrazioni fiscali ordinarie

### Accesso facilitato per PMI
Le piccole e medie imprese (fatturato < €10M) possono accedere tramite domanda semplificata online, senza allegare il piano di elettrificazione completo.

## Come funziona con il NLT

Nel noleggio a lungo termine, l''incentivo viene tipicamente **scontato direttamente sul canone mensile** dal noleggiatore. Il cliente vede quindi un canone già ridotto senza dover gestire pratiche burocratiche.

Contattaci per verificare se la tua azienda ha diritto agli incentivi e calcolare il canone effettivo.',
 'Green Mobility',
 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80',
 true,
 now() - interval '10 days'),

('Guida completa al NLT per P.IVA: tutto quello che devi sapere',
 'guida-nlt-piva-completa',
 'Dal contratto alla dichiarazione dei redditi: la guida definitiva per titolari di P.IVA che vogliono noleggiare un''auto a lungo termine con il massimo risparmio fiscale.',
 '## NLT per P.IVA: la guida definitiva

Il noleggio a lungo termine è particolarmente vantaggioso per i titolari di Partita IVA. Ecco tutto quello che devi sapere.

## Deducibilità fiscale

Per le P.IVA in regime ordinario:
- **Canone mensile** deducibile al **80%** (uso promiscuo) o **100%** (uso esclusivo aziendale)
- **IVA** recuperabile al **40%** (uso promiscuo) o **100%** (uso esclusivo)

Esempio pratico: canone €690/mese → risparmio fiscale effettivo ~€200/mese.

## Cosa è incluso nel canone

Tutti i nostri contratti NLT includono:
- ✅ Assicurazione RCA + Kasko
- ✅ Manutenzione ordinaria e straordinaria
- ✅ Soccorso stradale H24
- ✅ Auto sostitutiva
- ✅ Gestione pratiche bollo

## Come richiedere l''offerta

1. Scegli il veicolo dalla nostra piattaforma
2. Configura durata, km annui e anticipo
3. Carica i documenti richiesti
4. Ricevi la proposta personalizzata entro 24h

Il processo è interamente digitale. Nessun appuntamento in concessionaria.',
 'Approfondimenti',
 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
 true,
 now() - interval '15 days');


-- ── PRATICHE (esempi) ────────────────────────────────────────
-- Nota: agente_id è NULL perché non abbiamo UUID agenti reali nel seed.
-- In produzione verrà popolato dall'admin tramite backoffice.

INSERT INTO pratiche (
  codice, status,
  cliente_nome, cliente_email, cliente_telefono, cliente_tipo, cliente_piva,
  veicolo_marca, veicolo_modello, segmento, durata_mesi, km_annui, anticipo, canone_mensile,
  note_cliente, ai_check_status
) VALUES

('NS-2025-00001', 'Nuova',
 'Marco Rossi', 'marco.rossi@example.com', '+39 02 1234567', 'P.IVA', 'RSSMRC80A01H501U',
 'Tesla', 'Model 3', 'P.IVA', 36, 20000, 2000, 590,
 'Preferisco colore bianco. Disponibile per consegna da marzo.', 'pending'),

('NS-2025-00002', 'Documenti Richiesti',
 'Acme S.r.l.', 'flotta@acme.it', '+39 02 9876543', 'Azienda', 'IT12345678901',
 'BMW', 'X5', 'Fleet', 48, 30000, 3000, 1050,
 'Flotta da 3 veicoli. Tutti da intestare all''azienda.', 'pending'),

('NS-2025-00003', 'Documenti Caricati',
 'Giulia Bianchi', 'giulia.b@gmail.com', '+39 333 1234567', 'Privato', 'BNCGLI90B41F205X',
 'Mercedes', 'Classe C', 'Privati', 36, 15000, 3000, 750,
 NULL, 'passed'),

('NS-2025-00004', 'Attesa Affidamento Finanziaria',
 'Studio Legale Verdi', 'info@studioverdi.it', '+39 06 5551234', 'P.IVA', 'VRDLNZ75C15H501P',
 'Audi', 'A6', 'P.IVA', 36, 20000, 3000, 800,
 'Uso promiscuo. Necessita di attestato di residenza aggiornato.', 'passed'),

('NS-2025-00005', 'Consegnata',
 'Tech Solutions S.r.l.', 'admin@techsolutions.it', '+39 02 3334455', 'Azienda', 'IT98765432109',
 'Tesla', 'Model Y', 'Fleet', 36, 30000, 4000, 710,
 'Consegnata il 15 gennaio 2025. Cliente soddisfatto.', 'passed');


-- ── NOTE PRATICHE (esempi) ───────────────────────────────────

INSERT INTO pratica_note (pratica_id, autore_nome, autore_ruolo, testo, visibile_cliente) VALUES

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00002'),
 'Sara Admin', 'backoffice',
 'Cliente ha inviato visura camerale ma manca il bilancio 2023. Richiesto via email.',
 false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00002'),
 'Sistema', 'sistema',
 'Status aggiornato a "Documenti Richiesti" — email automatica inviata al cliente.',
 true),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00003'),
 'Sara Admin', 'backoffice',
 'Tutti i documenti verificati. Procedere con affidamento finanziaria.',
 false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00004'),
 'Luca Backoffice', 'backoffice',
 'In attesa di risposta da Banca Sella. Stimato 3-5 giorni lavorativi.',
 false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00004'),
 'Luca Backoffice', 'backoffice',
 'La tua pratica è in fase di valutazione. Ti aggiorneremo entro venerdì.',
 true),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-00005'),
 'Sara Admin', 'backoffice',
 'Consegna effettuata regolarmente. Verbale firmato. Pratica chiusa.',
 false);


-- ── LEADS da AI chat (esempi) ────────────────────────────────

INSERT INTO leads (nome, email, telefono, tipo_cliente, interesse, status, source) VALUES
('Antonio Ferrara',  'a.ferrara@libero.it',   '+39 347 1234567', 'P.IVA',   'Tesla Model Y, 36 mesi',       'Nuovo',          'chat'),
('Lara Conti',       'lara.conti@gmail.com',  '+39 338 9876543', 'Privato', 'Mercedes Classe C ibrida',     'Contattato',     'chat'),
('Omega S.r.l.',     'info@omega-srl.it',     '+39 02 4445566',  'Azienda', 'Flotta 5 furgoni elettrici',   'Convertito',     'chat'),
('Paolo Mancini',    NULL,                    '+39 320 1112233', 'P.IVA',   'BMW Serie 5 diesel',           'Non qualificato','chat'),
('Federica Romano',  'f.romano@studio.it',    '+39 345 6677889', 'P.IVA',   'Audi A6 o equivalente',        'Nuovo',          'chat');
