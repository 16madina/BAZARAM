-- Confirmer automatiquement tous les utilisateurs existants qui ne sont pas confirmés
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Mettre à jour les profils correspondants
UPDATE public.profiles 
SET email_verified = true,
    verified_at = NOW()
WHERE email_verified = false OR email_verified IS NULL;