-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- File: migration_reviews_moderation.sql
-- Description: Minimal, Non-Destructive Customer Review Submission Policy
--
-- EXISTING POLICIES PRESERVED (NOT DROPPED OR RECREATED):
-- 1. "Admins can manage reviews" (ALL, authenticated, USING is_admin(), WITH CHECK is_admin())
-- 2. "Public can view visible reviews" (SELECT, public, USING is_visible = true OR is_admin())
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

-- 1B. Confirm existing policies (should show your 2 existing policies)
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

-- 2C. Ensure EXECUTE permission on public.is_admin() for anon & authenticated
-- (Guarantees public SELECT policy "is_visible = true OR is_admin()" never encounters permission issues)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2D. Create the single missing INSERT policy for public customers
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
-- Run this to confirm the 3 final active policies and permissions:
-- 1. "Admins can manage reviews"         (ALL, authenticated) -> Preserved unchanged
-- 2. "Public can view visible reviews"   (SELECT, public)     -> Preserved unchanged
-- 3. "Public can submit pending reviews" (INSERT, anon/auth)  -> Newly added
-- ------------------------------------------------------------------------------

-- 3A. Verify all 3 policies on public.reviews
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
