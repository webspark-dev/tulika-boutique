-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- File: 02_seed_and_authorize.sql
-- Description: Idempotent Seed Data & Admin Authorization Script
-- Safe to run multiple times: uses ON CONFLICT DO UPDATE / DO NOTHING.
-- Does NOT drop tables, does NOT delete existing rows, and preserves RLS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORE SETTINGS
-- ------------------------------------------------------------------------------
INSERT INTO public.settings (
  id,
  store_name_bn,
  store_name_en,
  tagline_bn,
  tagline_en,
  about_bn,
  about_en,
  phone,
  whatsapp,
  address_bn,
  address_en,
  hours_bn,
  hours_en
)
VALUES (
  1,
  'তূলিকা',
  'Tulika Boutique',
  'ঐতিহ্য, শিল্প ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন',
  'A graceful blend of heritage, craft and modern elegance',
  'তূলিকা একটি বিশ্বস্ত বুটিক যেখানে প্রতিটি শাড়ি ও পোশাক শৈল্পিক যত্ন এবং খাঁটি সুতো দিয়ে তৈরি করা হয়। আমাদের লক্ষ্য বাংলার সমৃদ্ধ বয়ন ঐতিহ্য ও আধুনিক ফ্যাশনের মেলবন্ধন ঘটিয়ে আপনার ব্যক্তিত্বকে অনন্য করে তোলা।',
  'Tulika is a bespoke boutique where every saree and outfit is crafted with artistic passion and pure fabrics. We celebrate Bengal''s rich weaving legacy alongside contemporary grace to make your style truly timeless.',
  '+91 98765 43210',
  '919876543210',
  '১২, শ্যামাপ্রসাদ মুখার্জি রোড, ভবানীপুর, কলকাতা ৭০০০২৫',
  '12, Shyama Prasad Mukherjee Road, Bhowanipore, Kolkata 700025',
  'সোম - শনি: সকাল ১১টা থেকে রাত ৮টা (রবিবার বন্ধ)',
  'Mon - Sat: 11:00 AM to 8:00 PM (Sunday Closed)'
)
ON CONFLICT (id) DO UPDATE SET
  store_name_bn = EXCLUDED.store_name_bn,
  store_name_en = EXCLUDED.store_name_en,
  tagline_bn = EXCLUDED.tagline_bn,
  tagline_en = EXCLUDED.tagline_en,
  about_bn = EXCLUDED.about_bn,
  about_en = EXCLUDED.about_en,
  phone = EXCLUDED.phone,
  whatsapp = EXCLUDED.whatsapp,
  address_bn = EXCLUDED.address_bn,
  address_en = EXCLUDED.address_en,
  hours_bn = EXCLUDED.hours_bn,
  hours_en = EXCLUDED.hours_en;


-- ------------------------------------------------------------------------------
-- 2. PRODUCT CATEGORIES (Deterministic UUIDs for stable foreign keys)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name_bn, name_en, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'sarees', 'শাড়ি', 'Sarees', 1),
  ('c1000000-0000-0000-0000-000000000002', 'kurtis', 'কুর্তি ও সালোয়ার', 'Kurtis & Salwar', 2),
  ('c1000000-0000-0000-0000-000000000003', 'dupattas', 'হস্তশিল্প ওড়না', 'Handcrafted Dupattas', 3),
  ('c1000000-0000-0000-0000-000000000004', 'jewellery', 'গহনা ও আনুষঙ্গিক', 'Jewellery & Accessories', 4)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name_bn = EXCLUDED.name_bn,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order;


