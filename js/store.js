// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Data Access Layer (js/store.js)
// Real Supabase backend with resilient mock fallback for placeholder setup
// ==============================================================================

import { getSupabase, isConfigured } from './supabase.js';
import { WHATSAPP_PLACEHOLDER, SUPABASE_URL } from './config.js';
import { getCurrentLang, t } from './i18n.js';

// Local photo map for the 8 signature boutique products
export const PRODUCT_PHOTO_MAP = {
  'a1000000-0000-0000-0000-000000000001': 'assets/images/products/jamdani-saree.jpg',
  'a1000000-0000-0000-0000-000000000002': 'assets/images/products/bishnupuri-silk.jpg',
  'a1000000-0000-0000-0000-000000000003': 'assets/images/products/linen-saree.jpg',
  'a1000000-0000-0000-0000-000000000004': 'assets/images/products/chanderi-anarkali.jpg',
  'a1000000-0000-0000-0000-000000000005': 'assets/images/products/kantha-kurti.jpg',
  'a1000000-0000-0000-0000-000000000006': 'assets/images/products/tussar-dupatta.jpg',
  'a1000000-0000-0000-0000-000000000007': 'assets/images/products/dokra-necklace.jpg',
  'a1000000-0000-0000-0000-000000000008': 'assets/images/products/terracotta-jhumka.jpg',
  'p1000000-0000-0000-0000-000000000001': 'assets/images/products/jamdani-saree.jpg',
  'p1000000-0000-0000-0000-000000000002': 'assets/images/products/bishnupuri-silk.jpg',
  'p1000000-0000-0000-0000-000000000003': 'assets/images/products/linen-saree.jpg',
  'p1000000-0000-0000-0000-000000000004': 'assets/images/products/chanderi-anarkali.jpg',
  'p1000000-0000-0000-0000-000000000005': 'assets/images/products/kantha-kurti.jpg',
  'p1000000-0000-0000-0000-000000000006': 'assets/images/products/tussar-dupatta.jpg',
  'p1000000-0000-0000-0000-000000000007': 'assets/images/products/dokra-necklace.jpg',
  'p1000000-0000-0000-0000-000000000008': 'assets/images/products/terracotta-jhumka.jpg'
};

