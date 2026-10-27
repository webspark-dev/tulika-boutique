// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Data Access Layer (js/store.js)
// Real Supabase backend with resilient mock fallback for placeholder setup
// ==============================================================================

import { getSupabase, isConfigured } from './supabase.js';
import { WHATSAPP_PLACEHOLDER, SUPABASE_URL } from './config.js';

// Fallback seed data used ONLY when running with placeholder credentials
const FALLBACK_SETTINGS = {
  id: 1,
  store_name_bn: 'তূলিকা',
  store_name_en: 'Tulika Boutique',
  tagline_bn: 'ঐতিহ্য, শিল্প ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন',
  tagline_en: 'A graceful blend of heritage, craft and modern elegance',
  about_bn: 'তূলিকা একটি বিশ্বস্ত বুটিক যেখানে প্রতিটি শাড়ি ও পোশাক শৈল্পিক যত্ন এবং খাঁটি সুতো দিয়ে তৈরি করা হয়। আমাদের লক্ষ্য বাংলার সমৃদ্ধ বয়ন ঐতিহ্য ও আধুনিক ফ্যাশনের মেলবন্ধন ঘটিয়ে আপনার ব্যক্তিত্বকে অনন্য করে তোলা।',
  about_en: 'Tulika is a bespoke boutique where every saree and outfit is crafted with artistic passion and pure fabrics. We celebrate Bengal''s rich weaving legacy alongside contemporary grace to make your style truly timeless.',
  phone: '+91 98765 43210',
  whatsapp: WHATSAPP_PLACEHOLDER || '919876543210',
  address_bn: '১২, শ্যামাপ্রসাদ মুখার্জি রোড, ভবানীপুর, কলকাতা ৭০০০২৫',
  address_en: '12, Shyama Prasad Mukherjee Road, Bhowanipore, Kolkata 700025',
  hours_bn: 'সোম - শনি: সকাল ১১টা থেকে রাত ৮টা (রবিবার বন্ধ)',
  hours_en: 'Mon - Sat: 11:00 AM to 8:00 PM (Sunday Closed)'
};

const FALLBACK_CATEGORIES = [
  { id: 'c1000000-0000-0000-0000-000000000001', slug: 'sarees', name_bn: 'শাড়ি', name_en: 'Sarees', sort_order: 1 },
  { id: 'c1000000-0000-0000-0000-000000000002', slug: 'kurtis', name_bn: 'কুর্তি ও সালোয়ার', name_en: 'Kurtis & Salwar', sort_order: 2 },
  { id: 'c1000000-0000-0000-0000-000000000003', slug: 'dupattas', name_bn: 'হস্তশিল্প ওড়না', name_en: 'Handcrafted Dupattas', sort_order: 3 },
  { id: 'c1000000-0000-0000-0000-000000000004', slug: 'jewellery', name_bn: 'গহনা ও আনুষঙ্গিক', name_en: 'Jewellery & Accessories', sort_order: 4 }
];

