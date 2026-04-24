-- ============================================================
-- NoloSubito — Seed DEMO
-- Crea utenti demo con pratiche, note, lead e provvigioni
-- Esegui nel SQL Editor di Supabase (dopo seed.sql)
-- ============================================================

-- ── 1. UTENTI AUTH ───────────────────────────────────────────
-- Crea gli utenti nel sistema di autenticazione con password "Demo1234!"

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES

-- Agente 1
('00000000-0000-0000-0000-000000000000',
 'aaaaaaaa-0001-0001-0001-000000000001',
 'authenticated', 'authenticated',
 'marco.agente@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Marco Ferretti"}',
 false),

-- Agente 2
('00000000-0000-0000-0000-000000000000',
 'aaaaaaaa-0002-0002-0002-000000000002',
 'authenticated', 'authenticated',
 'sara.agente@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Sara Conti"}',
 false),

-- Agente 3
('00000000-0000-0000-0000-000000000000',
 'aaaaaaaa-0003-0003-0003-000000000003',
 'authenticated', 'authenticated',
 'luca.agente@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Luca Marino"}',
 false),

-- Backoffice
('00000000-0000-0000-0000-000000000000',
 'bbbbbbbb-0001-0001-0001-000000000001',
 'authenticated', 'authenticated',
 'anna.back@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Anna Ricci"}',
 false),

-- CMS
('00000000-0000-0000-0000-000000000000',
 'cccccccc-0001-0001-0001-000000000001',
 'authenticated', 'authenticated',
 'roberto.cms@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Roberto Esposito"}',
 false),

-- Cliente demo
('00000000-0000-0000-0000-000000000000',
 'dddddddd-0001-0001-0001-000000000001',
 'authenticated', 'authenticated',
 'cliente.demo@demo.it',
 crypt('Demo1234!', gen_salt('bf')),
 now(), now(), now(),
 '{"provider":"email","providers":["email"]}',
 '{"full_name":"Giovanni Russo"}',
 false)

ON CONFLICT (id) DO NOTHING;


-- ── 2. PROFILES ──────────────────────────────────────────────

INSERT INTO profiles (id, email, full_name, role) VALUES
('aaaaaaaa-0001-0001-0001-000000000001', 'marco.agente@demo.it',  'Marco Ferretti',    'agente'),
('aaaaaaaa-0002-0002-0002-000000000002', 'sara.agente@demo.it',   'Sara Conti',        'agente'),
('aaaaaaaa-0003-0003-0003-000000000003', 'luca.agente@demo.it',   'Luca Marino',       'agente'),
('bbbbbbbb-0001-0001-0001-000000000001', 'anna.back@demo.it',     'Anna Ricci',        'backoffice'),
('cccccccc-0001-0001-0001-000000000001', 'roberto.cms@demo.it',   'Roberto Esposito',  'cms'),
('dddddddd-0001-0001-0001-000000000001', 'cliente.demo@demo.it',  'Giovanni Russo',    'cliente')
ON CONFLICT (id) DO NOTHING;


-- ── 3. PRATICHE DEMO ─────────────────────────────────────────
-- 15 pratiche distribuite su tutti gli stati e 3 agenti

INSERT INTO pratiche (
  codice, status,
  cliente_nome, cliente_email, cliente_telefono, cliente_tipo, cliente_piva,
  veicolo_marca, veicolo_modello, segmento, durata_mesi, km_annui, anticipo, canone_mensile,
  agente_id, agente_nome,
  provvigione, provvigione_pagata,
  note_cliente, ai_check_status, created_at
) VALUES

-- Marco Ferretti (agente 1)
('NS-2025-10001', 'Consegnata',
 'Alfa Costruzioni S.r.l.', 'flotta@alfacostruzioni.it', '+39 02 1111111', 'Azienda', 'IT11111111111',
 'BMW', 'X5', 'Fleet', 48, 30000, 3000, 1050,
 'aaaaaaaa-0001-0001-0001-000000000001', 'Marco Ferretti',
 1200, true,
 'Flotta aziendale 3 veicoli. Tutti intestati alla società.', 'passed',
 now() - interval '45 days'),

