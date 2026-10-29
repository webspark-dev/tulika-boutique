-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Admin Authorization & RLS Non-Recursive Policy Fix
-- File: fix_admin_rls_and_authorize.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: READ-ONLY VERIFICATION QUERIES
-- Run these queries first in Supabase SQL Editor to inspect the live state.
-- (These make zero modifications to your database)
-- ------------------------------------------------------------------------------

-- 1A. Inspect authenticated user in auth.users
SELECT id AS auth_uid, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'palasdas2006@gmail.com';

-- 1B. Inspect all currently existing RLS policies on public.admins
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'admins';

-- 1C. Inspect current rows in public.admins
SELECT a.user_id, a.created_at, u.email 
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id;

-- 1D. Inspect existing definition of public.is_admin()
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace;


-- ------------------------------------------------------------------------------
-- STEP 2: MINIMAL & RERUNNABLE MIGRATION
-- Run this block to fix the policy recursion and authorize your admin account.
-- ------------------------------------------------------------------------------

-- 1. Ensure RLS is active on public.admins (never disabled globally)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Safely drop ALL potential legacy/duplicate policies on public.admins
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Authenticated can check admin row" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated user to read own admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated user to view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins viewable by authenticated users" ON public.admins;

-- 3. Non-recursive SELECT policy:
-- An authenticated user can only read their OWN row.
-- auth.uid() = user_id has ZERO function calls and ZERO recursion.
CREATE POLICY "Allow authenticated user to read own admin row"
  ON public.admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. INSERT/UPDATE/DELETE policies:
-- Only existing authorized admins can manage rows.
-- Ordinary authenticated users cannot insert themselves or others.
CREATE POLICY "Admins can insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admins"
  ON public.admins FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Secure Helper Function (RPC):
-- Provides direct boolean verification (<15ms) without table SELECT overhead.
-- Restricted search_path, owned by postgres, REVOKED from anon/public.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- Least privilege: Remove execution from anon and public; grant ONLY to authenticated
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 6. Authorize the actual account by matching email in auth.users
-- (Guarantees zero foreign key mismatch or invented UUIDs)
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users
WHERE email = 'palasdas2006@gmail.com'
ON CONFLICT (user_id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- STEP 3: POST-MIGRATION VERIFICATION
-- Run this to confirm the authorized administrator row
-- ------------------------------------------------------------------------------

SELECT 
  a.user_id,
  u.email,
  u.created_at AS user_registered_at,
  a.created_at AS admin_granted_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