const FALLBACK_PRODUCTS = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    name_bn: 'হাতে বোনা ঢাকাই জামদানি শাড়ি',
    name_en: 'Handwoven Dhakai Jamdani Saree',
    description_bn: 'খাঁটি নরম তুলো এবং রুপোলি জরি সুতোয় বোনা ঐতিহ্যবাহী ময়ূরপঙ্খী নকশা। যেকোনো উৎসব ও বিশেষ অনুষ্ঠানের জন্য অতুলনীয়।',
    description_en: 'Authentic soft cotton Dhakai Jamdani with exquisite silver zari peacock motifs, crafted by master artisans.',
    price: 4250.00,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    stock_status: 'in_stock',
    is_featured: true,
    is_new: true,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%235A1B33"/><stop offset="100%" stop-color="%238C2647"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g1)"/><path d="M40 80 Q200 40 360 80 L360 320 Q200 360 40 320 Z" fill="none" stroke="%23E3A02B" stroke-width="3" opacity="0.4"/><circle cx="200" cy="180" r="70" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">ঢাকাই জামদানি</text><text x="200" y="225" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Pure Handloom Cotton</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000002',
    name_bn: 'বিষ্ণুপুরী কাতান সিল্ক শাড়ি',
    name_en: 'Bishnupuri Katan Silk Saree',
    description_bn: 'গাঢ় মেরুন রঙের উপর খাঁটি তসর সিল্কের জরি কাজ এবং মিনাকারি আঁচল। সিল্ক মার্ক প্রত্যয়িত।',
    description_en: 'Deep maroon pure Bishnupuri silk with rich minakari border and zari woven pallu. Silk Mark certified.',
    price: 6800.00,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    stock_status: 'in_stock',
    is_featured: true,
    is_new: false,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23381020"/><stop offset="100%" stop-color="%23681530"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g2)"/><rect x="50" y="50" width="300" height="300" rx="8" fill="none" stroke="%23E3A02B" stroke-dasharray="8 6" stroke-width="2"/><circle cx="200" cy="175" r="60" fill="%23E3A02B" opacity="0.15"/><text x="200" y="180" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">বিষ্ণুপুরী সিল্ক</text><text x="200" y="215" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Pure Katan Silk</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000003',
    name_bn: 'হাতে আঁকা সুতির লিনেন শাড়ি',
    name_en: 'Hand-Painted Pure Linen Saree',
    description_bn: 'নরম লিনেন কাপড়ে শিল্পীর নিপুণ হাতে আঁকা মধুবনী নকশা ও প্রাকৃতিক রঙের ছোঁয়া।',
    description_en: 'Organic linen saree featuring hand-painted traditional floral strokes in eco-friendly mineral dyes.',
    price: 3150.00,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    stock_status: 'sold_out',
    is_featured: false,
    is_new: false,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E3B30"/><stop offset="100%" stop-color="%232D5948"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g3)"/><polygon points="200,60 340,320 60,320" fill="none" stroke="%23E3A02B" stroke-width="2" opacity="0.3"/><text x="200" y="195" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">হাতে আঁকা লিনেন</text><text x="200" y="230" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Organic Linen Art</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000004',
    name_bn: 'চান্দেরি কটন আনারকলি কুর্তি',
    name_en: 'Chanderi Cotton Anarkali Kurti',
    description_bn: 'হালকা হলুদ চান্দেরি কটন কাপড়ের ওপর সূক্ষ্ম সুতোর কাজ ও জরি এমব্রয়ডারি। সাথে মানানসই ওড়না।',
    description_en: 'Pastel yellow flared Chanderi Anarkali kurti adorned with detailed threadwork and zari collar accents.',
    price: 2850.00,
    category_id: 'c1000000-0000-0000-0000-000000000002',
    stock_status: 'in_stock',
    is_featured: true,
    is_new: true,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236B4226"/><stop offset="100%" stop-color="%239E6238"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g4)"/><circle cx="200" cy="180" r="80" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">চান্দেরি আনারকলি</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Chanderi Kurti Set</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000005',
    name_bn: 'খাদি কটনে কাঁথা স্টিচ কুর্তি',
    name_en: 'Khadi Cotton Kantha Stitch Kurti',
    description_bn: 'বাংলার ঐতিহ্যবাহী হস্তশিল্প কাঁথা স্টিচের সুক্ষ্ম কাজ করা খাঁটি খাদি কুর্তি। দৈনন্দিন ও অফিস ব্যবহারের জন্য আরামদায়ক।',
    description_en: 'Pure handspun khadi cotton straight kurti decorated with authentic hand-stitched Kantha geometric motifs.',
    price: 1950.00,
    category_id: 'c1000000-0000-0000-0000-000000000002',
    stock_status: 'in_stock',
    is_featured: false,
    is_new: true,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E2B3E"/><stop offset="100%" stop-color="%232E4360"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g5)"/><rect x="60" y="60" width="280" height="280" rx="12" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">কাঁথা স্টিচ কুর্তি</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Khadi Handcraft</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000006',
    name_bn: 'হস্তশিল্প তসর সিল্ক ওড়না',
    name_en: 'Handcrafted Tussar Silk Dupatta',
    description_bn: 'প্রাকৃতিক সোনালী তসর সিল্কের জমিনে কলমকারি মোটিফ ও কাঁথা স্টিচের রঙিন আঁচল।',
    description_en: 'Natural wild tussar silk stole showcasing kalamkari artwork and hand-embroidered borders.',
    price: 1850.00,
    category_id: 'c1000000-0000-0000-0000-000000000003',
    stock_status: 'in_stock',
    is_featured: true,
    is_new: false,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23533827"/><stop offset="100%" stop-color="%237D563E"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g6)"/><ellipse cx="200" cy="180" rx="110" ry="70" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="185" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">তসর সিল্ক ওড়না</text><text x="200" y="220" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Wild Tussar Dupatta</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000007',
    name_bn: 'হাতে তৈরি ডোকরা নেকলেস ও কানের দুল',
    name_en: 'Handmade Dokra Necklace & Earrings Set',
    description_bn: 'বাঁকুড়ার ঐতিহ্যবাহী প্রাচীন লস্ট-ওয়াক্স পদ্ধতিতে তৈরি ব্রাস ডোকরা গহনা সেট। সুতো বাঁধা অ্যাডজাস্টেবল মালা।',
    description_en: 'Authentic tribal brass Dokra necklace with matching bell-metal earrings, handcrafted in rural Bengal.',
    price: 1200.00,
    category_id: 'c1000000-0000-0000-0000-000000000004',
    stock_status: 'in_stock',
    is_featured: true,
    is_new: true,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234A3525"/><stop offset="100%" stop-color="%236E4F37"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g7)"/><circle cx="200" cy="150" r="45" fill="%23E3A02B" opacity="0.3"/><path d="M140 230 C 140 300, 260 300, 260 230" fill="none" stroke="%23E3A02B" stroke-width="4"/><text x="200" y="155" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">ডোকরা গহনা সেট</text><text x="200" y="190" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Dokra Art Jewellery</text></svg>'
  },
  {
    id: 'p1000000-0000-0000-0000-000000000008',
    name_bn: 'পোড়ামাটির পোড়া টেরাকোটা ঝুমকো',
    name_en: 'Baked Terracotta Artisan Jhumkas',
    description_bn: 'প্রাকৃতিক কাদামাটি আগুনে পুড়িয়ে হাতে রঙ করা পরিবেশবান্ধব ট্র্যাডিশনাল টেরাকোটা কানের দুল।',
    description_en: 'Hand-molded and kiln-fired natural clay terracotta earrings painted with organic earthen pigments.',
    price: 450.00,
    category_id: 'c1000000-0000-0000-0000-000000000004',
    stock_status: 'in_stock',
    is_featured: false,
    is_new: false,
    is_visible: true,
    image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%235C2B14"/><stop offset="100%" stop-color="%23873D1C"/></linearGradient></defs><rect width="400" height="400" rx="16" fill="url(%23g8)"/><circle cx="200" cy="160" r="50" fill="none" stroke="%23E3A02B" stroke-width="2"/><text x="200" y="165" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">টেরাকোটা ঝুমকো</text><text x="200" y="200" fill="%23E3A02B" font-size="14" font-family="sans-serif" text-anchor="middle">Baked Terracotta Craft</text></svg>'
  }
];