('NS-2025-10002', 'Approvata',
 'Studio Bortoletti', 'info@studiobortoletti.it', '+39 06 2222222', 'P.IVA', 'BRTLNZ78M10H501K',
 'Mercedes', 'Classe C', 'P.IVA', 36, 20000, 2500, 670,
 'aaaaaaaa-0001-0001-0001-000000000001', 'Marco Ferretti',
 850, false,
 'Uso promiscuo. Richiesta fatturazione mensile.', 'passed',
 now() - interval '20 days'),

('NS-2025-10003', 'Documenti Richiesti',
 'Pietro Fontana', 'p.fontana@gmail.com', '+39 333 3333333', 'Privato', 'FNTPTR85D15F205Y',
 'Tesla', 'Model 3', 'Privati', 36, 15000, 2000, 680,
 'aaaaaaaa-0001-0001-0001-000000000001', 'Marco Ferretti',
 NULL, false,
 'Prima auto in NLT. Molto interessato al colore rosso.', 'pending',
 now() - interval '8 days'),

('NS-2025-10004', 'Nuova',
 'Fast Food Italia S.r.l.', 'admin@fastfooditalia.it', '+39 02 4444444', 'Azienda', 'IT44444444444',
 'Volkswagen', 'Transporter', 'Fleet', 36, 40000, 2000, 590,
 'aaaaaaaa-0001-0001-0001-000000000001', 'Marco Ferretti',
 NULL, false,
 'Flotta di furgoni per consegne. Zona Milano nord.', 'pending',
 now() - interval '2 days'),

('NS-2025-10005', 'Chiusa',
 'Omega Consulting', 'hr@omegaconsulting.it', '+39 02 5555555', 'Azienda', 'IT55555555555',
 'Audi', 'A6', 'Fleet', 36, 20000, 4000, 820,
 'aaaaaaaa-0001-0001-0001-000000000001', 'Marco Ferretti',
 950, true,
 'Rinnovato contratto. Cliente fidelizzato.', 'passed',
 now() - interval '90 days'),

-- Sara Conti (agente 2)
('NS-2025-20001', 'In Lavorazione',
 'Dott. Fabio Neri', 'f.neri@medicina.it', '+39 347 6666666', 'P.IVA', 'NREFBA80C12G273W',
 'Mercedes', 'GLC', 'P.IVA', 36, 20000, 3000, 860,
 'aaaaaaaa-0002-0002-0002-000000000002', 'Sara Conti',
 NULL, false,
 'Medico libero professionista. Uso promiscuo studio/privato.', 'passed',
 now() - interval '15 days'),

('NS-2025-20002', 'Attesa Affidamento Finanziaria',
 'Logistica Nord S.r.l.', 'ops@logisticanord.it', '+39 02 7777777', 'Azienda', 'IT77777777777',
 'Peugeot', 'e-Expert', 'Fleet', 36, 40000, 1500, 530,
 'aaaaaaaa-0002-0002-0002-000000000002', 'Sara Conti',
 NULL, false,
 'Transizione a flotta elettrica. 5 furgoni totali.', 'passed',
 now() - interval '12 days'),

('NS-2025-20003', 'Consegnata',
 'Green Energy S.p.A.', 'flotta@greenenergy.it', '+39 02 8888888', 'Azienda', 'IT88888888888',
 'Tesla', 'Model Y', 'Fleet', 36, 30000, 4000, 710,
 'aaaaaaaa-0002-0002-0002-000000000002', 'Sara Conti',
 1100, true,
 'Cliente premium. Vuole aggiornamenti settimanali.', 'passed',
 now() - interval '60 days'),

('NS-2025-20004', 'Documenti Caricati',
 'Valentina Esposito', 'v.esposito@libero.it', '+39 338 9999999', 'Privato', 'SPSVNT92E55H501Z',
 'Volvo', 'XC90', 'Privati', 36, 15000, 4000, 1180,
 'aaaaaaaa-0002-0002-0002-000000000002', 'Sara Conti',
 NULL, false,
 'Vuole il colore grigio pietra. Consegna entro fine mese.', 'passed',
 now() - interval '5 days'),

