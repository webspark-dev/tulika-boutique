-- ==============================================================================
-- Tulika Boutique / তূলিকা বুটিক
-- Seed Data: Categories, Products (with inline SVG images), Reviews & Settings
-- Free tier: Zero external requests, zero paid CDN.
-- ==============================================================================

-- 1. Insert Initial Settings
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
  '919876543210', -- REPLACE THIS (Shop WhatsApp number, digits only)
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

-- 2. Insert Categories (Deterministic UUIDs for stable foreign key linking)
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

-- 3. Insert Products (with self-contained SVG data URIs, Bengali copy, prices in INR)
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
  -- Product 1: Jamdani Saree
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%235A1B33"/><stop offset="100%" stop-color="%238C2647"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g1)"/><path d="M40 80 Q200 40 360 80 L360 320 Q200 360 40 320 Z" fill="none" stroke="%23E3A02B" stroke-width="3" opacity="0.4"/><circle cx="200" cy="180" r="70" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">ঢাকাই জামদানি</text><text x="200" y="225" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Pure Handloom Cotton</text></svg>'
  ),

  -- Product 2: Bishnupuri Silk Saree
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23381020"/><stop offset="100%" stop-color="%23681530"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g2)"/><rect x="50" y="50" width="300" height="300" rx="8" fill="none" stroke="%23E3A02B" stroke-dasharray="8 6" stroke-width="2"/><circle cx="200" cy="175" r="60" fill="%23E3A02B" opacity="0.15"/><text x="200" y="180" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">বিষ্ণুপুরী সিল্ক</text><text x="200" y="215" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Pure Katan Silk</text></svg>'
  ),

  -- Product 3: Linen Saree (Sold out demo)
  (
    'a1000000-0000-0000-0000-000000000003',
    'হাতে আঁকা সুতির লিনেন শাড়ি',
    'Hand-Painted Pure Linen Saree',
    'নরম লিনেন কাপড়ে শিল্পীর নিপুণ হাতে আঁকা মধুবনী নকশা ও প্রাকৃতিক রঙের ছোঁয়া।',
    'Organic linen saree featuring hand-painted traditional floral strokes in eco-friendly mineral dyes.',
    3150.00,
    'c1000000-0000-0000-0000-000000000001',
    'sold_out', -- Sold out test case
    false,
    false,
    true,
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E3B30"/><stop offset="100%" stop-color="%232D5948"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g3)"/><polygon points="200,60 340,320 60,320" fill="none" stroke="%23E3A02B" stroke-width="2" opacity="0.3"/><text x="200" y="195" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">হাতে আঁকা লিনেন</text><text x="200" y="230" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Organic Linen Art</text></svg>'
  ),

  -- Product 4: Chanderi Anarkali Kurti
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236B4226"/><stop offset="100%" stop-color="%239E6238"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g4)"/><circle cx="200" cy="180" r="80" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">চান্দেরি আনারকলি</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Chanderi Kurti Set</text></svg>'
  ),

  -- Product 5: Kantha Stitch Kurti
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E2B3E"/><stop offset="100%" stop-color="%232E4360"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g5)"/><rect x="60" y="60" width="280" height="280" rx="12" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">কাঁথা স্টিচ কুর্তি</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Khadi Handcraft</text></svg>'
  ),

  -- Product 6: Tussar Dupatta
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23533827"/><stop offset="100%" stop-color="%237D563E"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g6)"/><ellipse cx="200" cy="180" rx="110" ry="70" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">তসর সিল্ক ওড়না</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Wild Tussar Dupatta</text></svg>'
  ),

  -- Product 7: Dokra Necklace Set
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234A3525"/><stop offset="100%" stop-color="%236E4F37"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g7)"/><circle cx="200" cy="150" r="45" fill="%23E3A02B" opacity="0.3"/><path d="M140 230 C 140 300, 260 300, 260 230" fill="none" stroke="%23E3A02B" stroke-width="4"/><text x="200" y="155" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">ডোকরা গহনা সেট</text><text x="200" y="190" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Dokra Art Jewellery</text></svg>'
  ),

  -- Product 8: Clay Terracotta Jhumka
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
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%235C2B14"/><stop offset="100%" stop-color="%23873D1C"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g8)"/><circle cx="200" cy="160" r="50" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="165" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">টেরাকোটা ঝুমকো</text><text x="200" y="200" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Baked Terracotta Craft</text></svg>'
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

-- 4. Insert Verified Customer Reviews
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