const FALLBACK_REVIEWS = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    author_name: 'অনন্যা চ্যাটার্জী (কলকাতা)',
    rating: 5,
    comment_bn: 'ঢাকাই জামদানি শাড়ির গুণমান ও সুতোর বুনন অসাধারণ! হোয়াটসঅ্যাপে অর্ডার করার পরদিনই খুব সুন্দর প্যাকিং সহ ডেলিভারি পেয়েছি।',
    comment_en: 'The weave and drape of the Dhakai Jamdani is exceptional. Prompt WhatsApp response and beautifully packed delivery.',
    is_visible: true
  },
  {
    id: 'r1000000-0000-0000-0000-000000000002',
    author_name: 'শ্রাবণী বসু (সল্টলেক)',
    rating: 5,
    comment_bn: 'বিষ্ণুপুরী সিল্ক শাড়িটির আঁচলের কাজ চোখে পড়ার মতো। খাঁটি সিল্কের ঔজ্জ্বল্য সত্যিই মন ভরিয়ে দিয়েছে। তূলিকাকে অনেক শুভকামনা।',
    comment_en: 'The silk mark Bishnupuri saree is truly authentic. The minakari pallu drew so many compliments at our family gathering!',
    is_visible: true
  },
  {
    id: 'r1000000-0000-0000-0000-000000000003',
    author_name: 'সুস্মিতা সেনগুপ্ত (হাওড়া)',
    rating: 5,
    comment_bn: 'ডোকরা নেকলেস ও টেরাকোটা কানের সেটটি খুব সুন্দর। খাঁটি হস্তশিল্পের এমন সংগ্রহ আজকাল খুব কম পাওয়া যায়।',
    comment_en: 'The handcrafted Dokra piece is pure art. Wonderful customer service on WhatsApp and genuine craftsmanship.',
    is_visible: true
  }
];

