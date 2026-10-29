-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Supabase Database Schema with Strict Row-Level Security (RLS)
-- Free tier compatible: PostgreSQL 15+, Supabase Storage, Supabase Auth
-- ==============================================================================

-- 1. Create updated_at trigger helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCTS TABLE
-- Strict constraints: price >= 0, valid stock_status, names NOT NULL,
-- category_id references categories with ON DELETE RESTRICT
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_bn TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'sold_out')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT DEFAULT '',
  fabric_type TEXT NOT NULL DEFAULT 'Pure Handloom',
  available_sizes TEXT[] NOT NULL DEFAULT '{"Free Size"}',
  sku_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Luxury Fashion E-Commerce Attributes Migration (Safe idempotent addition)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fabric_type TEXT NOT NULL DEFAULT 'Pure Handloom',
  ADD COLUMN IF NOT EXISTS available_sizes TEXT[] NOT NULL DEFAULT '{"Free Size"}',
  ADD COLUMN IF NOT EXISTS sku_code TEXT DEFAULT '';

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_visible ON public.products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products(stock_status);

-- Trigger for auto-updating updated_at on products
DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment_bn TEXT NOT NULL,
  comment_en TEXT DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SETTINGS TABLE (Single row, id = 1)
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY CHECK (id = 1),
  store_name_bn TEXT NOT NULL DEFAULT 'তূলিকা',
  store_name_en TEXT NOT NULL DEFAULT 'Tulika Boutique',
  tagline_bn TEXT NOT NULL DEFAULT 'ঐতিহ্য, শিল্প ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন',
  tagline_en TEXT NOT NULL DEFAULT 'A graceful blend of heritage, craft and modern elegance',
  about_bn TEXT NOT NULL DEFAULT 'তূলিকা একটি বিশ্বস্ত বুটিক যেখানে প্রতিটি শাড়ি ও পোশাক শৈল্পিক যত্ন এবং খাঁটি সুতো দিয়ে তৈরি করা হয়। আমাদের লক্ষ্য বাংলার সমৃদ্ধ বয়ন ঐতিহ্য ও আধুনিক ফ্যাশনের মেলবন্ধন ঘটিয়ে আপনার ব্যক্তিত্বকে অনন্য করে তোলা।',
  about_en TEXT NOT NULL DEFAULT 'Tulika is a bespoke boutique where every saree and outfit is crafted with artistic passion and pure fabrics. We celebrate Bengal''s rich weaving legacy alongside contemporary grace to make your style truly timeless.',
  phone TEXT NOT NULL DEFAULT '+91 98765 43210',
  whatsapp TEXT NOT NULL DEFAULT '919876543210',
  address_bn TEXT NOT NULL DEFAULT '১২, শ্যামাপ্রসাদ মুখার্জি রোড, ভবানীপুর, কলকাতা ৭০০০২৫',
  address_en TEXT NOT NULL DEFAULT '12, Shyama Prasad Mukherjee Road, Bhowanipore, Kolkata 700025',
  hours_bn TEXT NOT NULL DEFAULT 'সোম - শনি: সকাল ১১টা থেকে রাত ৮টা (রবিবার বন্ধ)',
  hours_en TEXT NOT NULL DEFAULT 'Mon - Sat: 11:00 AM to 8:00 PM (Sunday Closed)',
  customization JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column addition for existing databases
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS customization JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Trigger for settings updated_at
DROP TRIGGER IF EXISTS tr_settings_updated_at ON public.settings;
CREATE TRIGGER tr_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. ADMINS TABLE
-- Gated admin authorization: user must exist in auth.users AND have a row in admins
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- SECURITY DEFINER HELPER: is_admin()
-- Checks if currently authenticated user is registered in public.admins
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict enforcement: public users are read-only for visible items.
-- Anonymous access cannot read admins table or modify any table.
-- Only verified admins can perform INSERT, UPDATE, DELETE.
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Products policies
DROP POLICY IF EXISTS "Public can view visible products" ON public.products;
CREATE POLICY "Public can view visible products"
  ON public.products FOR SELECT
  USING (is_visible = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reviews policies
DROP POLICY IF EXISTS "Public can view visible reviews" ON public.reviews;
CREATE POLICY "Public can view visible reviews"
  ON public.reviews FOR SELECT
  USING (is_visible = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Settings policies
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
  ON public.settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins table policies (NO anonymous SELECT allowed!)
-- Non-recursive policy architecture:
-- For SELECT: Directly match auth.uid() = user_id without calling is_admin() to prevent infinite recursion
DROP POLICY IF EXISTS "Authenticated can check admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated user to read own admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

CREATE POLICY "Allow authenticated user to read own admin row"
  ON public.admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Separate write policies (INSERT, UPDATE, DELETE) so is_admin() is NEVER evaluated during a SELECT on admins
CREATE POLICY "Admins can insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admins"
  ON public.admins FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKET: product-images
-- Public read, Admin-only upload/modify/delete. Max 5MB, jpeg/png/webp.
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Storage RLS policies
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