export function normalizeProduct(p) {
  if (!p) return p;
  let updated = { ...p };

  // Check if image is an uploaded Supabase Storage URL
  const hasUploadedStorageImage =
    typeof updated.image_url === 'string' &&
    updated.image_url.includes('/storage/v1/object/public/product-images/');

  // For the 8 signature demo products, always use the real verified on-disk photo
  // unless an admin explicitly uploaded a custom image to Supabase Storage
  if (PRODUCT_PHOTO_MAP[updated.id] && !hasUploadedStorageImage) {
    updated.image_url = PRODUCT_PHOTO_MAP[updated.id];
  } else if (!hasUploadedStorageImage) {
    let img = (updated.image_url || '').trim();
    // Normalize leading slash: "/assets/..." -> "assets/..."
    if (img.startsWith('/assets/images/products/')) {
      img = img.slice(1);
    }
    const isSvg = img.startsWith('data:image/svg');
    const isPlaceholder = img.includes('placeholder') || img.includes('placehold.co') || !img;

    if (isSvg || isPlaceholder) {
      const title = `${updated.name_en || ''} ${updated.name_bn || ''}`.toLowerCase();
      if (title.includes('jamdani') || title.includes('জামদানি')) {
        img = 'assets/images/products/jamdani-saree.jpg';
      } else if (title.includes('bishnupuri') || title.includes('বিষ্ণুপুরী') || title.includes('silk') || title.includes('সিল্ক')) {
        img = 'assets/images/products/bishnupuri-silk.jpg';
      } else if (title.includes('linen') || title.includes('লিনেন')) {
        img = 'assets/images/products/linen-saree.jpg';
      } else if (title.includes('chanderi') || title.includes('চান্দেরি') || title.includes('anarkali') || title.includes('আনারকলি')) {
        img = 'assets/images/products/chanderi-anarkali.jpg';
      } else if (title.includes('kantha') || title.includes('কাঁথা') || title.includes('kurti') || title.includes('কুর্তি')) {
        img = 'assets/images/products/kantha-kurti.jpg';
      } else if (title.includes('tussar') || title.includes('তসর') || title.includes('dupatta') || title.includes('ওড়না')) {
        img = 'assets/images/products/tussar-dupatta.jpg';
      } else if (title.includes('dokra') || title.includes('ডোকরা') || title.includes('necklace') || title.includes('নেকলেস')) {
        img = 'assets/images/products/dokra-necklace.jpg';
      } else if (title.includes('terracotta') || title.includes('টেরাকোটা') || title.includes('jhumka') || title.includes('ঝুমকো')) {
        img = 'assets/images/products/terracotta-jhumka.jpg';
      } else if (updated.category_id === 'c1000000-0000-0000-0000-000000000001') {
        img = 'assets/images/products/jamdani-saree.jpg';
      } else if (updated.category_id === 'c1000000-0000-0000-0000-000000000002') {
        img = 'assets/images/products/chanderi-anarkali.jpg';
      } else if (updated.category_id === 'c1000000-0000-0000-0000-000000000003') {
        img = 'assets/images/products/tussar-dupatta.jpg';
      } else {
        img = 'assets/images/products/dokra-necklace.jpg';
      }
    }
    updated.image_url = img || 'assets/images/products/jamdani-saree.jpg';
  }

  // Ensure luxury fashion e-commerce attributes
  if (!updated.fabric_type) {
    if (updated.name_en?.includes('Jamdani') || updated.name_bn?.includes('জামদানি')) {
      updated.fabric_type = '১০০% খাঁটি সুতি ও রূপোলি জরি (100% Cotton & Silver Zari)';
    } else if (updated.name_en?.includes('Silk') || updated.name_bn?.includes('সিল্ক')) {
      updated.fabric_type = 'খাঁটি কাতান সিল্ক ও মিনাকারি (Pure Katan Silk & Minakari)';
    } else if (updated.name_en?.includes('Linen') || updated.name_bn?.includes('লিনেন')) {
      updated.fabric_type = 'অর্গানিক হ্যান্ডলুম লিনেন (Organic Handloom Linen)';
    } else if (updated.name_en?.includes('Chanderi') || updated.name_bn?.includes('চান্দেরি')) {
      updated.fabric_type = 'চান্দেরি কটন ও জরি এমব্রয়ডারি (Chanderi Cotton)';
    } else if (updated.name_en?.includes('Kantha') || updated.name_bn?.includes('কাঁথা')) {
      updated.fabric_type = 'খাদি কটন ও হস্তশিল্প কাঁথা (Handspun Khadi Cotton)';
    } else if (updated.name_en?.includes('Tussar') || updated.name_bn?.includes('তসর')) {
      updated.fabric_type = 'বুনো সোনালী তসর সিল্ক (Wild Golden Tussar Silk)';
    } else if (updated.name_en?.includes('Dokra') || updated.name_bn?.includes('ডোকরা')) {
      updated.fabric_type = 'হস্তনির্মিত বেল মেটাল ও ব্রাস (Lost-wax Bell Metal)';
    } else if (updated.name_en?.includes('Terracotta') || updated.name_bn?.includes('টেরাকোটা')) {
      updated.fabric_type = 'পোড়ামাটি ও প্রাকৃতিক রঞ্জক (Kiln-fired Clay)';
    } else {
      updated.fabric_type = 'খাঁটি হস্তশিল্প (Pure Handloom)';
    }
  }

  if (!updated.available_sizes || !Array.isArray(updated.available_sizes) || updated.available_sizes.length === 0) {
    if (updated.category_id === 'c1000000-0000-0000-0000-000000000002') {
      // Kurtis
      updated.available_sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    } else if (updated.category_id === 'c1000000-0000-0000-0000-000000000001') {
      // Sarees
      updated.available_sizes = ['Free Size (5.5m + Blouse)'];
    } else if (updated.category_id === 'c1000000-0000-0000-0000-000000000003') {
      // Dupattas
      updated.available_sizes = ['Free Size (2.5m)'];
    } else {
      updated.available_sizes = ['Standard'];
    }
  }

  if (!updated.sku_code) {
    const cleanId = (updated.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    updated.sku_code = `TLK-${cleanId || 'PROD'}`;
  }

  return updated;
}

// Deep merge helper for customization options
function deepMerge(target, source) {
  const output = { ...target };
  if (!source || typeof source !== 'object') return output;
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Default website customization configuration (fully customizable from Admin Panel)
export const DEFAULT_CUSTOMIZATION = {
  logo: {
    url: '',
    width: 130,
    height: 42,
    alignment: 'left',
    alt: 'তূলিকা বুটিক লোগো',
    brand_name_bn: 'তূলিকা',
    brand_name_en: 'Tulika Boutique'
  },
  header: {
    bg_color: '',
    text_color: '',
    height: 72,
    logo_spacing: 16,
    nav_spacing: 24,
    nav_font_size: 15,
    mobile_nav_visible: true
  },
  nav_items: [
    { id: 'collection', label_bn: 'সম্ভার', label_en: 'Collection', target: '#products', visible: true, order: 1 },
    { id: 'about', label_bn: 'আমাদের কথা', label_en: 'About Us', target: '#about', visible: true, order: 2 },
    { id: 'reviews', label_bn: 'মতামত', label_en: 'Reviews', target: '#reviews', visible: true, order: 3 },
    { id: 'contact', label_bn: 'যোগাযোগ', label_en: 'Contact', target: '#contact', visible: true, order: 4 }
  ],
  hero: {
    headline_bn: 'বাংলার ঐতিহ্যবাহী বয়ন ও আধুনিক রূপ',
    headline_en: 'Artistry in Bengal Handloom & Modern Grace',
    subhead_bn: 'খাঁটি হাতে বোনা ঢাকাই জামদানি, তসর সিল্ক, কাঁথা স্টিচ কুর্তি ও ডোকরা ব্রাস গহনার অনন্য সম্ভার। সরাসরি হোয়াটসঅ্যাপে দ্রুত অর্ডার করুন।',
    subhead_en: 'Explore pure handwoven Jamdani, Tussar silk, Kantha stitch kurtis, and Dokra brass accessories. Fast & personal ordering directly over WhatsApp.',
    btn_label_bn: 'সম্ভার দেখুন',
    btn_label_en: 'Explore Collection',
    btn_target: '#products',
    bg_image: '',
    bg_position: 'center center',
    text_alignment: 'center',
    height: '80vh',
    bg_color: '',
    text_color: ''
  },
  sections: {
    collection: {
      visible: true,
      title_bn: 'বুটিক সম্ভার',
      title_en: 'Boutique Collection',
      sub_bn: 'প্রতিটি সুতোয় ঐতিহ্য ও নিপুণ হাতের ছোঁয়া',
      sub_en: 'Every weave tells a tale of handcrafted heritage'
    },
    about: {
      visible: true,
      title_bn: 'আমাদের কথা',
      title_en: 'About Us',
      desc_bn: 'তূলিকা একটি বিশ্বস্ত বুটিক যেখানে প্রতিটি শাড়ি ও পোশাক শৈল্পিক যত্ন এবং খাঁটি সুতো দিয়ে তৈরি করা হয়। আমাদের লক্ষ্য বাংলার সমৃদ্ধ বয়ন ঐতিহ্য ও আধুনিক ফ্যাশনের মেলবন্ধন ঘটিয়ে আপনার ব্যক্তিত্বকে অনন্য করে তোলা।',
      desc_en: "Tulika is a bespoke boutique where every saree and outfit is crafted with artistic passion and pure fabrics. We celebrate Bengal's rich weaving legacy alongside contemporary grace to make your style truly timeless."
    },
    reviews: {
      visible: true,
      title_bn: 'গ্রাহকদের মতামত',
      title_en: 'Customer Reviews',
      sub_bn: 'আমাদের সন্তুষ্ট গ্রাহকদের কিছু মূল্যবান অভিজ্ঞতা',
      sub_en: 'Cherished experiences from our patrons'
    },
    contact: {
      visible: true,
      title_bn: 'যোগাযোগ ও ঠিকানা',
      title_en: 'Contact & Visit Us',
      sub_bn: 'আমাদের শপে সরাসরি আসুন অথবা যেকোনো প্রয়োজনে ফোন/মেসেজ করুন',
      sub_en: 'Visit our boutique or reach out via phone/message',
      phone: '+91 98765 43210',
      email: 'contact@tulikaboutique.com',
      address_bn: '১২, শ্যামাপ্রসাদ মুখার্জি রোড, ভবানীপুর, কলকাতা ৭০০০২৫',
      address_en: '12, Shyama Prasad Mukherjee Road, Bhowanipore, Kolkata 700025'
    },
    footer: {
      about_bn: 'বাংলার সমৃদ্ধ ঐতিহ্য, খাঁটি বয়ন ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন।',
      about_en: "A graceful blend of Bengal's rich heritage, authentic weaves and modern elegance.",
      copyright_bn: '© {year} তূলিকা বুটিক। সর্বস্বত্ব সংরক্ষিত।',
      copyright_en: '© {year} Tulika Boutique. All rights reserved.',
      facebook_url: '',
      instagram_url: '',
      whatsapp_url: ''
    }
  },
  design: {
    primary_color: '#5A1B33',
    secondary_color: '#1E6B58',
    accent_color: '#D48C17',
    page_bg_color: '#FDFBF7',
    bg_color: '#FDFBF7',
    text_color: '#241E20',
    heading_font_size: 100,
    body_font_size: 100,
    btn_border_radius: 6,
    btn_radius: 6,
    card_border_radius: 12,
    card_radius: 12,
    content_max_width: 1240,
    container_max_width: 1240,
    section_spacing: 80
  }
};

// Fallback seed data used ONLY when running with placeholder credentials
const FALLBACK_SETTINGS = {
  id: 1,
  store_name_bn: 'তূলিকা',
  store_name_en: 'Tulika Boutique',
  tagline_bn: 'ঐতিহ্য, শিল্প ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন',
  tagline_en: 'A graceful blend of heritage, craft and modern elegance',
  about_bn: 'তূলিকা একটি বিশ্বস্ত বুটিক যেখানে প্রতিটি শাড়ি ও পোশাক শৈল্পিক যত্ন এবং খাঁটি সুতো দিয়ে তৈরি করা হয়। আমাদের লক্ষ্য বাংলার সমৃদ্ধ বয়ন ঐতিহ্য ও আধুনিক ফ্যাশনের মেলবন্ধন ঘটিয়ে আপনার ব্যক্তিত্বকে অনন্য করে তোলা।',
  about_en: "Tulika is a bespoke boutique where every saree and outfit is crafted with artistic passion and pure fabrics. We celebrate Bengal's rich weaving legacy alongside contemporary grace to make your style truly timeless.",
  phone: '+91 98765 43210',
  whatsapp: WHATSAPP_PLACEHOLDER || '919876543210',
  address_bn: '১২, শ্যামাপ্রসাদ মুখার্জি রোড, ভবানীপুর, কলকাতা ৭০০০২৫',
  address_en: '12, Shyama Prasad Mukherjee Road, Bhowanipore, Kolkata 700025',
  hours_bn: 'সোম - শনি: সকাল ১১টা থেকে রাত ৮টা (রবিবার বন্ধ)',
  hours_en: 'Mon - Sat: 11:00 AM to 8:00 PM (Sunday Closed)',
  customization: { ...DEFAULT_CUSTOMIZATION }
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
    image_url: 'assets/images/products/jamdani-saree.jpg',
    fabric_type: '১০০% খাঁটি সুতি ও রূপোলি জরি (100% Cotton & Silver Zari)',
    available_sizes: ['Free Size (5.5m + Blouse)'],
    sku_code: 'TLK-JMD-01'
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
    image_url: 'assets/images/products/bishnupuri-silk.jpg',
    fabric_type: 'খাঁটি কাতান সিল্ক ও মিনাকারি (Pure Katan Silk & Minakari)',
    available_sizes: ['Free Size (5.5m + Blouse)'],
    sku_code: 'TLK-BSH-02'
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
    image_url: 'assets/images/products/linen-saree.jpg',
    fabric_type: 'অর্গানিক হ্যান্ডলুম লিনেন (Organic Handloom Linen)',
    available_sizes: ['Free Size (5.5m)'],
    sku_code: 'TLK-LNN-03'
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
    image_url: 'assets/images/products/chanderi-anarkali.jpg',
    fabric_type: 'চান্দেরি কটন ও জরি এমব্রয়ডারি (Chanderi Cotton)',
    available_sizes: ['S', 'M', 'L', 'XL'],
    sku_code: 'TLK-KRT-04'
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
    image_url: 'assets/images/products/kantha-kurti.jpg',
    fabric_type: 'খাদি কটন ও হস্তশিল্প কাঁথা (Handspun Khadi Cotton)',
    available_sizes: ['M', 'L', 'XL', 'XXL'],
    sku_code: 'TLK-KRT-05'
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
    image_url: 'assets/images/products/tussar-dupatta.jpg',
    fabric_type: 'বুনো সোনালী তসর সিল্ক (Wild Golden Tussar Silk)',
    available_sizes: ['Free Size (2.5m)'],
    sku_code: 'TLK-DPT-06'
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
    image_url: 'assets/images/products/dokra-necklace.jpg',
    fabric_type: 'হস্তনির্মিত বেল মেটাল ও ব্রাস (Lost-wax Bell Metal)',
    available_sizes: ['Standard Adjustable'],
    sku_code: 'TLK-DKR-07'
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
    image_url: 'assets/images/products/terracotta-jhumka.jpg',
    fabric_type: 'পোড়ামাটি ও প্রাকৃতিক রঞ্জক (Kiln-fired Clay)',
    available_sizes: ['Standard'],
    sku_code: 'TLK-JHM-08'
  }
];

const FALLBACK_REVIEWS = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    author_name: 'অনন্যা চ্যাটার্জী (কলকাতা)',
    rating: 5,
    comment_bn: 'ঢাকাই জামদানি শাড়ির গুণমান ও সুতোর বুনন অসাধারণ! হোয়াটসঅ্যাপে অর্ডার করার পরদিনই খুব সুন্দর প্যাকিং সহ ডেলিভারি পেয়েছি।',
    comment_en: 'The weave and drape of the Dhakai Jamdani is exceptional. Prompt WhatsApp response and beautifully packed delivery.',
    is_visible: true,
    created_at: '2026-10-15T10:00:00.000Z'
  },
  {
    id: 'r1000000-0000-0000-0000-000000000002',
    author_name: 'শ্রাবণী বসু (সল্টলেক)',
    rating: 5,
    comment_bn: 'বিষ্ণুপুরী সিল্ক শাড়িটির আঁচলের কাজ চোখে পড়ার মতো। খাঁটি সিল্কের ঔজ্জ্বল্য সত্যিই মন ভরিয়ে দিয়েছে। তূলিকাকে অনেক শুভকামনা।',
    comment_en: 'The silk mark Bishnupuri saree is truly authentic. The minakari pallu drew so many compliments at our family gathering!',
    is_visible: true,
    created_at: '2026-10-18T14:30:00.000Z'
  },
  {
    id: 'r1000000-0000-0000-0000-000000000003',
    author_name: 'সুস্মিতা সেনগুপ্ত (হাওড়া)',
    rating: 5,
    comment_bn: 'ডোকরা নেকলেস ও টেরাকোটা কানের সেটটি খুব সুন্দর। খাঁটি হস্তশিল্পের এমন সংগ্রহ আজকাল খুব কম পাওয়া যায়।',
    comment_en: 'The handcrafted Dokra piece is pure art. Wonderful customer service on WhatsApp and genuine craftsmanship.',
    is_visible: true,
    created_at: '2026-10-22T09:15:00.000Z'
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
  let baseSettings = { ...mockSettings };

  try {
    const localCustom = localStorage.getItem('tulika_customization');
    if (localCustom) {
      baseSettings.customization = deepMerge(DEFAULT_CUSTOMIZATION, JSON.parse(localCustom));
    }
  } catch (e) {}

  if (!sb) return baseSettings;

  try {
    const { data, error } = await sb.from('settings').select('*').eq('id', 1).single();
    if (error) {
      console.warn('Could not fetch settings from Supabase, using defaults:', error.message);
      return baseSettings;
    }
    const merged = { ...baseSettings, ...(data || {}) };

    // Check if remote customization contains actual customized keys (> 0 keys)
    const remoteCustom =
      data?.customization &&
      typeof data.customization === 'object' &&
      !Array.isArray(data.customization) &&
      Object.keys(data.customization).length > 0
        ? data.customization
        : null;

    if (remoteCustom) {
      if (baseSettings.customization) {
        // Local customizations saved in this browser take priority over remote (e.g. offline/demo/recent edits)
        merged.customization = deepMerge(remoteCustom, baseSettings.customization);
      } else {
        merged.customization = deepMerge(DEFAULT_CUSTOMIZATION, remoteCustom);
        try {
          localStorage.setItem('tulika_customization', JSON.stringify(merged.customization));
        } catch (e) {}
      }
    } else {
      // Remote is empty {} — preserve saved local customization or defaults
      merged.customization = baseSettings.customization || { ...DEFAULT_CUSTOMIZATION };
    }

    return merged;
  } catch (err) {
    console.warn('getSettings network error, falling back to local defaults:', err);
    return baseSettings;
  }
}