// In-memory clones for local session modifications in mock mode
let mockSettings = { ...FALLBACK_SETTINGS };
let mockCategories = [...FALLBACK_CATEGORIES];
let mockProducts = [...FALLBACK_PRODUCTS];
let mockReviews = [...FALLBACK_REVIEWS];

// ==============================================================================
// SETTINGS
// ==============================================================================
export async function getSettings() {
  const sb = getSupabase();
  if (!sb) return mockSettings;

  try {
    const { data, error } = await sb.from('settings').select('*').eq('id', 1).single();
    if (error) {
      console.warn('Could not fetch settings from Supabase, using defaults:', error.message);
      return mockSettings;
    }
    return data || mockSettings;
  } catch (err) {
    console.error('getSettings network error:', err);
    throw new Error('সংযোগ ব্যর্থ — আবার চেষ্টা করুন');
  }
}

export async function updateSettings(fields) {
  const sb = getSupabase();
  if (!sb) {
    mockSettings = { ...mockSettings, ...fields };
    return mockSettings;
  }

  try {
    const { data, error } = await sb
      .from('settings')
      .update(fields)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateSettings error:', err);
    throw err;
  }
}

// ==============================================================================
// CATEGORIES
// ==============================================================================
export async function getCategories() {
  const sb = getSupabase();
  if (!sb) return [...mockCategories].sort((a, b) => a.sort_order - b.sort_order);

  try {
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getCategories error:', err);
    throw new Error('সংযোগ ব্যর্থ — আবার চেষ্টা করুন');
  }
}

export async function createCategory(cat) {
  const sb = getSupabase();
  if (!sb) {
    const newCat = {
      id: 'mock-cat-' + Date.now(),
      sort_order: mockCategories.length + 1,
      ...cat
    };
    mockCategories.push(newCat);
    return newCat;
  }

  try {
    const { data, error } = await sb
      .from('categories')
      .insert([cat])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createCategory error:', err);
    throw err;
  }
}

export async function updateCategory(id, fields) {
  const sb = getSupabase();
  if (!sb) {
    mockCategories = mockCategories.map((c) => (c.id === id ? { ...c, ...fields } : c));
    return mockCategories.find((c) => c.id === id);
  }

  try {
    const { data, error } = await sb
      .from('categories')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateCategory error:', err);
    throw err;
  }
}

export async function deleteCategory(id) {
  const sb = getSupabase();

  // First check if any product references this category
  if (!sb) {
    const hasProducts = mockProducts.some((p) => p.category_id === id);
    if (hasProducts) {
      throw new Error('এই বিভাগে পণ্য রয়েছে — মুছে ফেলা সম্ভব নয়');
    }
    mockCategories = mockCategories.filter((c) => c.id !== id);
    return true;
  }

  try {
    const { count, error: countErr } = await sb
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countErr) throw countErr;
    if (count && count > 0) {
      throw new Error('এই বিভাগে পণ্য রয়েছে — মুছে ফেলা সম্ভব নয়');
    }

    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteCategory error:', err);
    throw err;
  }
}

export async function reorderCategories(orderedIds) {
  const sb = getSupabase();
  if (!sb) {
    orderedIds.forEach((id, index) => {
      const cat = mockCategories.find((c) => c.id === id);
      if (cat) cat.sort_order = index + 1;
    });
    return true;
  }

  try {
    const updates = orderedIds.map((id, index) =>
      sb.from('categories').update({ sort_order: index + 1 }).eq('id', id)
    );
    await Promise.all(updates);
    return true;
  } catch (err) {
    console.error('reorderCategories error:', err);
    throw err;
  }
}

