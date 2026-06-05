-- ============================================================
-- Migration: promuovi lcoccimiglio@gmail.com a super admin
-- Resiliente a colonne mancanti (esegui DOPO 20260604_profiles_schema_align.sql)
-- Esegui nel SQL Editor di Supabase
-- ============================================================

DO $$
DECLARE
  target_email TEXT := 'lcoccimiglio@gmail.com';
  user_id      UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utente % non trovato in auth.users. Crealo prima con signup o INSERT.', target_email;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (user_id, target_email, 'Luigi Coccimiglio', 'admin', true)
  ON CONFLICT (id) DO UPDATE
    SET role      = 'admin',
        is_active = true,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at         = now()
  WHERE id = user_id;

  RAISE NOTICE 'OK: % è ora admin (id: %)', target_email, user_id;
END $$;

-- Verifica
SELECT au.id, au.email, p.full_name, p.role, p.is_active, au.email_confirmed_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'lcoccimiglio@gmail.com';