export async function updateSettings(fields) {
  const sb = getSupabase();

  if (fields.customization) {
    try {
      localStorage.setItem('tulika_customization', JSON.stringify(fields.customization));
    } catch (e) {}
  }

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

    if (error) {
      console.warn('Supabase updateSettings warning:', error.message);
      mockSettings = { ...mockSettings, ...fields };
      return mockSettings;
    }
    mockSettings = { ...mockSettings, ...(data || {}) };
    return data;
  } catch (err) {
    console.warn('updateSettings network error, persisted locally:', err);
    mockSettings = { ...mockSettings, ...fields };
    return mockSettings;
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

    if (error) {
      console.warn('Supabase getCategories query error, using fallback:', error.message);
      return [...mockCategories].sort((a, b) => a.sort_order - b.sort_order);
    }
    if (!data || data.length === 0) {
      console.info('No categories found in database, using fallback categories');
      return [...mockCategories].sort((a, b) => a.sort_order - b.sort_order);
    }
    return data;
  } catch (err) {
    console.warn('getCategories network error, using fallback:', err);
    return [...mockCategories].sort((a, b) => a.sort_order - b.sort_order);
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
function getMockProductsFiltered({
  categoryId = null,
  search = '',
  includeHidden = false,
  page = 1,
  limit = 50
} = {}) {
  let list = mockProducts.map(normalizeProduct);
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

export async function getProducts({
  categoryId = null,
  search = '',
  includeHidden = false,
  page = 1,
  limit = 50
} = {}) {
  const sb = getSupabase();
  if (!sb) {
    return getMockProductsFiltered({ categoryId, search, includeHidden, page, limit });
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
    if (error) {
      console.warn('Supabase query error, falling back to local demo products:', error.message);
      return getMockProductsFiltered({ categoryId, search, includeHidden, page, limit });
    }
    if (!data || data.length === 0) {
      if ((categoryId && categoryId !== 'all') || search.trim()) {
        return { data: [], count: 0 };
      }
      return getMockProductsFiltered({ categoryId, search, includeHidden, page, limit });
    }
    const normalized = (data || []).map(normalizeProduct);
    return { data: normalized, count: count || normalized.length };
  } catch (err) {
    console.warn('Network error reaching Supabase, falling back to local demo products:', err);
    return getMockProductsFiltered({ categoryId, search, includeHidden, page, limit });
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

      // Export as high-efficiency WebP (0.85 quality)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to JPEG if browser doesn't support canvas WebP export
            canvas.toBlob(
              (jpgBlob) => {
                if (!jpgBlob) {
                  reject(new Error('ইমেজ প্রসেসিং ব্যর্থ হয়েছে'));
                  return;
                }
                resolve(jpgBlob);
              },
              'image/jpeg',
              0.85
            );
            return;
          }
          resolve(blob);
        },
        'image/webp',
        0.85
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

  // Step B: Upload to Supabase Storage with 1-Year CDN Cache
  try {
    const isWebP = resizedBlob.type === 'image/webp';
    const ext = isWebP ? 'webp' : 'jpg';
    const contentType = isWebP ? 'image/webp' : 'image/jpeg';
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.[^/.]+$/, '');
    const fileName = `prod_${Date.now()}_${safeName || 'photo'}.${ext}`;

    const { data, error } = await sb.storage
      .from('product-images')
      .upload(fileName, resizedBlob, {
        contentType,
        cacheControl: '31536000', // 1-year browser & edge CDN cache
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

/**
 * Formats a review ISO date string for display (bilingual support)
 */
export function formatReviewDate(dateStr, lang = 'bn') {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

/**
 * Public Customer Review Submission
 * Enforces is_visible: false so reviews remain pending admin moderation
 */
export async function submitCustomerReview({ author_name, rating, comment }) {
  const sb = getSupabase();
  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  const cleanName = (author_name || '').trim();
  const cleanRating = parseInt(rating, 10);
  const cleanComment = (comment || '').trim();

  if (!cleanName) {
    throw new Error(isBn ? t('reviewValidationError') || 'আপনার নাম লিখুন' : 'Please enter your name');
  }
  if (!cleanRating || cleanRating < 1 || cleanRating > 5) {
    throw new Error(isBn ? '১ থেকে ৫ এর মধ্যে রেটিং দিন' : 'Please select a rating between 1 and 5');
  }
  if (!cleanComment) {
    throw new Error(isBn ? t('reviewValidationError') || 'আপনার রিভিউ মন্তব্য লিখুন' : 'Please write your review comment');
  }

  // Populate comment_bn (required by NOT NULL constraint)
  // Mirror to comment_en if submitted in English mode
  const payload = {
    author_name: cleanName,
    rating: cleanRating,
    comment_bn: cleanComment,
    comment_en: isBn ? '' : cleanComment,
    is_visible: false
  };

  if (!sb) {
    // In mock/preview mode, add to local mockReviews as unapproved
    const mockRev = {
      id: 'mock-rev-' + Date.now(),
      created_at: new Date().toISOString(),
      ...payload
    };
    mockReviews.unshift(mockRev);
    return { success: true, pending: true, data: mockRev };
  }

  try {
    // Do not chain .select() because unapproved reviews are hidden from public SELECT by RLS
    const { error } = await sb.from('reviews').insert([payload]);
    if (error) throw error;
    return { success: true, pending: true };
  } catch (err) {
    console.error('submitCustomerReview error:', err);
    throw err;
  }
}

// ==============================================================================
// AUTHENTICATION & ADMIN VERIFICATION (WITH TIMEOUT & RESILIENCE)
// ==============================================================================

/**
 * Wraps any promise with an explicit timeout.
 * Rejects with a custom TimeoutError if the promise does not settle within `timeoutMs`.
 */
export function withTimeout(promise, timeoutMs = 12000, timeoutMessage = 'Request timed out') {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      timer = null;
      const err = new Error(timeoutMessage);
      err.name = 'TimeoutError';
      err.code = 'AUTH_TIMEOUT';
      reject(err);
    }, timeoutMs);

    Promise.resolve(promise)
      .then((res) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        resolve(res);
      })
      .catch((err) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        reject(err);
      });
  });
}