// ==============================================================================
// PRODUCTS
// ==============================================================================
export async function getProducts({
  categoryId = null,
  search = '',
  includeHidden = false,
  page = 1,
  limit = 50
} = {}) {
  const sb = getSupabase();
  if (!sb) {
    let list = [...mockProducts];
    if (!includeHidden) {
      list = list.filter((p) => p.is_visible);
    }
    if (categoryId && categoryId !== 'all') {
      list = list.filter((p) => p.category_id === categoryId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name_bn.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          (p.description_bn && p.description_bn.toLowerCase().includes(q)) ||
          (p.description_en && p.description_en.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);
    return { data: paginated, count: total };
  }

  try {
    let query = sb.from('products').select('*', { count: 'exact' });

    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `name_bn.ilike.${term},name_en.ilike.${term},description_bn.ilike.${term},description_en.ilike.${term}`
      );
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error('getProducts error:', err);
    throw new Error('সংযোগ ব্যর্থ — আবার চেষ্টা করুন');
  }
}

export async function createProduct(productData) {
  const sb = getSupabase();
  if (!sb) {
    const newProd = {
      id: 'mock-prod-' + Date.now(),
      created_at: new Date().toISOString(),
      ...productData
    };
    mockProducts.unshift(newProd);
    return newProd;
  }

  try {
    const { data, error } = await sb
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createProduct error:', err);
    throw err;
  }
}

export async function updateProduct(id, fields) {
  const sb = getSupabase();
  if (!sb) {
    mockProducts = mockProducts.map((p) => (p.id === id ? { ...p, ...fields } : p));
    return mockProducts.find((p) => p.id === id);
  }

  try {
    const { data, error } = await sb
      .from('products')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateProduct error:', err);
    throw err;
  }
}

/**
 * Two-step delete:
 * 1. Remove DB row
 * 2. Delete Storage object (if hosted on Supabase storage)
 * If either step fails, reports exact step failure + retry hint.
 */
export async function deleteProduct(product) {
  const sb = getSupabase();
  const id = typeof product === 'object' ? product.id : product;
  const imageUrl = typeof product === 'object' ? product.image_url : null;

  if (!sb) {
    mockProducts = mockProducts.filter((p) => p.id !== id);
    return true;
  }

  // Step 1: Delete database row
  try {
    const { error: dbError } = await sb.from('products').delete().eq('id', id);
    if (dbError) {
      throw new Error(`ডাটাবেজ থেকে পণ্য মুছতে ব্যর্থ হয়েছে: ${dbError.message} (ধাপ ১ ব্যর্থ)`);
    }
  } catch (err) {
    console.error('deleteProduct step 1 failed:', err);
    throw err;
  }

  // Step 2: Delete storage file if from Supabase bucket
  if (imageUrl && imageUrl.includes('/product-images/')) {
    try {
      const path = extractStoragePath(imageUrl);
      if (path) {
        const { error: storageError } = await sb.storage
          .from('product-images')
          .remove([path]);
        if (storageError) {
          throw new Error(
            `পণ্যটি ডাটাবেজ থেকে মুছে গেছে, তবে স্টোরেজ ছবি মুছতে ব্যর্থ: ${storageError.message} (ধাপ ২ ব্যর্থ)`
          );
        }
      }
    } catch (sErr) {
      console.warn('Storage cleanup failed after DB delete:', sErr);
      throw sErr;
    }
  }

  return true;
}

// ==============================================================================
// IMAGE UPLOAD & RESIZE (Client-side Canvas: max 1200px, JPEG 0.8, EXIF stripped)
// ==============================================================================
export async function processAndUploadImage(file) {
  if (!file) throw new Error('কোনো ফাইল নির্বাচন করা হয়নি');

  // Step A: Client-side resize and EXIF strip via Canvas
  const resizedBlob = await new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1200;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Drawing to canvas naturally discards EXIF orientation & metadata
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('ইমেজ প্রসেসিং ব্যর্থ হয়েছে'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ইমেজ লোড করতে ব্যর্থ হয়েছে'));
    };

    img.src = objectUrl;
  });

  const sb = getSupabase();
  if (!sb) {
    // In mock mode, convert blob to local Data URL for visual preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(resizedBlob);
    });
  }

  // Step B: Upload to Supabase Storage
  try {
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.[^/.]+$/, '');
    const fileName = `prod_${Date.now()}_${safeName || 'photo'}.jpg`;

    const { data, error } = await sb.storage
      .from('product-images')
      .upload(fileName, resizedBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw new Error(`স্টোরেজে ইমেজ আপলোড ব্যর্থ: ${error.message}`);
    }

    const { data: urlData } = sb.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Storage upload error:', err);
    throw err;
  }
}