('NS-2025-20005', 'Nuova',
 'Studio Fotografico Luce', 'info@studioluce.it', '+39 347 1010101', 'P.IVA', 'LCENDR88H20C351M',
 'Audi', 'Q4 e-tron', 'P.IVA', 36, 20000, 3000, 720,
 'aaaaaaaa-0002-0002-0002-000000000002', 'Sara Conti',
 NULL, false,
 NULL, 'pending',
 now() - interval '1 day'),

-- Luca Marino (agente 3)
('NS-2025-30001', 'Stipula Contratto',
 'HR Solutions S.r.l.', 'cfo@hrsolutions.it', '+39 02 1212121', 'Azienda', 'IT12121212121',
 'BMW', '5 Series', 'Fleet', 48, 30000, 5000, 850,
 'aaaaaaaa-0003-0003-0003-000000000003', 'Luca Marino',
 1400, false,
 'CFO vuole contratto con intestazione holding.', 'passed',
 now() - interval '10 days'),

('NS-2025-30002', 'Affidamento Ricevuto',
 'Arch. Simona Galli', 's.galli@architettura.it', '+39 320 1313131', 'P.IVA', 'GLLSMN82L44H501V',
 'Porsche', 'Panamera', 'P.IVA', 36, 20000, 8000, 1650,
 'aaaaaaaa-0003-0003-0003-000000000003', 'Luca Marino',
 2200, false,
 'Pratica premium. Richiesta garanzia fideiussoria.', 'passed',
 now() - interval '7 days'),

('NS-2025-30003', 'Consegnata',
 'Delta Pharma S.r.l.', 'acquisti@deltapharma.it', '+39 02 1414141', 'Azienda', 'IT14141414141',
 'Mercedes', 'GLC', 'Fleet', 36, 30000, 4000, 890,
 'aaaaaaaa-0003-0003-0003-000000000003', 'Luca Marino',
 1050, true,
 NULL, 'passed',
 now() - interval '50 days'),

('NS-2025-30004', 'In Lavorazione',
 'Marco Vitale', 'm.vitale@consulenza.it', '+39 347 1515151', 'P.IVA', 'VTLMRC76P20F205T',
 'Tesla', 'Model 3', 'P.IVA', 36, 20000, 2000, 590,
 'aaaaaaaa-0003-0003-0003-000000000003', 'Luca Marino',
 NULL, false,
 'Passa da leasing a NLT. Aspetta scadenza contratto attuale.', 'passed',
 now() - interval '3 days'),

('NS-2025-30005', 'Attesa Consegna',
 'Rossini Group S.p.A.', 'flotta@rossinigroup.it', '+39 02 1616161', 'Azienda', 'IT16161616161',
 'Volvo', 'XC90', 'Fleet', 36, 30000, 5000, 1100,
 'aaaaaaaa-0003-0003-0003-000000000003', 'Luca Marino',
 1350, false,
 'Consegna programmata settimana prossima. Targa comunicata.', 'passed',
 now() - interval '25 days')

ON CONFLICT (codice) DO NOTHING;


-- ── 4. NOTE PRATICHE ─────────────────────────────────────────

INSERT INTO pratica_note (pratica_id, autore_nome, autore_ruolo, testo, visibile_cliente) VALUES

((SELECT id FROM pratiche WHERE codice = 'NS-2025-10002'),
 'Anna Ricci', 'backoffice',
 'Documenti ricevuti e verificati. Affidamento positivo da BNL. Procedere con contratto.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-10002'),
 'Anna Ricci', 'backoffice',
 'La sua pratica è stata approvata! Stiamo preparando la documentazione contrattuale.', true),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-10003'),
 'Marco Ferretti', 'agente',
 'Cliente ha inviato CdI ma manca bolletta per residenza. Richiesto via WhatsApp.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-10003'),
 'Anna Ricci', 'backoffice',
 'Per completare la pratica abbiamo bisogno di: bolletta utenza intestata a Lei (non oltre 3 mesi).', true),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-20002'),
 'Sara Conti', 'agente',
 'Richiesta inviata a 3 finanziarie: Leasys, ALD, Arval. In attesa risposta entro 48h.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-20004'),
 'Anna Ricci', 'backoffice',
 'Documenti ricevuti: CdI, CF, visura. Tutto in ordine. Procedere con valutazione.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30001'),
 'Luca Marino', 'agente',
 'CFO ha richiesto modifica intestazione: da Luca S.r.l. a HR Solutions Holding S.p.A.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30001'),
 'Anna Ricci', 'backoffice',
 'Verifica holding in corso con consulente legale. Attesa 2 giorni lavorativi.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30002'),
 'Anna Ricci', 'backoffice',
 'Pratica premium - priorità alta. Affidamento ricevuto da Leasys. Importo: €85.000.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30002'),
 'Luca Marino', 'agente',
 'La sua pratica ha ricevuto l''approvazione finanziaria. Passiamo alla firma del contratto questa settimana.', true),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30005'),
 'Anna Ricci', 'backoffice',
 'Targa: AB 123 CD. Concessionario confermato per giovedì 24. Avvisare cliente.', false),

