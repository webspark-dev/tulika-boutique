-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Idempotent Migration: Add Customization JSONB Column to public.settings
-- ==============================================================================

-- 1. Add customization JSONB column if it doesn't already exist
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS customization JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Ensure Row-Level Security allows public to read and admins to update
-- (Public can read settings for storefront display, only authenticated admins can update)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'settings' AND policyname = 'Public can view settings'
  ) THEN
    CREATE POLICY "Public can view settings" ON public.settings
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'settings' AND policyname = 'Admins can manage settings'
  ) THEN
    CREATE POLICY "Admins can manage settings" ON public.settings
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 3. Ensure product-images storage bucket permits SVG logos alongside JPG, PNG, WebP
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id = 'product-images';

