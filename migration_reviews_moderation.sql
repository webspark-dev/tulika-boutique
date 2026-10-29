-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- File: migration_reviews_moderation.sql
-- Description: Customer review submission and role-separated read/moderation policies
--
-- Public reads do not call is_admin(); only authenticated admin policies do.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: PRE-CHECK VERIFICATION (READ-ONLY)
-- Run this first in Supabase SQL Editor to verify the existing state.
-- ------------------------------------------------------------------------------

-- 1A. Confirm table structure, default values, and NOT NULL constraints
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- 1B. Inspect existing policies before applying the migration
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'reviews';

-- 1C. Confirm public.is_admin() function exists and is SECURITY DEFINER
SELECT proname, prosecdef, provolatile, prosrc
FROM pg_proc 
WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace;

-- 1D. Confirm current table-level privileges for anon and authenticated
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY grantee, privilege_type;


-- ------------------------------------------------------------------------------
-- STEP 2: MINIMAL & SURGICAL MIGRATION
-- ------------------------------------------------------------------------------

-- 2A. Ensure newly inserted reviews default to pending (is_visible = false)
-- (Preserves all existing data; only sets the default for future inserts)
ALTER TABLE public.reviews 
  ALTER COLUMN is_visible SET DEFAULT false;

-- 2B. Ensure Postgres table-level privileges permit INSERT for anon & authenticated
-- (Prerequisite for Row-Level Security evaluation on INSERT)
GRANT INSERT ON public.reviews TO anon, authenticated;

-- 2C. Keep is_admin() unavailable to anonymous/public callers. Admin auth remains
-- available to signed-in users and is used only by authenticated admin policies.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2D. Replace the old public-read/admin-ALL policies. The old public policy
-- called is_admin() for anonymous requests and could fail with permission denied.
DROP POLICY IF EXISTS "Public can view visible reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view visible reviews only" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

CREATE POLICY "Public can view visible reviews"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (is_visible = true);
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admins can insert reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.is_admin());

-- 2E. Create the customer INSERT policy for public customers
-- Strict constraints:
-- • is_visible must be explicitly FALSE (customers cannot publish reviews)
-- • rating must be between 1 and 5
-- • author_name must not be empty
-- • comment_bn must not be empty (matches existing table NOT NULL constraint)
DROP POLICY IF EXISTS "Public can submit pending reviews" ON public.reviews;
CREATE POLICY "Public can submit pending reviews"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_visible = false
    AND rating >= 1 AND rating <= 5
    AND length(trim(author_name)) > 0
    AND length(trim(comment_bn)) > 0
  );


-- ------------------------------------------------------------------------------
-- STEP 3: POST-MIGRATION VERIFICATION (READ-ONLY)
-- The reviews table should have public-visible SELECT, admin SELECT and writes,
-- plus public pending-review INSERT policies.
-- ------------------------------------------------------------------------------

-- 3A. Verify all policies on public.reviews
SELECT 
  policyname, 
  cmd AS command, 
  roles, 
  qual AS using_expression, 
  with_check AS check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'reviews'
ORDER BY cmd;

-- 3B. Verify table-level INSERT privilege is active for anon and authenticated
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'reviews' AND privilege_type = 'INSERT'
ORDER BY grantee;

-- 3C. anon must not be able to execute the admin authorization helper.
SELECT
  has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') AS anon_can_execute_is_admin,
  has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') AS authenticated_can_execute_is_admin;
