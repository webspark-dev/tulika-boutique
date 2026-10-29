-- =============================================================================
-- Tulika Boutique: reviewed repair for admin authorization
-- Run ONLY after reviewing 04_diagnose_admin_authorization.sql. This is the
-- minimum repair: it does not alter RLS policies, table grants, admin rows,
-- passwords, or Auth settings.
-- =============================================================================

BEGIN;

-- The canonical check is security-definer so it can safely answer only true or
-- false without exposing any admin rows. Its execution is NOT public/anonymous.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Validation only: both functions must be zero-argument, boolean-returning,
-- SECURITY DEFINER functions after this transaction.
SELECT p.oid::regprocedure AS signature, p.prorettype::regtype AS return_type,
       p.prosecdef AS security_definer, p.proacl AS function_acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_current_user_admin')
ORDER BY p.proname;

COMMIT;