-- ------------------------------------------------------------------------------
-- 3. PRODUCTS (8 Signature Boutique Products linked to Categories)
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
  id,
  name_bn,
  name_en,
  description_bn,
  description_en,
  price,
  category_id,
  stock_status,
  is_featured,
  is_new,
  is_visible,
  image_url
)
VALUES
  -- 1. Jamdani Saree
  (
    'a1000000-0000-0000-0000-000000000001',
    'হাতে বোনা ঢাকাই জামদানি শাড়ি',
    'Handwoven Dhakai Jamdani Saree',
    'খাঁটি নরম তুলো এবং রুপোলি জরি সুতোয় বোনা ঐতিহ্যবাহী ময়ূরপঙ্খী নকশা। যেকোনো উৎসব ও বিশেষ অনুষ্ঠানের জন্য অতুলনীয়।',
    'Authentic soft cotton Dhakai Jamdani with exquisite silver zari peacock motifs, crafted by master artisans.',
    4250.00,
    'c1000000-0000-0000-0000-000000000001',
    'in_stock',
    true,
    true,
    true,
    'assets/images/products/jamdani-saree.jpg'
  ),
  -- 2. Bishnupuri Silk Saree
  (
    'a1000000-0000-0000-0000-000000000002',
    'বিষ্ণুপুরী কাতান সিল্ক শাড়ি',
    'Bishnupuri Katan Silk Saree',
    'গাঢ় মেরুন রঙের উপর খাঁটি তসর সিল্কের জরি কাজ এবং মিনাকারি আঁচল। সিল্ক মার্ক প্রত্যয়িত।',
    'Deep maroon pure Bishnupuri silk with rich minakari border and zari woven pallu. Silk Mark certified.',
    6800.00,
    'c1000000-0000-0000-0000-000000000001',
    'in_stock',
    true,
    false,
    true,
    'assets/images/products/bishnupuri-silk.jpg'
  ),
  -- 3. Linen Saree
  (
    'a1000000-0000-0000-0000-000000000003',
    'হাতে আঁকা সুতির লিনেন শাড়ি',
    'Hand-Painted Pure Linen Saree',
    'নরম লিনেন কাপড়ে শিল্পীর নিপুণ হাতে আঁকা মধুবনী নকশা ও প্রাকৃতিক রঙের ছোঁয়া।',
    'Organic linen saree featuring hand-painted traditional floral strokes in eco-friendly mineral dyes.',
    3150.00,
    'c1000000-0000-0000-0000-000000000001',
    'sold_out',
    false,
    false,
    true,
    'assets/images/products/linen-saree.jpg'
  ),
  -- 4. Chanderi Anarkali Kurti
  (
    'a1000000-0000-0000-0000-000000000004',
    'চান্দেরি কটন আনারকলি কুর্তি',
    'Chanderi Cotton Anarkali Kurti',
    'হালকা হলুদ চান্দেরি কটন কাপড়ের ওপর সূক্ষ্ম সুতোর কাজ ও জরি এমব্রয়ডারি। সাথে মানানসই ওড়না।',
    'Pastel yellow flared Chanderi Anarkali kurti adorned with detailed threadwork and zari collar accents.',
    2850.00,
    'c1000000-0000-0000-0000-000000000002',
    'in_stock',
    true,
    true,
    true,
    'assets/images/products/chanderi-anarkali.jpg'
  ),
  -- 5. Kantha Stitch Kurti
  (
    'a1000000-0000-0000-0000-000000000005',
    'খাদি কটনে কাঁথা স্টিচ কুর্তি',
    'Khadi Cotton Kantha Stitch Kurti',
    'বাংলার ঐতিহ্যবাহী হস্তশিল্প কাঁথা স্টিচের সুক্ষ্ম কাজ করা খাঁটি খাদি কুর্তি। দৈনন্দিন ও অফিস ব্যবহারের জন্য আরামদায়ক।',
    'Pure handspun khadi cotton straight kurti decorated with authentic hand-stitched Kantha geometric motifs.',
    1950.00,
    'c1000000-0000-0000-0000-000000000002',
    'in_stock',
    false,
    true,
    true,
    'assets/images/products/kantha-kurti.jpg'
  ),
  -- 6. Tussar Dupatta
  (
    'a1000000-0000-0000-0000-000000000006',
    'হস্তশিল্প তসর সিল্ক ওড়না',
    'Handcrafted Tussar Silk Dupatta',
    'প্রাকৃতিক সোনালী তসর সিল্কের জমিনে কলমকারি মোটিফ ও কাঁথা স্টিচের রঙিন আঁচল।',
    'Natural wild tussar silk stole showcasing kalamkari artwork and hand-embroidered borders.',
    1850.00,
    'c1000000-0000-0000-0000-000000000003',
    'in_stock',
    true,
    false,
    true,
    'assets/images/products/tussar-dupatta.jpg'
  ),
  -- 7. Dokra Necklace Set
  (
    'a1000000-0000-0000-0000-000000000007',
    'হাতে তৈরি ডোকরা নেকলেস ও কানের দুল',
    'Handmade Dokra Necklace & Earrings Set',
    'বাঁকুড়ার ঐতিহ্যবাহী প্রাচীন লস্ট-ওয়াক্স পদ্ধতিতে তৈরি ব্রাস ডোকরা গহনা সেট। সুতো বাঁধা অ্যাডজাস্টেবল মালা।',
    'Authentic tribal brass Dokra necklace with matching bell-metal earrings, handcrafted in rural Bengal.',
    1200.00,
    'c1000000-0000-0000-0000-000000000004',
    'in_stock',
    true,
    true,
    true,
    'assets/images/products/dokra-necklace.jpg'
  ),
  -- 8. Clay Terracotta Jhumka
  (
    'a1000000-0000-0000-0000-000000000008',
    'পোড়ামাটির পোড়া টেরাকোটা ঝুমকো',
    'Baked Terracotta Artisan Jhumkas',
    'প্রাকৃতিক কাদামাটি আগুনে পুড়িয়ে হাতে রঙ করা পরিবেশবান্ধব ট্র্যাডিশনাল টেরাকোটা কানের দুল।',
    'Hand-molded and kiln-fired natural clay terracotta earrings painted with organic earthen pigments.',
    450.00,
    'c1000000-0000-0000-0000-000000000004',
    'in_stock',
    false,
    false,
    true,
    'assets/images/products/terracotta-jhumka.jpg'
  )
