-- =============================================================================
-- READ-ONLY preflight for 06_public_read_policy_fix.sql
-- Run this first in Supabase SQL Editor. It performs SELECTs only.
-- No policy, grant, table, function, or data is changed.
-- =============================================================================

BEGIN TRANSACTION READ ONLY;

-- 1. RLS flags for all tables whose policies the proposed fix may affect,
-- plus admins and Storage to verify the adjacent authorization boundaries.
WITH wanted(schema_name, table_name) AS (
  VALUES
    ('public', 'categories'),
    ('public', 'products'),
    ('public', 'reviews'),
    ('public', 'settings'),
    ('public', 'admins'),
    ('storage', 'objects')
)
SELECT
  w.schema_name,
  w.table_name,
  c.oid IS NOT NULL AS table_exists,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  CASE WHEN c.oid IS NOT NULL THEN pg_get_userbyid(c.relowner) END AS table_owner
FROM wanted w
LEFT JOIN pg_namespace n ON n.nspname = w.schema_name
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = w.table_name
ORDER BY w.schema_name, w.table_name;

-- 2. Every current policy on the relevant tables. "permissive" matters:
-- permissive policies for the same command/role are OR-ed together.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE (schemaname = 'public'
       AND tablename IN ('categories', 'products', 'reviews', 'settings', 'admins'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, cmd, policyname;

-- 3. Exact function definitions and security properties. This reports the
-- live function owner, SECURITY DEFINER flag, function-level search_path,
-- and ACL (including default ACL when proacl is NULL).
WITH wanted(signature) AS (
  VALUES
    ('public.is_admin()'),
    ('public.is_current_user_admin()')
),
resolved AS (
  SELECT signature, to_regprocedure(signature) AS function_oid
  FROM wanted
)
SELECT
  r.signature,
  p.oid IS NOT NULL AS function_exists,
  CASE WHEN p.oid IS NOT NULL THEN pg_get_userbyid(p.proowner) END AS function_owner,
  p.prosecdef AS security_definer,
  p.proconfig AS function_settings,
  p.proacl AS stored_acl,
  CASE
    WHEN p.oid IS NOT NULL THEN pg_get_functiondef(p.oid)
  END AS function_definition,
  CASE
    WHEN p.oid IS NOT NULL THEN has_function_privilege('anon', p.oid, 'EXECUTE')
  END AS anon_effective_execute,
  CASE
    WHEN p.oid IS NOT NULL THEN has_function_privilege('authenticated', p.oid, 'EXECUTE')
  END AS authenticated_effective_execute
FROM resolved r
LEFT JOIN pg_proc p ON p.oid = r.function_oid
ORDER BY r.signature;

-- 4. Explicit function ACL entries, expanded to readable grantee names.
WITH wanted(signature, function_oid) AS (
  VALUES
    ('public.is_admin()', to_regprocedure('public.is_admin()')),
    ('public.is_current_user_admin()', to_regprocedure('public.is_current_user_admin()'))
)
SELECT
  w.signature,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE grantee_role.rolname
  END AS grantee,
  grantor_role.rolname AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM wanted w
LEFT JOIN pg_proc p ON p.oid = w.function_oid
LEFT JOIN LATERAL aclexplode(
  CASE WHEN p.oid IS NOT NULL
       THEN COALESCE(p.proacl, acldefault('f', p.proowner))
  END
) acl ON true
LEFT JOIN pg_roles grantee_role ON grantee_role.oid = acl.grantee
LEFT JOIN pg_roles grantor_role ON grantor_role.oid = acl.grantor
ORDER BY w.signature, grantee;

-- 5. Effective table privileges for PostgREST roles; includes privileges
-- inherited through PUBLIC or role membership.
WITH wanted(table_name) AS (
  VALUES ('categories'), ('products'), ('reviews'), ('settings'), ('admins')
),
roles(role_name) AS (
  VALUES ('anon'), ('authenticated')
),
privileges(privilege_name) AS (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
SELECT
  'public' AS schema_name,
  w.table_name,
  r.role_name,
  p.privilege_name,
  CASE
    WHEN to_regclass(format('%I.%I', 'public', w.table_name)) IS NOT NULL
    THEN has_table_privilege(
      r.role_name,
      to_regclass(format('%I.%I', 'public', w.table_name)),
      p.privilege_name
    )
  END AS effective_granted
FROM wanted w
CROSS JOIN roles r
CROSS JOIN privileges p
ORDER BY w.table_name, r.role_name, p.privilege_name;

-- 6. Direct table ACL entries for the same tables, including PUBLIC grants.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee,
  grantor_role.rolname AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(
  COALESCE(c.relacl, acldefault('r', c.relowner))
) acl
LEFT JOIN pg_roles grantee_role ON grantee_role.oid = acl.grantee
LEFT JOIN pg_roles grantor_role ON grantor_role.oid = acl.grantor
WHERE (n.nspname = 'public'
       AND c.relname IN ('categories', 'products', 'reviews', 'settings', 'admins'))
   OR (n.nspname = 'storage' AND c.relname = 'objects')
ORDER BY n.nspname, c.relname, grantee, acl.privilege_type;

-- 7. Storage bucket visibility and upload constraints. The proposed migration
-- does not alter storage.objects policies or bucket settings.
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

COMMIT;
