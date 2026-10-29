-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Admin Authorization Script (authorize_admin.sql)
--
-- This script grants administrator authorization to an existing authenticated
-- Supabase account. It uses the exact schema defined in schema.sql:
--   TABLE public.admins (user_id UUID PRIMARY KEY REFERENCES auth.users(id))
-- ==============================================================================

-- STEP 1: Insert the admin record by matching the user's authenticated email.
-- Replace 'palasdas0708@gmail.com' with your actual account email if different.
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users
WHERE email = 'palasdas0708@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- STEP 2: Verification Query
-- Run this to confirm the account is registered in public.admins
SELECT
  a.user_id,
  u.email,
  u.created_at AS user_registered_at,
  a.created_at AS admin_granted_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;