((SELECT id FROM pratiche WHERE codice = 'NS-2025-30005'),
 'Luca Marino', 'agente',
 'Ottima notizia! La consegna è confermata per giovedì 24 aprile presso la sede di via Roma 12. Le invieremo l''indirizzo esatto.', true)

ON CONFLICT DO NOTHING;


-- ── 5. LEADS AGGIUNTIVI ───────────────────────────────────────

INSERT INTO leads (nome, email, telefono, tipo_cliente, interesse, status, source, created_at) VALUES
('Roberto Capone',      'r.capone@impresa.it',      '+39 347 2020202', 'P.IVA',   'BMW X5 o Mercedes GLC',          'Nuovo',          'website',   now() - interval '1 day'),
('Elisabetta Fontana',  'e.fontana@yahoo.it',        '+39 333 3030303', 'Privato', 'Tesla Model Y bianco',           'Contattato',     'website',   now() - interval '3 days'),
('Gamma S.r.l.',        'acquisti@gammasrl.it',      '+39 02 4040404',  'Azienda', 'Flotta 10 veicoli misti',        'In trattativa',  'referral',  now() - interval '5 days'),
('Dott. Paolo Russo',   'p.russo@notaio.it',         '+39 06 5050505',  'P.IVA',   'Audi A6 o Volvo XC90',          'Nuovo',          'chat',      now() - interval '2 days'),
('Costruzioni Beta',    'info@costrbeta.it',         '+39 02 6060606',  'Azienda', 'Volkswagen Transporter x3',     'Contattato',     'chat',      now() - interval '6 days'),
('Maria Grazia Sordi',  'mg.sordi@libero.it',        '+39 338 7070707', 'Privato', 'Mercedes Classe C ibrida',      'Non qualificato','website',   now() - interval '8 days'),
('Studio Tecnico Blu',  'st.blu@gmail.com',          '+39 347 8080808', 'P.IVA',   'Porsche Panamera o Audi A6',    'In trattativa',  'referral',  now() - interval '4 days'),
('Logistica Sud',       'ops@logisticasud.it',       '+39 081 9090909', 'Azienda', 'Peugeot e-Expert x5 elettrici', 'Convertito',     'website',   now() - interval '20 days'),
('Francesco Amato',     'f.amato@artigiano.it',      '+39 320 1010201', 'P.IVA',   'Volkswagen Transporter',        'Nuovo',          'chat',      now()),
('Nexus Digital S.r.l.','hr@nexusdigital.it',        '+39 02 1020304',  'Azienda', 'Tesla Model Y fleet 4 unità',   'Contattato',     'website',   now() - interval '2 days')

ON CONFLICT DO NOTHING;

-- ── RIEPILOGO ─────────────────────────────────────────────────
-- Utenti creati (password: Demo1234!):
--   marco.agente@demo.it   → agente
--   sara.agente@demo.it    → agente
--   luca.agente@demo.it    → agente
--   anna.back@demo.it      → backoffice
--   roberto.cms@demo.it    → cms
--   cliente.demo@demo.it   → cliente
--
-- Pratiche: 15 (distribuite su tutti gli stati)
-- Lead: 15 totali (5 esistenti + 10 nuovi)
-- Note: 12 (interne e visibili al cliente)
-- ============================================================
