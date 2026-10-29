-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Safe & Idempotent Migration: Update Demo Product Image Paths in Supabase
-- Preserves all other customer, product and order records in the database.
-- Run this in the Supabase SQL Editor if you wish to synchronize database rows.
-- ==============================================================================

UPDATE public.products
SET image_url = 'assets/images/products/jamdani-saree.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000001'
   OR (name_en ILIKE '%Jamdani%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/bishnupuri-silk.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000002'
   OR (name_en ILIKE '%Bishnupuri%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/linen-saree.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000003'
   OR (name_en ILIKE '%Linen%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/chanderi-anarkali.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000004'
   OR (name_en ILIKE '%Chanderi%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/kantha-kurti.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000005'
   OR (name_en ILIKE '%Kantha%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/tussar-dupatta.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000006'
   OR (name_en ILIKE '%Tussar%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/dokra-necklace.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000007'
   OR (name_en ILIKE '%Dokra%' AND image_url LIKE 'data:image/svg%');

UPDATE public.products
SET image_url = 'assets/images/products/terracotta-jhumka.jpg'
WHERE id = 'a1000000-0000-0000-0000-000000000008'
   OR (name_en ILIKE '%Terracotta%' AND image_url LIKE 'data:image/svg%');