function extractStoragePath(fullUrl) {
  try {
    const parts = fullUrl.split('/product-images/');
    if (parts.length > 1) {
      return decodeURIComponent(parts[1].split('?')[0]);
    }
  } catch (e) {
    console.warn('Failed to parse storage path from URL:', fullUrl);
  }
  return null;
}

// ==============================================================================
// ORPHAN IMAGES CLEANUP
// ==============================================================================
export async function cleanOrphanImages() {
  const sb = getSupabase();
  if (!sb) {
    return { scanned: 0, removed: 0, orphans: [] };
  }

  try {
    // 1. List objects in bucket
    const { data: files, error: listErr } = await sb.storage
      .from('product-images')
      .list('', { limit: 200 });

    if (listErr) throw listErr;
    if (!files || files.length === 0) {
      return { scanned: 0, removed: 0, orphans: [] };
    }

    // 2. Fetch all image URLs from products
    const { data: products, error: prodErr } = await sb
      .from('products')
      .select('image_url');

    if (prodErr) throw prodErr;

    const referencedPaths = new Set();
    products.forEach((p) => {
      if (p.image_url) {
        const path = extractStoragePath(p.image_url);
        if (path) referencedPaths.add(path);
      }
    });

    // 3. Find files not referenced
    const orphanPaths = files
      .map((f) => f.name)
      .filter((name) => name && !referencedPaths.has(name) && !name.startsWith('.'));

    if (orphanPaths.length === 0) {
      return { scanned: files.length, removed: 0, orphans: [] };
    }

    // 4. Delete orphan files
    const { error: removeErr } = await sb.storage
      .from('product-images')
      .remove(orphanPaths);

    if (removeErr) throw removeErr;

    return {
      scanned: files.length,
      removed: orphanPaths.length,
      orphans: orphanPaths
    };
  } catch (err) {
    console.error('cleanOrphanImages error:', err);
    throw err;
  }
}

// ==============================================================================
// REVIEWS
// ==============================================================================
export async function getReviews({ includeHidden = false } = {}) {
  const sb = getSupabase();
  if (!sb) {
    return includeHidden ? mockReviews : mockReviews.filter((r) => r.is_visible);
  }

  try {
    let query = sb
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getReviews error:', err);
    throw new Error('সংযোগ ব্যর্থ — আবার চেষ্টা করুন');
  }
}

export async function createReview(reviewData) {
  const sb = getSupabase();
  if (!sb) {
    const newRev = {
      id: 'mock-rev-' + Date.now(),
      created_at: new Date().toISOString(),
      ...reviewData
    };
    mockReviews.unshift(newRev);
    return newRev;
  }

  try {
    const { data, error } = await sb
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createReview error:', err);
    throw err;
  }
}

export async function updateReview(id, fields) {
  const sb = getSupabase();
  if (!sb) {
    mockReviews = mockReviews.map((r) => (r.id === id ? { ...r, ...fields } : r));
    return mockReviews.find((r) => r.id === id);
  }

  try {
    const { data, error } = await sb
      .from('reviews')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateReview error:', err);
    throw err;
  }
}

export async function deleteReview(id) {
  const sb = getSupabase();
  if (!sb) {
    mockReviews = mockReviews.filter((r) => r.id !== id);
    return true;
  }

  try {
    const { error } = await sb.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteReview error:', err);
    throw err;
  }
}

// ==============================================================================
// AUTHENTICATION & ADMIN VERIFICATION
// ==============================================================================
export async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Supabase কনফিগারেশন করা হয়নি। অনুগ্রহ করে js/config.js আপডেট করুন।');
  }

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return true;
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

/**
 * Validates whether the authenticated user has a registered row in public.admins
 */
export async function checkIsAdmin(user) {
  if (!user || !user.id) return false;
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data, error } = await sb
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Admin check error:', error.message);
      return false;
    }

    return Boolean(data && data.user_id === user.id);
  } catch (err) {
    console.error('checkIsAdmin error:', err);
    return false;
  }
}

