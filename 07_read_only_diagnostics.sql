-- Tulika Boutique: read-only Supabase preflight diagnostics
-- Run the complete file in Supabase SQL Editor. Every executable statement
-- below is a SELECT query and does not change database state.

-- 1. Table existence, ownership, and row-level security status
WITH targets(schema_name, table_name) AS (
  VALUES
    ('public', 'categories'),
    ('public', 'products'),
    ('public', 'reviews'),
    ('public', 'admins'),
    ('public', 'settings'),
    ('storage', 'objects')
)
SELECT
  t.schema_name,
  t.table_name,
  c.oid IS NOT NULL AS table_exists,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  CASE WHEN c.oid IS NOT NULL THEN pg_get_userbyid(c.relowner) END AS table_owner
FROM targets t
LEFT JOIN pg_namespace n ON n.nspname = t.schema_name
LEFT JOIN pg_class c
  ON c.relnamespace = n.oid
  AND c.relname = t.table_name
ORDER BY t.schema_name, t.table_name;

-- 2. All policies on the affected tables
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
       AND tablename IN ('categories', 'products', 'reviews', 'admins', 'settings'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, cmd, policyname;

-- 3. Authorization function definitions, owners, security modes, and settings
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_userbyid(p.proowner) AS function_owner,
  CASE
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_mode,
  p.proconfig AS function_settings,
  p.proacl AS stored_acl,
  pg_get_functiondef(p.oid) AS exact_definition,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_effective_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_effective_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_current_user_admin')
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- 4. Function permission entries, including default ACLs when no explicit ACL
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE grantee_role.rolname
  END AS grantee,
  grantor_role.rolname AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(
  COALESCE(p.proacl, acldefault('f', p.proowner))
) acl
LEFT JOIN pg_roles grantee_role ON grantee_role.oid = acl.grantee
LEFT JOIN pg_roles grantor_role ON grantor_role.oid = acl.grantor
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_current_user_admin')
ORDER BY p.proname, identity_arguments, grantee;

-- 5. Effective table permissions for Supabase API roles
WITH targets(table_name) AS (
  VALUES ('categories'), ('products'), ('reviews'), ('admins'), ('settings')
),
api_roles(role_name) AS (
  VALUES ('anon'), ('authenticated')
),
table_privileges(privilege_name) AS (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
SELECT
  'public' AS schema_name,
  t.table_name,
  r.role_name,
  p.privilege_name,
  CASE
    WHEN to_regclass(format('%I.%I', 'public', t.table_name)) IS NOT NULL
    THEN has_table_privilege(
      r.role_name,
      to_regclass(format('%I.%I', 'public', t.table_name)),
      p.privilege_name
    )
  END AS effective_granted
FROM targets t
CROSS JOIN api_roles r
CROSS JOIN table_privileges p
ORDER BY t.table_name, r.role_name, p.privilege_name;

-- 6. Direct table ACL entries, including entries granted to PUBLIC
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE grantee_role.rolname
  END AS grantee,
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
       AND c.relname IN ('categories', 'products', 'reviews', 'admins', 'settings'))
   OR (n.nspname = 'storage' AND c.relname = 'objects')
ORDER BY n.nspname, c.relname, grantee, acl.privilege_type;

-- 7. Product image bucket visibility and upload constraints
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';