export async function signIn(email, password, timeoutMs = 30000) {
  const t0 = performance.now();
  console.log('[Auth Stage 1] Initializing Supabase client for password authentication...');
  const sb = getSupabase();
  if (!sb) {
    const isBn = getCurrentLang() === 'bn';
    const err = new Error(isBn ? t('authConfigError') : 'Supabase is not configured properly. Check js/config.js.');
    err.name = 'ConfigError';
    throw err;
  }

  const isBn = getCurrentLang() === 'bn';
  const timeoutMsg = isBn ? t('authTimeout') : 'Authentication timed out: The server did not respond in time.';

  console.log(`[Auth Stage 2] Sending signInWithPassword request to Supabase Auth endpoint (timeout: ${timeoutMs / 1000}s)...`);
  const authPromise = sb.auth.signInWithPassword({
    email,
    password
  });

  try {
    const { data, error } = await withTimeout(authPromise, timeoutMs, timeoutMsg);
    const duration = Math.round(performance.now() - t0);
    console.log(`[Auth Stage 3] signInWithPassword completed in ${duration}ms:`, {
      hasUser: Boolean(data?.user),
      hasSession: Boolean(data?.session),
      errorCode: error?.status || error?.code
    });
    if (error) throw error;
    return data;
  } catch (err) {
    const duration = Math.round(performance.now() - t0);
    console.error(`[Auth Stage Error] Authentication failed after ${duration}ms:`, {
      name: err.name,
      message: err.message,
      status: err.status || err.code
    });
    throw err;
  }
}

