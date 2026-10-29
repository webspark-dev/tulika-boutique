-- =============================================================================
-- Tulika Boutique: READ-ONLY admin authorization diagnosis
-- Run in the Supabase SQL Editor. This script changes no data, RLS policy,
-- function, role, grant, or authentication setting.
-- =============================================================================

-- 1. Confirm that the application schema matches what the browser expects.
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- 2. Check that RLS is enabled and list every policy currently affecting admins.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'admins';

SELECT policyname, cmd, roles, qual AS using_expression, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admins'
ORDER BY cmd, policyname;

-- 3. Inspect exact signatures, return types, owners, security, ACLs, and bodies
-- for the zero-argument RPC functions called by js/store.js.
SELECT p.oid::regprocedure AS signature,
       p.proname,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prorettype::regtype AS return_type,
       pg_get_userbyid(p.proowner) AS function_owner,
       p.prosecdef AS security_definer,
       p.proconfig AS function_config,
       p.proacl AS function_acl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_current_user_admin')
ORDER BY p.proname, p.oid::regprocedure::text;

-- 4. Verify who is allowed to execute the functions and read the table.
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public'
  AND routine_name IN ('is_admin', 'is_current_user_admin')
ORDER BY routine_name, grantee;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'admins'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 5. List the existing authorized IDs alongside their Auth email. Compare the
-- signed-in browser user's UID with this result; authorization is UID-based.
SELECT a.user_id, u.email, a.created_at AS admin_granted_at
FROM public.admins a
LEFT JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at;
