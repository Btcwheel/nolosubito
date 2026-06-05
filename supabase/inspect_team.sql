-- ============================================================
-- NoloSubito — Ispezione e gestione team
-- Mostra TUTTI gli utenti con i loro ruoli e permessi effettivi
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- ── 1. TUTTI GLI UTENTI (auth + profilo) ──────────────────────
-- Join fra auth.users (credenziali) e profiles (ruolo applicativo)

SELECT
  au.id,
  au.email,
  COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', '') AS full_name,
  au.created_at                                          AS account_creato,
  au.last_sign_in_at                                     AS ultimo_accesso,
  au.email_confirmed_at IS NOT NULL                      AS email_verificata,
  p.role                                                 AS ruolo_principale,
  p.backoffice_role                                      AS sotto_ruolo,
  p.is_active                                            AS attivo,
  p.permissions                                          AS permessi_override,
  p.invited_at                                           AS invitato_il,
  inv.email                                              AS invitato_da
FROM auth.users au
LEFT JOIN public.profiles p   ON p.id = au.id
LEFT JOIN public.profiles inv ON inv.id = p.invited_by
ORDER BY
  CASE p.role
    WHEN 'admin'      THEN 1
    WHEN 'backoffice' THEN 2
    WHEN 'cms'        THEN 3
    WHEN 'agente'     THEN 4
    WHEN 'cliente'    THEN 5
    ELSE 6
  END,
  au.email;


-- ── 2. SOLO ADMIN E SUPER-ADMIN ───────────────────────────────
-- Lo schema attuale non distingue "super admin":
-- qualsiasi profile con role='admin' ha poteri totali.
-- Se in futuro vuoi introdurre il livello "super_admin",
-- vedi sezione "Upgrade: aggiungere super_admin" in fondo.

SELECT
  au.id,
  au.email,
  p.full_name,
  p.role,
  p.is_active,
  au.last_sign_in_at,
  p.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;


-- ── 3. BACKOFFICE CON PERMESSI EFFETTIVI ──────────────────────
-- Espande i permessi base del sotto-ruolo + override individuali

WITH defaults AS (
  SELECT 'operatore_base'   AS ruolo, jsonb_build_object('pratiche', true,  'preventivi', true,  'lead', true,  'escalation', false, 'knowledge_base', false, 'report', false) AS perms UNION ALL
  SELECT 'operatore_senior', jsonb_build_object('pratiche', true,  'preventivi', true,  'lead', true,  'escalation', true,  'knowledge_base', true,  'report', false) UNION ALL
  SELECT 'supervisore',      jsonb_build_object('pratiche', true,  'preventivi', false, 'lead', true,  'escalation', true,  'knowledge_base', true,  'report', true)
)
SELECT
  au.email,
  p.full_name,
  p.backoffice_role                                                            AS sotto_ruolo,
  p.is_active                                                                  AS attivo,
  d.perms                                                                      AS permessi_default,
  p.permissions                                                                AS override_individuali,
  d.perms || p.permissions                                                     AS permessi_effettivi,
  p.invited_at                                                                 AS invitato_il,
  inv.email                                                                    AS invitato_da
FROM public.profiles p
JOIN auth.users au   ON au.id = p.id
LEFT JOIN defaults d ON d.ruolo = p.backoffice_role
LEFT JOIN public.profiles inv ON inv.id = p.invited_by
WHERE p.role = 'backoffice'
ORDER BY p.backoffice_role, p.created_at;


-- ── 4. AGENTI CON PRATICHE ASSEGNATE ──────────────────────────
-- Usa COALESCE su agente_info per essere resiliente se la colonna
-- non è ancora stata aggiunta (migration 20260604_profiles_agente_info.sql).

