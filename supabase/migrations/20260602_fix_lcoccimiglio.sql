-- ============================================================
-- DIAGNOSTIC + FIX COMPLETO per lcoccimiglio@gmail.com
-- Esegui nel SQL Editor di Supabase (SQL puro, no psql)
-- ============================================================

-- Assicura che pgcrypto sia disponibile per gen_salt/crypt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── 1. STATO ATTUALE ───────────────────────────────────────────
SELECT
  'auth.users'  AS sorgente,
  id,
  email,
  email_confirmed_at IS NOT NULL AS email_verificata,
  to_char(created_at, 'DD/MM/YYYY HH24:MI') AS creato_il,
  to_char(last_sign_in_at, 'DD/MM/YYYY HH24:MI') AS ultimo_accesso
FROM auth.users
WHERE email = 'lcoccimiglio@gmail.com';

SELECT
  'public.profiles' AS sorgente,
  id,
  email,
  full_name,
  role,
  backoffice_role,
  is_active
FROM public.profiles
WHERE email = 'lcoccimiglio@gmail.com';


-- ── 2. FIX AUTOMATICO ─────────────────────────────────────────
-- MODIFICA LA PASSWORD PRIMA DI ESEGUIRE
DO $$
DECLARE
  target_email TEXT := 'lcoccimiglio@gmail.com';
  target_pass  TEXT := 'CambiaSubito!2026';
  user_id      UUID;
  profile_exists BOOLEAN;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE NOTICE 'CASO A: utente non trovato, lo creo da zero...';
    user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id, 'authenticated', 'authenticated',
      target_email,
      extensions.crypt(target_pass, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Luigi Coccimiglio"}',
      false
    );
    RAISE NOTICE '   ok auth.users creato (id: %)', user_id;

    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (user_id, target_email, 'Luigi Coccimiglio', 'admin', true);
    RAISE NOTICE '   ok public.profiles creato con role=admin';
  ELSE
    RAISE NOTICE 'CASO B: utente trovato (id: %), aggiorno...', user_id;

    UPDATE auth.users
    SET encrypted_password  = extensions.crypt(target_pass, extensions.gen_salt('bf')),
        email_confirmed_at  = COALESCE(email_confirmed_at, now()),
        updated_at          = now()
    WHERE id = user_id;
    RAISE NOTICE '   ok password resettata e email confermata';

    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;

    IF profile_exists THEN
      UPDATE public.profiles
      SET role      = 'admin',
          is_active = true
      WHERE id = user_id;
      RAISE NOTICE '   ok profilo aggiornato a role=admin, is_active=true';
    ELSE
      INSERT INTO public.profiles (id, email, full_name, role, is_active)
      VALUES (user_id, target_email, 'Luigi Coccimiglio', 'admin', true);
      RAISE NOTICE '   ok profilo creato con role=admin';
    END IF;
  END IF;
END $$;


-- ── 3. VERIFICA FINALE ────────────────────────────────────────
SELECT
  au.email,
  p.full_name,
  p.role,
  p.is_active,
  (au.email_confirmed_at IS NOT NULL) AS email_ok,
  to_char(au.last_sign_in_at, 'DD/MM/YYYY HH24:MI') AS ultimo_accesso
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'lcoccimiglio@gmail.com';
