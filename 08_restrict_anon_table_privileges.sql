-- Tulika Boutique: remove unnecessary direct table privileges from anon.
-- Preserves public reads, public pending-review submissions, authenticated
-- admin access, RLS policies, and public reads from the product-images bucket.

BEGIN;

REVOKE ALL PRIVILEGES ON TABLE
  public.admins,
  public.categories,
  public.products,
  public.reviews,
  public.settings
FROM anon;

GRANT SELECT ON TABLE
  public.categories,
  public.products,
  public.reviews,
  public.settings
TO anon;

GRANT INSERT ON TABLE public.reviews TO anon;

REVOKE ALL PRIVILEGES ON TABLE storage.objects FROM anon;
GRANT SELECT ON TABLE storage.objects TO anon;

COMMIT;
