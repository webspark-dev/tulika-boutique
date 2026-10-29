-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- File: 09_customer_reviews_moderation.sql
-- Description: Minimal, Non-Destructive Customer Review Submission Policy
-- Project: meqwvikovixhokehjmee
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: PRE-INSPECTION (READ-ONLY)
-- Run this block first to inspect the current live database state.
-- ------------------------------------------------------------------------------

-- 1A. Inspect reviews table columns, constraints, and default values
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reviews'
ORDER BY ordinal_position;

-- 1B. Inspect active RLS policies currently on public.reviews
SELECT
  policyname,
  cmd,
  roles,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reviews'
ORDER BY cmd, policyname;

-- 1C. Inspect role table grants for anon and authenticated on public.reviews
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'reviews'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;


-- ------------------------------------------------------------------------------
-- STEP 2: MINIMAL NON-DESTRUCTIVE MIGRATION
-- Run this transaction block to enable anonymous customer review submissions.
-- Does not drop or alter any existing admin policies or table data.
-- ------------------------------------------------------------------------------

BEGIN;

-- 2A. Ensure default for future review rows is false (pending admin approval)
-- (Preserves all existing reviews; only applies to new inserts that omit is_visible)
ALTER TABLE public.reviews
  ALTER COLUMN is_visible SET DEFAULT false;

-- 2B. Ensure Postgres table-level INSERT grant is active for anon and authenticated
GRANT INSERT ON public.reviews TO anon, authenticated;

-- 2C. Create the customer INSERT policy
-- Strict constraints:
-- • is_visible must be strictly false (customers can never publish reviews directly)
-- • rating must be between 1 and 5
-- • author_name must be between 2 and 100 characters
-- • comment_bn must be between 2 and 1000 characters (satisfies NOT NULL constraint)
DROP POLICY IF EXISTS "Public can submit pending reviews" ON public.reviews;

CREATE POLICY "Public can submit pending reviews"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_visible = false
    AND rating >= 1 AND rating <= 5
    AND author_name IS NOT NULL
    AND length(trim(author_name)) >= 2
    AND length(trim(author_name)) <= 100
    AND comment_bn IS NOT NULL
    AND length(trim(comment_bn)) >= 2
    AND length(trim(comment_bn)) <= 1000
  );

COMMIT;


-- ------------------------------------------------------------------------------
-- STEP 3: POST-MIGRATION VERIFICATION (READ-ONLY)
-- Run this block after Step 2 to verify that the policy is live and active.
-- ------------------------------------------------------------------------------

-- 3A. Verify all policies on public.reviews (should include "Public can submit pending reviews")
SELECT
  policyname,
  cmd AS command,
  roles,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reviews'
ORDER BY cmd, policyname;

-- 3B. Verify table-level INSERT grant for anon
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'reviews'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type = 'INSERT'
ORDER BY grantee;