ON CONFLICT (id) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  name_en = EXCLUDED.name_en,
  description_bn = EXCLUDED.description_bn,
  description_en = EXCLUDED.description_en,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  stock_status = EXCLUDED.stock_status,
  is_featured = EXCLUDED.is_featured,
  is_new = EXCLUDED.is_new,
  is_visible = EXCLUDED.is_visible,
  image_url = EXCLUDED.image_url;


-- ------------------------------------------------------------------------------
-- 4. VERIFIED CUSTOMER REVIEWS
-- ------------------------------------------------------------------------------
INSERT INTO public.reviews (
  id,
  author_name,
  rating,
  comment_bn,
  comment_en,
  is_visible
)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'অনন্যা চ্যাটার্জী (কলকাতা)',
    5,
    'ঢাকাই জামদানি শাড়ির গুণমান ও সুতোর বুনন অসাধারণ! হোয়াটসঅ্যাপে অর্ডার করার পরদিনই খুব সুন্দর প্যাকিং সহ ডেলিভারি পেয়েছি।',
    'The weave and drape of the Dhakai Jamdani is exceptional. Prompt WhatsApp response and beautifully packed delivery.',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'শ্রাবণী বসু (সল্টলেক)',
    5,
    'বিষ্ণুপুরী সিল্ক শাড়িটির আঁচলের কাজ চোখে পড়ার মতো। খাঁটি সিল্কের ঔজ্জ্বল্য সত্যিই মন ভরিয়ে দিয়েছে। তূলিকাকে অনেক শুভকামনা।',
    'The silk mark Bishnupuri saree is truly authentic. The minakari pallu drew so many compliments at our family gathering!',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'সুস্মিতা সেনগুপ্ত (হাওড়া)',
    5,
    'ডোকরা নেকলেস ও টেরাকোটা কানের সেটটি খুব সুন্দর। খাঁটি হস্তশিল্পের এমন সংগ্রহ আজকাল খুব কম পাওয়া যায়।',
    'The handcrafted Dokra piece is pure art. Wonderful customer service on WhatsApp and genuine craftsmanship.',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  author_name = EXCLUDED.author_name,
  rating = EXCLUDED.rating,
  comment_bn = EXCLUDED.comment_bn,
  comment_en = EXCLUDED.comment_en,
  is_visible = EXCLUDED.is_visible;


-- ------------------------------------------------------------------------------
-- 5. ADMIN AUTHORIZATION (palasdas0708@gmail.com)
-- ------------------------------------------------------------------------------
-- Grants admin authorization in public.admins by matching the user's Supabase Auth email.
-- Note: User account palasdas0708@gmail.com must first exist in Supabase Auth (Authentication > Users).
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users
WHERE email = 'palasdas0708@gmail.com'
ON CONFLICT (user_id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 6. VERIFICATION QUERIES (READ-ONLY)
-- ------------------------------------------------------------------------------
SELECT 'categories' AS table_name, count(*) AS row_count FROM public.categories
UNION ALL
SELECT 'products', count(*) FROM public.products
UNION ALL
SELECT 'settings', count(*) FROM public.settings
UNION ALL
SELECT 'reviews', count(*) FROM public.reviews
UNION ALL
SELECT 'admins', count(*) FROM public.admins;

-- Show authorized admin detail:
SELECT 
  a.user_id,
  u.email,
  u.created_at AS user_registered_at,
  a.created_at AS admin_granted_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;

