-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Idempotent Migration: Add Customization JSONB Column to public.settings
-- ==============================================================================

-- 1. Add customization JSONB column if it doesn't already exist
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS customization JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Keep public settings reads independent of admin authorization checks.
-- Admin writes still require an authenticated account approved by is_admin().
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
  ON public.settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.settings;
CREATE POLICY "Admins can insert settings"
  ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete settings"
  ON public.settings FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. Ensure product-images storage bucket permits SVG logos alongside JPG, PNG, WebP
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id = 'product-images';
