// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Internationalization Dictionary (Bengali primary, English toggle)
// ==============================================================================

const STORAGE_KEY = 'tulika_lang';

export const translations = {
  bn: {
    // Brand & Meta
    storeTitle: 'তূলিকা — বুটিক ও খাঁটি হস্তশিল্প',
    metaDesc: 'তূলিকা বুটিক — বাংলার খাঁটি জামদানি, সিল্ক শাড়ি, সুতির কুর্তি, হস্তশিল্প ওড়না এবং ডোকরা গহনা। সরাসরি হোয়াটসঅ্যাপে অর্ডার করুন।',
    tagline: 'ঐতিহ্য, শিল্প ও আধুনিক ফ্যাশনের অনন্য মেলবন্ধন',
    heroHeadline: 'বাংলার ঐতিহ্যবাহী বয়ন ও আধুনিক রূপ',
    heroSubhead: 'হাতে বোনা খাঁটি জামদানি, তসর সিল্ক, কাঁথা স্টিচ ও পোড়ামাটির গহনার অনন্য সংগ্রহ। সরাসরি হোয়াটসঅ্যাপে দ্রুত অর্ডার করুন।',
    orderOnWhatsApp: 'হোয়াটসঅ্যাপে অর্ডার করুন',
    exploreCollection: 'সংগ্রহ দেখুন',

    // Navigation & General
    allCategories: 'সকল পণ্য',
    searchPlaceholder: 'পণ্য বা বিভাগের নাম খুঁজুন...',
    noProductsFound: 'কোনো পণ্য পাওয়া যায়নি',
    noProductsSub: 'অন্য কোনো নাম বা বিভাগ নির্বাচন করে পুনরায় চেষ্টা করুন।',
    featured: 'সেরা পছন্দ',
    newBadge: 'নতুন',
    soldOutBadge: 'স্টক শেষ',
    inStock: 'স্টকে আছে',
    price: 'মূল্য',
    orderNow: 'অর্ডার করুন',
    askQuestion: 'প্রশ্ন করুন',
    soldOutButton: 'স্টক শেষ',
    viewDetails: 'বিস্তারিত দেখুন',
    close: 'বন্ধ করুন',
    back: 'ফিরে যান',
    loading: 'লোড হচ্ছে...',
    retry: 'আবার চেষ্টা করুন',
    networkError: 'সংযোগ ব্যর্থ — আবার চেষ্টা করুন',

    // Sections
    collectionHeading: 'আমাদের সম্ভার',
    collectionSubhead: 'কারিগরদের নিপুণ হাতে তৈরি সেরা শাড়ি ও পোশাকের সমাহার',
    aboutHeading: 'আমাদের কথা',
    aboutSubhead: 'বাংলার তাঁত ও কারুশিল্পের প্রতি ভালোবাসা থেকে তূলিকার সৃষ্টি',
    reviewsHeading: 'গ্রাহকদের মতামত',
    reviewsSubhead: 'আমাদের সন্তুষ্ট গ্রাহকদের কিছু মূল্যবান অভিজ্ঞতা',
    contactHeading: 'যোগাযোগ ও ঠিকানা',
    contactSubhead: 'আমাদের শপে সরাসরি আসুন অথবা যেকোনো প্রয়োজনে ফোন/মেসেজ করুন',
    visitUs: 'ঠিকানা',
    callUs: 'ফোন',
    businessHours: 'সময়সূচী',
    openGoogleMaps: 'গুগল ম্যাপে দেখুন',
    adminLogin: 'অ্যাডমিন লগইন',
    floatingWhatsAppTooltip: 'আমাদের সাথে হোয়াটসঅ্যাপে কথা বলুন',

    // Setup Notice
    setupNoticeTitle: 'সুপাবেস (Supabase) কনফিগারেশন প্রয়োজন',
    setupNoticeBody: 'আপনার js/config.js ফাইলটিতে Supabase URL ও anon key যুক্ত করুন। ততক্ষণ ডেমো ডেটা প্রদর্শিত হচ্ছে।',

    // WhatsApp Message Templates
    waOrderHello: 'হ্যালো তূলিকা, আমি এই পণ্যটি অর্ডার করতে চাই:',
    waCategoryLabel: 'বিভাগ',
    waPriceLabel: 'মূল্য',
    waLinkLabel: 'ছবি লিংক',
    waAskHello: 'হ্যালো তূলিকা, আমার এই পণ্যটি সম্পর্কে কিছু জানার ছিল:',

    // Admin Panel
    adminPortal: 'তূলিকা অ্যাডমিন প্যানেল',
    adminSubtitle: 'পণ্য সম্ভার, বিভাগ, রিভিউ এবং স্টোর সেটিংস ব্যবস্থাপনা',
    loginTitle: 'অ্যাডমিন সাইন ইন',
    loginSubtitle: 'সুপাবেস নিবন্ধিত অ্যাডমিন অ্যাকাউন্ট দিয়ে প্রবেশ করুন',
    emailLabel: 'ইমেইল অ্যাড্রেস',
    passwordLabel: 'পাসওয়ার্ড',
    loginBtn: 'লগইন করুন',
    loggingIn: 'যাচাই করা হচ্ছে...',
    logoutBtn: 'লগআউট',
    unauthorizedTitle: 'অননুমোদিত ব্যবহারকারী',
    unauthorizedMsg: 'আপনার অ্যাকাউন্টটি সিস্টেমের admins টেবিলে নিবন্ধিত নয়। অনুগ্রহ করে অনুমোদিত অ্যাডমিন হিসেবে সাইন ইন করুন।',
    returnHome: 'মূল ওয়েবসাইটে ফিরুন',

    // Admin Dashboard
    statTotalProducts: 'মোট পণ্য',
    statVisibleProducts: 'প্রদর্শিত পণ্য',
    statSoldOut: 'স্টক শেষ',
    statCategories: 'মোট বিভাগ',
    statReviews: 'মোট রিভিউ',

    // Admin Tabs
    tabProducts: 'পণ্য তালিকা',
    tabCategories: 'বিভাগ সমূহ',
    tabSettings: 'স্টোর সেটিংস',
    tabReviews: 'রিভিউ সমূহ',
    tabStorage: 'ইমেজ স্টোরেজ',

    // Admin Products Table
    addProduct: 'নতুন পণ্য যোগ করুন',
    editProduct: 'পণ্য সম্পাদনা',
    productNameBn: 'পণ্যের নাম (বাংলা)',
    productNameEn: 'পণ্যের নাম (ইংরেজি)',
    category: 'বিভাগ',
    priceLabel: 'মূল্য (₹)',
    stockStatus: 'স্টক অবস্থা',
    featuredQuestion: 'হোমপেজে ফিচার্ড?',
    newQuestion: 'নতুন আগমন (New Badge)?',
    visibleQuestion: 'ওয়েবসাইটে প্রদর্শিত হবে?',
    descriptionBn: 'বর্ণনা (বাংলা)',
    descriptionEn: 'বর্ণনা (ইংরেজি)',
    productImage: 'পণ্যের ছবি (ম্যাক্স ১২০০px, অটো কম্প্রেস)',
    uploadNewImage: 'নতুন ছবি আপলোড করুন',
    currentImage: 'বর্তমান ছবি',
    actions: 'অ্যাকশন',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    confirmDelete: 'আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?',
    saving: 'সংরক্ষণ হচ্ছে...',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',

    // Admin Categories
    addCategory: 'নতুন বিভাগ যোগ করুন',
    categoryNameBn: 'বিভাগের নাম (বাংলা)',
    categoryNameEn: 'বিভাগের নাম (ইংরেজি)',
    categorySlug: 'স্লাগ (ইংরেজি কোড, যেমন: sarees)',
    reorderHint: 'বাটন ব্যবহার করে সাজানোর ক্রম পরিবর্তন করুন',
    moveUp: 'উপরে তুলুন',
    moveDown: 'নিচে নামান',
    categoryDeleteBlocked: 'এই বিভাগে পণ্য রয়েছে — মুছে ফেলা সম্ভব নয়',

    // Admin Settings
    storeSettings: 'স্টোর ও যোগাযোগ সেটিংস',
    storeNameBn: 'দোকানের নাম (বাংলা)',
    storeNameEn: 'দোকানের নাম (ইংরেজি)',
    taglineBn: 'ট্যাগলাইন (বাংলা)',
    taglineEn: 'ট্যাগলাইন (ইংরেজি)',
    aboutBn: 'আমাদের সম্পর্কে (বাংলা)',
    aboutEn: 'আমাদের সম্পর্কে (ইংরেজি)',
    phone: 'ফোন নম্বর',
    whatsappNumber: 'হোয়াটসঅ্যাপ নম্বর (৮–১৫ সংখ্যার কোড সহ, কোনো চিহ্ন নয়)',
    addressBn: 'ঠিকানা (বাংলা)',
    addressEn: 'ঠিকানা (ইংরেজি)',
    hoursBn: 'কাজের সময় (বাংলা)',
    hoursEn: 'কাজের সময় (ইংরেজি)',
    saveSettings: 'সেটিংস আপডেট করুন',

    // Admin Reviews
    addReview: 'নতুন রিভিউ যোগ করুন',
    authorName: 'গ্রাহকের নাম ও শহর',
    rating: 'রেটিং (১-৫)',
    commentBn: 'মন্তব্য (বাংলা)',
    commentEn: 'মন্তব্য (ইংরেজি)',
    toggleVisibility: 'প্রদর্শন বদলান',

    // Admin Storage
    cleanOrphanImages: 'অব্যবহৃত ছবি খুঁজুন ও মুছুন (Clean Orphans)',
    orphanScanResult: 'অব্যবহৃত ছবির স্ক্যান সম্পন্ন',
    noOrphansFound: 'কোনো অতিরিক্ত অব্যবহৃত ছবি পাওয়া যায়নি।',
    deleteSelectedOrphans: 'অব্যবহৃত ছবিগুলি মুছে ফেলুন',

    // Toast Messages
    toastSuccess: 'সফলভাবে সম্পন্ন হয়েছে',
    toastSaveSuccess: 'তথ্য সফলভাবে সংরক্ষিত হয়েছে',
    toastDeleteSuccess: 'সফলভাবে মুছে ফেলা হয়েছে',
    toastError: 'ত্রুটি ঘটেছে'
  },

  en: {
    // Brand & Meta
    storeTitle: 'Tulika — Heritage Handcraft Boutique',
    metaDesc: 'Tulika Boutique — Handwoven Jamdani, Bishnupuri Silk Sarees, Cotton Kurtis, Handcrafted Dupattas and Dokra Jewellery. Order easily on WhatsApp.',
    tagline: 'A graceful blend of heritage, craft and modern elegance',
    heroHeadline: 'Artistry in Bengal Handloom & Modern Grace',
    heroSubhead: 'Explore pure handwoven Jamdani, Tussar silk, Kantha stitch kurtis, and Dokra brass accessories. Fast & personal ordering directly over WhatsApp.',
    orderOnWhatsApp: 'Order on WhatsApp',
    exploreCollection: 'Explore Collection',

    // Navigation & General
    allCategories: 'All Products',
    searchPlaceholder: 'Search products or category...',
    noProductsFound: 'No products found',
    noProductsSub: 'Try searching with another keyword or pick a different category.',
    featured: 'Featured',
    newBadge: 'New',
    soldOutBadge: 'Sold Out',
    inStock: 'In Stock',
    price: 'Price',
    orderNow: 'Order on WhatsApp',
    askQuestion: 'Ask a Question',
    soldOutButton: 'Sold Out',
    viewDetails: 'Quick View',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    retry: 'Retry',
    networkError: 'Connection failed — please try again',

    // Sections
    collectionHeading: 'Our Collection',
    collectionSubhead: 'Master artisan crafted sarees, kurtis, dupattas, and accessories',
    aboutHeading: 'Our Story',
    aboutSubhead: 'Rooted in passion for authentic Bengal weaves and handcraft traditions',
    reviewsHeading: 'Customer Stories',
    reviewsSubhead: 'Hear what our patrons say about their Tulika experience',
    contactHeading: 'Visit & Connect',
    contactSubhead: 'Visit our boutique in Kolkata or connect directly over phone & WhatsApp',
    visitUs: 'Address',
    callUs: 'Phone',
    businessHours: 'Hours',
    openGoogleMaps: 'Open on Google Maps',
    adminLogin: 'Admin Login',
    floatingWhatsAppTooltip: 'Chat with us on WhatsApp',

    // Setup Notice
    setupNoticeTitle: 'Supabase Configuration Required',
    setupNoticeBody: 'Please update js/config.js with your Supabase URL & anon public key. Demo data is shown in the meantime.',

    // WhatsApp Message Templates
    waOrderHello: 'Hello Tulika, I want to order:',
    waCategoryLabel: 'Category',
    waPriceLabel: 'Price',
    waLinkLabel: 'Link',
    waAskHello: 'Hello Tulika, I have a question about this product:',

    // Admin Panel
    adminPortal: 'Tulika Admin Portal',
    adminSubtitle: 'Manage products, categories, customer reviews and store settings',
    loginTitle: 'Admin Sign In',
    loginSubtitle: 'Enter your verified Supabase Admin credentials',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    loginBtn: 'Sign In',
    loggingIn: 'Authenticating...',
    logoutBtn: 'Sign Out',
    unauthorizedTitle: 'Access Refused',
    unauthorizedMsg: 'Your account is authenticated but does not exist in the admins table. Access is restricted.',
    returnHome: 'Return to Website',

    // Admin Dashboard
    statTotalProducts: 'Total Products',
    statVisibleProducts: 'Visible Products',
    statSoldOut: 'Sold Out',
    statCategories: 'Categories',
    statReviews: 'Reviews',

    // Admin Tabs
    tabProducts: 'Products',
    tabCategories: 'Categories',
    tabSettings: 'Store Settings',
    tabReviews: 'Reviews',
    tabStorage: 'Image Storage',

    // Admin Products Table
    addProduct: 'Add New Product',
    editProduct: 'Edit Product',
    productNameBn: 'Product Name (Bengali)',
    productNameEn: 'Product Name (English)',
    category: 'Category',
    priceLabel: 'Price (₹)',
    stockStatus: 'Stock Status',
    featuredQuestion: 'Show on Featured?',
    newQuestion: 'New Arrival Badge?',
    visibleQuestion: 'Visible on Website?',
    descriptionBn: 'Description (Bengali)',
    descriptionEn: 'Description (English)',
    productImage: 'Product Photo (Max 1200px, auto-compressed)',
    uploadNewImage: 'Upload New Photo',
    currentImage: 'Current Photo',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this item?',
    saving: 'Saving...',
    save: 'Save',
    cancel: 'Cancel',

    // Admin Categories
    addCategory: 'Add Category',
    categoryNameBn: 'Category Name (Bengali)',
    categoryNameEn: 'Category Name (English)',
    categorySlug: 'Slug (e.g. sarees)',
    reorderHint: 'Use buttons to reorder categories',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    categoryDeleteBlocked: 'Cannot delete category while products reference it',

    // Admin Settings
    storeSettings: 'Store & Contact Information',
    storeNameBn: 'Store Name (Bengali)',
    storeNameEn: 'Store Name (English)',
    taglineBn: 'Tagline (Bengali)',
    taglineEn: 'Tagline (English)',
    aboutBn: 'About Boutique (Bengali)',
    aboutEn: 'About Boutique (English)',
    phone: 'Phone Number',
    whatsappNumber: 'WhatsApp Number (8–15 digits with country code, no symbols)',
    addressBn: 'Address (Bengali)',
    addressEn: 'Address (English)',
    hoursBn: 'Business Hours (Bengali)',
    hoursEn: 'Business Hours (English)',
    saveSettings: 'Save Settings',

    // Admin Reviews
    addReview: 'Add Review',
    authorName: 'Customer Name & City',
    rating: 'Rating (1-5)',
    commentBn: 'Review (Bengali)',
    commentEn: 'Review (English)',
    toggleVisibility: 'Toggle Visibility',

    // Admin Storage
    cleanOrphanImages: 'Scan & Clean Orphan Images',
    orphanScanResult: 'Orphan Storage Scan Complete',
    noOrphansFound: 'No orphaned image files found in storage.',
    deleteSelectedOrphans: 'Delete Orphaned Images',

    // Toast Messages
    toastSuccess: 'Operation completed successfully',
    toastSaveSuccess: 'Changes saved successfully',
    toastDeleteSuccess: 'Deleted successfully',
    toastError: 'An error occurred'
  }
};