export async function signInWithOtp(email, timeoutMs = 15000) {
  const sb = getSupabase();
  if (!sb) {
    const isBn = getCurrentLang() === 'bn';
    const err = new Error(isBn ? t('authConfigError') : 'Supabase is not configured properly. Check js/config.js.');
    err.name = 'ConfigError';
    throw err;
  }

  const isBn = getCurrentLang() === 'bn';
  const timeoutMsg = isBn ? t('authTimeout') : 'Authentication timed out. Please check your network and try again.';

  const authPromise = sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href.split('#')[0],
      shouldCreateUser: false
    }
  });

  const { data, error } = await withTimeout(authPromise, timeoutMs, timeoutMsg);
  if (error) throw error;
  return data;
}

export async function verifyOtp(email, token, timeoutMs = 15000) {
  const sb = getSupabase();
  if (!sb) {
    const isBn = getCurrentLang() === 'bn';
    const err = new Error(isBn ? t('authConfigError') : 'Supabase is not configured properly. Check js/config.js.');
    err.name = 'ConfigError';
    throw err;
  }

  const isBn = getCurrentLang() === 'bn';
  const timeoutMsg = isBn ? t('authTimeout') : 'Authentication timed out. Please check your network and try again.';

  // Attempt verification with type: 'email' first
  let { data, error } = await withTimeout(
    sb.auth.verifyOtp({
      email,
      token,
      type: 'email'
    }),
    timeoutMs,
    timeoutMsg
  );

  // If token type mismatch (e.g. magiclink token vs email otp token), fall back to magiclink
  if (error && (String(error.message || '').toLowerCase().includes('token_type') || String(error.message || '').toLowerCase().includes('magiclink'))) {
    try {
      const fallback = await withTimeout(
        sb.auth.verifyOtp({
          email,
          token,
          type: 'magiclink'
        }),
        timeoutMs,
        timeoutMsg
      );
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    } catch (_) {
      // Keep initial error if fallback also throws
    }
  }

  if (error) throw error;
  return data;
}