SELECT
  au.email,
  p.full_name,
  COALESCE(p.agente_info, '{}'::jsonb)                      AS agente_info,
  COUNT(pr.id)                                              AS totale_pratiche,
  COUNT(*) FILTER (WHERE pr.status NOT IN ('Consegnata','Chiusa')) AS in_corso,
  COUNT(*) FILTER (WHERE pr.status = 'Consegnata')          AS consegnate,
  COALESCE(SUM(pr.provvigione) FILTER (WHERE pr.provvigione IS NOT NULL), 0) AS provvigione_totale,
  COALESCE(SUM(pr.provvigione) FILTER (WHERE pr.provvigione_pagata), 0)     AS provvigione_pagata
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN public.pratiche pr ON pr.agente_id = p.id
WHERE p.role = 'agente'
GROUP BY au.email, p.full_name, p.agente_info
ORDER BY totale_pratiche DESC;


-- ── 5. RIEPILOGO PER RUOLO ────────────────────────────────────

SELECT
  role,
  backoffice_role,
  COUNT(*) AS utenti,
  COUNT(*) FILTER (WHERE is_active)  AS attivi,
  COUNT(*) FILTER (WHERE NOT is_active) AS disattivati,
  COUNT(*) FILTER (WHERE invited_by IS NOT NULL) AS invitati_da_admin
FROM public.profiles
GROUP BY role, backoffice_role
ORDER BY role, backoffice_role;


-- ============================================================
-- BOOTSTRAP: crea il PRIMO admin se non ne esiste nessuno
-- Da eseguire UNA VOLTA SOLA. Cambia email e password.
-- ============================================================

DO $$
DECLARE
  admin_count INTEGER;
  new_user_id UUID := gen_random_uuid();
  new_email   TEXT := 'superadmin@nolosubito.it';   -- ← MODIFICA
  new_pass    TEXT := 'CambiaSubito!2026';          -- ← MODIFICA
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

  IF admin_count > 0 THEN
    RAISE NOTICE 'Esistono già % admin. Skip bootstrap.', admin_count;
    RETURN;
  END IF;

  -- Crea l'utente in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id, 'authenticated', 'authenticated',
    new_email,
    crypt(new_pass, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}',
    false
  ) ON CONFLICT (id) DO NOTHING;

  -- Crea il profilo
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (new_user_id, new_email, 'Super Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;

  RAISE NOTICE 'Admin creato: % (password: %)', new_email, new_pass;
END $$;


-- ============================================================
-- AGGIUNGERE un admin esistente (dopo il bootstrap iniziale)
-- Promuove un utente qualsiasi ad admin. Da eseguire come super-admin.
-- ============================================================

-- UPDATE public.profiles
-- SET role = 'admin', is_active = true
-- WHERE email = 'utente@esempio.it';


-- ============================================================
-- UPGRADE opzionale: introdurre il ruolo "super_admin"
-- Da eseguire solo se vuoi differenziare i due livelli.
-- Modifica anche:
--   - src/lib/AuthContext.jsx (isAdmin, isSuperAdmin)
--   - src/lib/permissions.js (canAccess super_admin)
--   - src/components/ProtectedRoute.jsx (roles={['super_admin']})
--   - src/components/admin/AdminTeam.jsx (sezione super admin separata)
-- ============================================================

-- 1. Allarga il CHECK constraint
-- ALTER TABLE public.profiles
--   DROP CONSTRAINT profiles_role_check;
-- ALTER TABLE public.profiles
--   ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('super_admin','admin','backoffice','agente','cliente','cms'));

-- 2. Aggiorna la funzione get_user_role() per esporre anche il flag
-- CREATE OR REPLACE FUNCTION get_user_role()
-- RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
--   SELECT role FROM profiles WHERE id = auth.uid();
-- $$;

-- 3. Promuovi un admin esistente a super_admin
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'superadmin@nolosubito.it';

-- 4. Le policy RLS esistenti che concedono accesso a 'admin' continuano a funzionare.
--    Aggiungi policy dedicate per 'super_admin' solo dove serve un livello extra
--    (es. UPDATE su profiles per modificare altri admin).