/**
 * Get current language (bn or en)
 */
export function getCurrentLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'bn') return saved;
  return 'bn'; // Bengali primary default
}

/**
 * Set and persist language
 */
export function setLang(lang) {
  if (lang !== 'bn' && lang !== 'en') lang = 'bn';
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  return lang;
}

/**
 * Translate key with optional parameter substitution
 */
export function t(key, params = {}) {
  const lang = getCurrentLang();
  let text = translations[lang]?.[key] || translations.bn[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}

/**
 * Format currency using Indian numbering system (en-IN format)
 * Returns formatted INR string, e.g. ₹4,250
 */
export function formatPrice(num, lang = getCurrentLang()) {
  const parsed = Number(num) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(parsed);
}

/**
 * Update all DOM elements with data-i18n attributes and document meta
 */
export function applyI18nToDOM(lang = getCurrentLang()) {
  document.documentElement.lang = lang;

  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[lang]?.[key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update input placeholders with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[lang]?.[key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // Update document title and description if elements exist
  const titleKey = document.querySelector('meta[name="i18n-title-key"]')?.getAttribute('content');
  if (titleKey && translations[lang]?.[titleKey]) {
    document.title = translations[lang][titleKey];
  }

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && translations[lang]?.metaDesc) {
    metaDesc.setAttribute('content', translations[lang].metaDesc);
  }

  // Update language toggle button visual state if present
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = lang === 'bn' ? 'English' : 'বাংলা';
    btn.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
  });
}