export async function signOut(timeoutMs = 6000) {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    await withTimeout(sb.auth.signOut(), timeoutMs, 'Sign out timed out');
  } catch (e) {
    console.warn('signOut warning:', e);
  }
  return true;
}

export async function getSession(timeoutMs = 8000) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await withTimeout(sb.auth.getSession(), timeoutMs, 'Session check timed out');
    return data?.session || null;
  } catch (e) {
    console.warn('getSession warning:', e);
    return null;
  }
}

let lastAdminCheckError = null;

export function getLastAdminCheckError() {
  return lastAdminCheckError;
}

/**
 * Validates whether the authenticated user has a registered row in public.admins
 */
export async function checkIsAdmin(user, timeoutMs = 20000) {
  lastAdminCheckError = null;
  if (!user || !user.id) {
    console.warn('[checkIsAdmin] No user or user.id provided:', user);
    return false;
  }
  const sb = getSupabase();
  if (!sb) {
    lastAdminCheckError = new Error('Supabase client is not configured');
    return false;
  }

  const isBn = getCurrentLang() === 'bn';
  const timeoutMsg = isBn ? 'অ্যাডমিন স্ট্যাটাস যাচাই সময়সীমা উত্তীর্ণ' : 'Admin check timed out';

  // Diagnostic: Inspect authenticated session state on Supabase client
  try {
    const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
    const session = sessionData?.session;
    console.log('[checkIsAdmin] Diagnostic session inspection:', {
      hasSession: Boolean(session),
      sessionUserId: session?.user?.id,
      targetUserId: user.id,
      idsMatch: session?.user?.id === user.id,
      hasAccessToken: Boolean(session?.access_token),
      tokenLength: session?.access_token ? session.access_token.length : 0,
      sessionError: sessionErr ? sessionErr.message : null
    });
  } catch (diagErr) {
    console.warn('[checkIsAdmin] Diagnostic getSession error:', diagErr.message);
  }

  // Strategy 1: Try dedicated RPC helper is_current_user_admin()
  const rpcStart = performance.now();
  try {
    console.log('[checkIsAdmin] Strategy 1: Calling sb.rpc("is_current_user_admin")...');
    const rpcPromise = sb.rpc('is_current_user_admin');
    const { data: rpcIsAdmin, error: rpcError } = await withTimeout(rpcPromise, 6000, 'RPC check timeout');
    const rpcDuration = Math.round(performance.now() - rpcStart);
    console.log(`[checkIsAdmin] Strategy 1 RPC response (${rpcDuration}ms):`, { rpcIsAdmin, error: rpcError });

    if (!rpcError && typeof rpcIsAdmin === 'boolean') {
      return rpcIsAdmin;
    }
    if (rpcError) {
      console.warn('[checkIsAdmin] Strategy 1 RPC returned error:', rpcError);
    }
  } catch (rpcEx) {
    const rpcDuration = Math.round(performance.now() - rpcStart);
    console.warn(`[checkIsAdmin] Strategy 1 RPC exception (${rpcDuration}ms):`, rpcEx.message);
  }

  // Strategy 2: Direct query on public.admins matching auth.uid() = user_id
  const tableStart = performance.now();
  try {
    console.log(`[checkIsAdmin] Strategy 2: Querying public.admins for user_id = ${user.id}...`);
    const checkPromise = sb
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data, error } = await withTimeout(checkPromise, timeoutMs, timeoutMsg);
    const tableDuration = Math.round(performance.now() - tableStart);
    console.log(`[checkIsAdmin] Strategy 2 Table query response (${tableDuration}ms):`, { data, error });

    if (error) {
      console.error('[checkIsAdmin] Strategy 2 error from Supabase:', error);
      lastAdminCheckError = error;
      return false;
    }

    return Boolean(data && data.user_id === user.id);
  } catch (err) {
    const tableDuration = Math.round(performance.now() - tableStart);
    console.error(`[checkIsAdmin] Strategy 2 exception (${tableDuration}ms):`, err.message);
    lastAdminCheckError = err;
    return false;
  }
}

