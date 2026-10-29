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
    navCollection: 'সম্ভার',
    navAbout: 'আমাদের কথা',
    navReviews: 'রিভিউ',
    navContact: 'যোগাযোগ',
    themeLight: '☀️ আলো',
    themeDark: '🌙 অন্ধকার',
    openMenu: 'মেনু খুলুন',
    closeMenu: 'মেনু বন্ধ করুন',
    inStockOnly: 'শুধু স্টকে আছে',
    inStockTitle: 'শুধু স্টকে থাকা পণ্য দেখুন',
    sortNewest: 'নতুন আগমন',
    sortPriceAsc: 'মূল্য: কম থেকে বেশি',
    sortPriceDesc: 'মূল্য: বেশি থেকে কম',
    fabricLabel: 'ফেব্রিক:',
    sizeLabel: 'সাইজ:',
    allCategories: 'সকল পণ্য',
    searchPlaceholder: 'পণ্য বা বিভাগের নাম খুঁজুন...',
    noProductsFound: 'কোনো পণ্য পাওয়া যায়নি',
    noProductsSub: 'অন্য কোনো নাম বা বিভাগ নির্বাচন করে পুনরায় চেষ্টা করুন।',
    clearSearch: 'অনুসন্ধান মুছুন',
    clearFilters: 'ফিল্টার রিসেট করুন',
    showAllProducts: 'সব পণ্য দেখুন',
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

    // Feature highlights in About section
    featurePureWeave: '১০০% খাঁটি বয়ন',
    featurePureWeaveSub: 'সরাসরি তাঁতিদের হাত থেকে সংগৃহীত',
    featureKolkata: 'কলকাতায় অবস্থিত',
    featureKolkataSub: 'সরাসরি শপে এসে পরখ করে নেওয়ার সুযোগ',
    footerCopyright: '© ২০২৬ তূলিকা বুটিক (Tulika Boutique)। সর্বস্বত্ব সংরক্ষিত।',

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
    loginWithPassword: 'পাসওয়ার্ড দিয়ে লগইন',
    loginWithOtp: 'ম্যাজিক লিংক / ওটিপি',
    emailLabel: 'ইমেইল অ্যাড্রেস',
    passwordLabel: 'পাসওয়ার্ড',
    otpLabel: '৬ সংখ্যার ওটিপি কোড',
    sendOtpBtn: 'ওটিপি কোড পাঠান',
    sendingOtp: 'ওটিপি পাঠানো হচ্ছে...',
    verifyOtpBtn: 'ওটিপি যাচাই করে প্রবেশ করুন',
    verifyingOtp: 'যাচাই করা হচ্ছে...',
    otpSentNotice: 'আপনার ইমেইলে একটি লগইন লিংক ও ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে।',
    otpDashboardHint: 'আপনি যদি এখনও Supabase ড্যাশবোর্ডে পাসওয়ার্ড সেট না করে থাকেন, তবে এই ওটিপি কোড দিয়ে লগইন করুন অথবা ড্যাশবোর্ড থেকে পাসওয়ার্ড রিসেট করুন।',
    loginBtn: 'লগইন করুন',
    loggingIn: 'যাচাই করা হচ্ছে...',
    logoutBtn: 'লগআউট',
    unauthorizedTitle: 'অননুমোদিত ব্যবহারকারী',
    unauthorizedMsg: 'আপনার অ্যাকাউন্টটি সিস্টেমের admins টেবিলে নিবন্ধিত নয়। অনুগ্রহ করে অনুমোদিত অ্যাডমিন হিসেবে সাইন ইন করুন।',
    unauthorizedSwitchAccount: 'ভিন্ন অ্যাকাউন্ট দিয়ে লগইন করুন',
    unauthorizedRecheck: '🔄 অনুমোদন পুনরায় পরীক্ষা করুন',
    returnHome: 'মূল ওয়েবসাইটে ফিরুন',
    adminHintTitle: 'অ্যাডমিন অ্যাকাউন্ট তথ্য:',
    adminHintBody: 'নিবন্ধিত অ্যাডমিন ইমেইল palasdas2006@gmail.com। Supabase প্রকল্পে পাসওয়ার্ড সেট না থাকলে ম্যাজিক লিংক / ওটিপি ট্যাব ব্যবহার করুন অথবা Supabase ড্যাশবোর্ড থেকে পাসওয়ার্ড সেট করুন।',
    authTimeout: 'লগইন সময়সীমা উত্তীর্ণ: সার্ভার থেকে সময়মতো সাড়া পাওয়া যায়নি। অনুগ্রহ করে ইন্টারনেট চেক করে পুনরায় চেষ্টা করুন।',
    authNetworkError: 'নেটওয়ার্ক ত্রুটি: সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। আপনার ইন্টারনেট বা ডিএনএস সংযোগ পরীক্ষা করুন।',
    authInvalidCredentials: 'লগইন ব্যর্থ: ইমেইল বা পাসওয়ার্ড সঠিক নয়। আপনার তথ্য যাচাই করুন অথবা ওটিপি / ম্যাজিক লিংক ট্যাব ব্যবহার করুন।',
    authConfigError: 'কনফিগারেশন ত্রুটি: Supabase সঠিকভাবে সেটআপ করা হয়নি। js/config.js ফাইলটি পরীক্ষা করুন।',
    authEmailNotConfirmed: 'আপনার ইমেইল ভেরিফাই করা হয়নি। অনুগ্রহ করে ইনবক্স চেক করে ইমেইল ভেরিফাই করুন।',
    authRateLimit: 'অতিরিক্ত লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    authAccessDenied: 'প্রবেশাধিকার নেই: আপনার অ্যাকাউন্টটি সফলভাবে ভেরিফাই হলেও admins টেবিলে নিবন্ধিত নয়। আপনাকে স্বয়ংক্রিয়ভাবে সাইন আউট করা হয়েছে।',
    authOtpInvalid: 'ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ। অনুগ্রহ করে নতুন কোড পাঠান।',
    showPassword: 'পাসওয়ার্ড দেখুন',
    hidePassword: 'পাসওয়ার্ড লুকান',
    resendOtpIn: 'পুনরায় কোড পাঠান ({sec} সে.)',
    resendOtpBtn: 'পুনরায় ওটিপি পাঠান',
    authSmtpError: 'ইমেইল সার্ভিস সমস্যা: Supabase প্রকল্পে কাস্টম SMTP বা ইমেইল সার্ভিস সক্রিয় নেই। অনুগ্রহ করে পাসওয়ার্ড দিয়ে লগইন করুন অথবা Supabase ড্যাশবোর্ডে Authentication > Providers > Email কনফিগার করুন।',
    authOtpRateLimit: 'ওটিপি পাঠানোর নির্ধারিত সীমা অতিক্রম করেছে। Supabase প্রতি মিনিটে ১টির বেশি ওটিপি পাঠাতে দেয় না। অনুগ্রহ করে ৬০ সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করুন।',
    authUnregisteredEmail: 'এই ইমেইলটি নিবন্ধিত অ্যাডমিন অ্যাকাউন্ট নয়। অনুগ্রহ করে অনুমোদিত ইমেইল দিয়ে চেষ্টা করুন।',
    authSuccess: 'সফলভাবে লগইন হয়েছে!',
    authHelperTitle: 'সুপাবেস SQL অনুমোদন কমান্ড:',
    authHelperDesc: 'এই অ্যাকাউন্টটিকে অ্যাডমিন হিসেবে অনুমোদন করতে Supabase SQL Editor-এ নিচের কমান্ডটি চালান:',
    copySqlBtn: '📋 SQL কপি করুন',

    // Admin Dashboard Stats
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

    // Admin Table Headers
    thPhoto: 'ছবি',
    thName: 'নাম (বাংলা / ইংরেজি)',
    thCategory: 'বিভাগ',
    thPrice: 'মূল্য',
    thStock: 'স্টক',
    thStatus: 'অবস্থা',
    thActions: 'অ্যাকশন',
    thOrder: 'ক্রম',
    thNameBn: 'নাম (বাংলা)',
    thNameEn: 'নাম (ইংরেজি)',
    thSlug: 'স্লাগ',
    thAuthor: 'লেখক ও শহর',
    thRating: 'রেটিং',
    thComment: 'মন্তব্য',
    thVisibility: 'দৃশ্যমানতা',

    // Admin Controls & Forms
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
    filterAllCategories: 'সকল বিভাগ',
    searchAdminPlaceholder: 'পণ্য খুঁজুন...',
    btnAutoSku: 'অটো SKU',
    labelFabric: 'উপাদান / ফেব্রিক (Fabric/Material)',
    labelSku: 'SKU কোড (SKU Identifier)',
    labelSizes: 'উপলব্ধ মাপ / সাইজ (Available Sizes)',
    inStockOption: 'স্টকে আছে (In Stock)',
    soldOutOption: 'স্টক শেষ (Sold Out)',
    visibleOnWeb: 'পাবলিক ওয়েবসাইটে দৃশ্যমান হবে',
    phoneFormatHint: 'উদাহরণ: 919876543210 (দেশের কোড সহ শুধুমাত্র সংখ্যা)',

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

    // Customer Reviews & Moderation
    writeReviewBtn: 'মতামত জানান',
    writeReviewSubhead: 'আমাদের বুটিকের পোশাক ও পরিষেবা সম্পর্কে আপনার মূল্যবান অভিজ্ঞতা ভাগ করে নিন',
    reviewModalTitle: 'আপনার মূল্যবান মতামত জানান',
    reviewAuthorPlaceholder: 'আপনার নাম ও শহর (উদাঃ অনন্যা চ্যাটার্জী, কলকাতা)',
    reviewCommentPlaceholder: 'পোশাকের গুণমান, কাপড়ের বুনন এবং ডেলিভারি অভিজ্ঞতা সম্পর্কে লিখুন...',
    selectRating: 'রেটিং নির্বাচন করুন',
    submitReviewBtn: 'রিভিউ জমা দিন',
    submittingReview: 'জমা দেওয়া হচ্ছে...',
    reviewSuccessMsg: 'ধন্যবাদ! আপনার রিভিউটি সফলভাবে জমা হয়েছে। অ্যাডমিন পর্যালোচনার পর এটি ওয়েবসাইটে প্রকাশিত হবে।',
    reviewErrorMsg: 'রিভিউ জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    reviewValidationError: 'অনুগ্রহ করে আপনার নাম, রেটিং এবং মন্তব্য সম্পূর্ণ লিখুন।',
    reviewNoticeText: 'সুরক্ষা সুরক্ষায় আপনার মতামতটি অ্যাডমিন অনুমোদনের পর ওয়েবসাইটে প্রদর্শিত হবে।',
    noReviewsYet: 'এখনও কোনো রিভিউ প্রকাশিত হয়নি। প্রথম রিভিউটি দিতে উপরে "মতামত জানান" বাটনে চাপুন।',
    filterAllReviews: 'সকল রিভিউ',
    filterPendingReviews: 'অপেক্ষমাণ রিভিউ',
    filterPublishedReviews: 'প্রকাশিত রিভিউ',
    badgePending: 'অপেক্ষমাণ',
    badgePublished: 'প্রকাশিত',
    approveBtn: '✓ অনুমোদন করুন',
    hideBtn: 'হাইড করুন',
    statPendingReviews: 'অপেক্ষমাণ রিভিউ',
    thDate: 'তারিখ',
    noPendingReviewsMsg: 'কোনো অপেক্ষমাণ রিভিউ পাওয়া যায়নি।',

    // Admin Storage
    cleanOrphanImages: 'অব্যবহৃত ছবি খুঁজুন ও মুছুন (Clean Orphans)',
    orphanScanResult: 'অব্যবহৃত ছবির স্ক্যান সম্পন্ন',
    noOrphansFound: 'কোনো অতিরিক্ত অব্যবহৃত ছবি পাওয়া যায়নি।',
    deleteSelectedOrphans: 'অব্যবহৃত ছবিগুলি মুছে ফেলুন',

    // Pagination & Status Badges
    prevPage: 'পূর্ববর্তী',
    nextPage: 'পরবর্তী',
    pageInfo: 'পৃষ্ঠা {current} / {total}',
    visible: '✓ দৃশ্যমান',
    hidden: 'হাইড',

    // Toast & Confirmations
    toastSuccess: 'সফলভাবে সম্পন্ন হয়েছে',
    toastSaveSuccess: 'তথ্য সফলভাবে সংরক্ষিত হয়েছে',
    toastDeleteSuccess: 'সফলভাবে মুছে ফেলা হয়েছে',
    toastError: 'ত্রুটি ঘটেছে',
    logoutSuccess: 'লগআউট সম্পন্ন হয়েছে',

    // Admin Website Customization Tab & Sub-tabs
    tabCustomization: 'ওয়েবসাইট কাস্টমাইজেশন',
    subtabLogo: 'লোগো ও ব্র্যান্ড',
    subtabNav: 'হেডার ও মেনু',
    subtabHero: 'হিরো ব্যানার',
    subtabSections: 'সেকশন ও টেক্সট',
    subtabDesign: 'ডিজাইন ও কালার',

    // Logo & Brand
    logoUploadHeading: 'লোগো ছবি আপলোড ও প্রিভিউ',
    btnUploadLogo: 'নতুন লোগো আপলোড করুন',
    btnRemoveLogo: 'কাস্টম লোগো মুছুন',
    logoWidth: 'লোগো প্রস্থ (Width in px)',
    logoHeight: 'লোগো উচ্চতা (Height in px)',
    logoAlign: 'লোগো অ্যালাইনমেন্ট',
    logoAlignLeft: 'বামে (Left)',
    logoAlignCenter: 'মাঝখানে (Center)',
    logoAlignRight: 'ডানে (Right)',
    logoAltText: 'লোগো Alt টেক্সট',
    brandNameBn: 'ব্র্যান্ডের নাম (বাংলা)',
    brandNameEn: 'ব্র্যান্ডের নাম (ইংরেজি)',
    logoPreviewText: 'লোগো প্রিভিউ:',

    // Header & Navigation Editor
    headerSettings: 'হেডার বার সেটিংস',
    headerBgColor: 'হেডার ব্যাকগ্রাউন্ড কালার',
    headerTextColor: 'হেডার টেক্সট কালার',
    headerHeight: 'হেডার উচ্চতা (px)',
    logoSpacing: 'লোগো মার্জিন স্পেসিং (px)',
    navSpacing: 'মেনু আইটেম স্পেসিং (px)',
    navFontSize: 'মেনু ফন্ট সাইজ (px)',
    mobileNavToggle: 'মোবাইলে মেনু প্রদর্শন চালু রাখুন',
    navItemOrder: 'ক্রম',
    navItemTarget: 'লিংক / সেকশন আইডি (যেমন: #products)',
    navItemVisible: 'প্রদর্শিত?',

    // Hero Section Editor
    heroHeadingSettings: 'হিরো ব্যানারের বিষয়বস্তু ও ব্যানার ইমেজ',
    heroHeadlineBn: 'প্রধান শিরোনাম (বাংলা)',
    heroHeadlineEn: 'প্রধান শিরোনাম (ইংরেজি)',
    heroSubheadBn: 'উপশিরোনাম (বাংলা)',
    heroSubheadEn: 'উপশিরোনাম (ইংরেজি)',
    heroBtnLabelBn: 'বাটন টেক্সট (বাংলা)',
    heroBtnLabelEn: 'বাটন টেক্সট (ইংরেজি)',
    heroBtnTarget: 'বাটন গন্তব্য লিংক / সেকশন',
    heroBgUpload: 'হিরো ব্যাকগ্রাউন্ড ইমেজ',
    heroBgPosition: 'ইমেজ পজিশন (Background Position)',
    heroTextAlign: 'টেক্সট অ্যালাইনমেন্ট',
    heroHeight: 'হিরো সেকশন উচ্চতা (যেমন: 80vh)',
    heroBgColor: 'ব্যানার ব্যাকগ্রাউন্ড কালার',
    heroTextColor: 'ব্যানার টেক্সট কালার',

    // Section Editor
    sectionSettings: 'সাধারণ সেকশন কাস্টমাইজেশন',
    showCollectionSection: 'প্রোডাক্ট কালেকশন সেকশন প্রদর্শন করুন',
    collectionTitleBn: 'কালেকশন টাইটেল (বাংলা)',
    collectionTitleEn: 'কালেকশন টাইটেল (ইংরেজি)',
    collectionSubBn: 'কালেকশন সাবটাইটেল (বাংলা)',
    collectionSubEn: 'কালেকশন সাবটাইটেল (ইংরেজি)',
    showAboutSection: 'আমাদের কথা (About Us) সেকশন প্রদর্শন করুন',
    aboutTitleBn: 'অ্যাবাউট টাইটেল (বাংলা)',
    aboutTitleEn: 'অ্যাবাউট টাইটেল (ইংরেজি)',
    showReviewsSection: 'গ্রাহক রিভিউ সেকশন প্রদর্শন করুন',
    reviewsTitleBn: 'রিভিউ টাইটেল (বাংলা)',
    reviewsTitleEn: 'রিভিউ টাইটেল (ইংরেজি)',
    showContactSection: 'যোগাযোগ ও শপ তথ্য সেকশন প্রদর্শন করুন',
    contactTitleBn: 'কন্ট্যাক্ট টাইটেল (বাংলা)',
    contactTitleEn: 'কন্ট্যাক্ট টাইটেল (ইংরেজি)',
    contactEmail: 'যোগাযোগ ইমেইল (Email Address)',
    footerSettings: 'ফুটার ও সোশ্যাল মিডিয়া লিংক',
    footerCopyrightBn: 'কপিরাইট টেক্সট (বাংলা, {year} অটো প্রতিস্থাপন)',
    footerCopyrightEn: 'কপিরাইট টেক্সট (ইংরেজি, {year} auto replaced)',
    socialFacebook: 'ফেসবুক পেজ লিঙ্ক (Facebook URL)',
    socialInstagram: 'ইনস্টাগ্রাম লিঙ্ক (Instagram URL)',

    // Design & Theme
    designSettings: 'রঙ ও বৈশ্বিক ভিজ্যুয়াল ডিজাইন',
    primaryColor: 'প্রাথমিক ব্র্যান্ড কালার (Primary Brand Color)',
    secondaryColor: 'দ্বিতীয় পরিপূরক কালার (Secondary Color)',
    accentColor: 'জরি ও গোল্ড অ্যাকসেন্ট কালার (Accent Color)',
    pageBgColor: 'পেজ ব্যাকগ্রাউন্ড কালার (Light Mode Background)',
    textColor: 'প্রধান টেক্সট কালার (Text Color)',
    btnBorderRadius: 'বাটন বর্ডার রেডিয়াস (px)',
    cardBorderRadius: 'প্রোডাক্ট কার্ড বর্ডার রেডিয়াস (px)',
    contentMaxWidth: 'সর্বোচ্চ পেজ কনটেন্ট প্রস্থ (Content Max Width in px)',
    sectionSpacing: 'সেকশনগুলোর মাঝে ফাঁকা দূরত্ব (Vertical Spacing in px)',
    btnSaveCustomization: 'কাস্টমাইজেশন সংরক্ষণ করুন',
    btnResetCustomization: 'ডিফল্ট সেটিংসে ফিরিয়ে নিন',
    btnCancelChanges: 'পরিবর্তন বাতিল করুন',
    unsavedWarning: 'আপনার কিছু পরিবর্তন এখনও সংরক্ষিত হয়নি। সেভ না করে বের হতে চান?'
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
    navCollection: 'Collection',
    navAbout: 'About Us',
    navReviews: 'Reviews',
    navContact: 'Contact',
    themeLight: '☀️ Light',
    themeDark: '🌙 Dark',
    openMenu: 'Open Menu',
    closeMenu: 'Close Menu',
    inStockOnly: 'In-Stock Only',
    inStockTitle: 'Show only in-stock products',
    sortNewest: 'Newest Arrivals',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    fabricLabel: 'Fabric:',
    sizeLabel: 'Size:',
    allCategories: 'All Products',
    searchPlaceholder: 'Search products or category...',
    noProductsFound: 'No products found',
    noProductsSub: 'Try searching with another keyword or pick a different category.',
    clearSearch: 'Clear Search',
    clearFilters: 'Reset Filters',
    showAllProducts: 'Show All Products',
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

    // Feature highlights in About section
    featurePureWeave: '100% Authentic Weaves',
    featurePureWeaveSub: 'Directly sourced from master artisan looms',
    featureKolkata: 'Located in Kolkata',
    featureKolkataSub: 'Experience the drape in person at our boutique',
    footerCopyright: '© 2026 Tulika Boutique. All rights reserved.',

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
    loginWithPassword: 'Password Login',
    loginWithOtp: 'Magic Link / OTP',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    otpLabel: '6-Digit OTP Code',
    sendOtpBtn: 'Send OTP Code',
    sendingOtp: 'Sending OTP...',
    verifyOtpBtn: 'Verify Code & Sign In',
    verifyingOtp: 'Verifying...',
    otpSentNotice: 'A magic login link and 6-digit OTP code have been sent to your email.',
    otpDashboardHint: 'If you have not set a password in the Supabase Dashboard yet, sign in using this OTP or reset your password in the dashboard.',
    loginBtn: 'Sign In',
    loggingIn: 'Authenticating...',
    logoutBtn: 'Sign Out',
    unauthorizedTitle: 'Access Refused',
    unauthorizedMsg: 'Your account is authenticated but does not exist in the admins table. Access is restricted.',
    unauthorizedSwitchAccount: 'Sign in with a different account',
    unauthorizedRecheck: '🔄 Re-check Admin Access',
    returnHome: 'Return to Website',
    adminHintTitle: 'Admin Account Info:',
    adminHintBody: 'Registered admin email palasdas2006@gmail.com. If no password is set yet in Supabase, sign in with Magic Link / OTP or set your password in the Supabase dashboard.',
    authTimeout: 'Authentication timed out: The server did not respond in time. Please check your internet connection and try again.',
    authNetworkError: 'Network error: Unable to connect to Supabase authentication server. Please check your internet connection or DNS.',
    authInvalidCredentials: 'Sign in failed: Invalid email or password. Please verify your credentials or use the Magic Link / OTP tab.',
    authConfigError: 'Configuration error: Supabase backend is not configured properly. Check js/config.js.',
    authEmailNotConfirmed: 'Email not verified: Please check your inbox and verify your email before signing in.',
    authRateLimit: 'Too many login attempts. Please wait a moment and try again.',
    authAccessDenied: 'Access Denied: Your account is authenticated, but is not listed in the admins table. You have been signed out.',
    authOtpInvalid: 'Invalid or expired OTP code. Please request a new 6-digit code.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    resendOtpIn: 'Resend OTP in {sec}s',
    resendOtpBtn: 'Resend OTP Code',
    authSmtpError: 'Email service error: Custom SMTP or email provider is not active in Supabase. Please sign in with password or configure SMTP in the Supabase Dashboard.',
    authOtpRateLimit: 'Email sending rate limit exceeded. Supabase limits email delivery to 1 request per minute. Please wait 60 seconds before requesting another code.',
    authUnregisteredEmail: 'This email address is not registered as an administrator. Please use your authorized email address.',
    authSuccess: 'Signed in successfully!',
    authHelperTitle: 'Supabase SQL Approval Command:',
    authHelperDesc: 'Run the following command in your Supabase SQL Editor to authorize this account:',
    copySqlBtn: '📋 Copy SQL',

    // Admin Dashboard Stats
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

    // Admin Table Headers
    thPhoto: 'Photo',
    thName: 'Name (Bengali / English)',
    thCategory: 'Category',
    thPrice: 'Price',
    thStock: 'Stock',
    thStatus: 'Status',
    thActions: 'Actions',
    thOrder: 'Order',
    thNameBn: 'Name (Bengali)',
    thNameEn: 'Name (English)',
    thSlug: 'Slug',
    thAuthor: 'Author & City',
    thRating: 'Rating',
    thComment: 'Review Comment',
    thVisibility: 'Visibility',

    // Admin Controls & Forms
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
    filterAllCategories: 'All Categories',
    searchAdminPlaceholder: 'Search products...',
    btnAutoSku: 'Auto SKU',
    labelFabric: 'Fabric / Material',
    labelSku: 'SKU Identifier Code',
    labelSizes: 'Available Sizes',
    inStockOption: 'In Stock',
    soldOutOption: 'Sold Out',
    visibleOnWeb: 'Visible on Public Website',
    phoneFormatHint: 'Example: 919876543210 (digits only with country code)',

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

    // Customer Reviews & Moderation
    writeReviewBtn: 'Write a Review',
    writeReviewSubhead: 'Share your experience with our handcrafted boutique collection and customer service',
    reviewModalTitle: 'Write a Customer Review',
    reviewAuthorPlaceholder: 'Your Name & City (e.g. Ananya Chatterjee, Kolkata)',
    reviewCommentPlaceholder: 'Write about fabric quality, weave, drape, fit, or delivery experience...',
    selectRating: 'Select Star Rating',
    submitReviewBtn: 'Submit Review',
    submittingReview: 'Submitting...',
    reviewSuccessMsg: 'Thank you! Your review has been submitted successfully. It will be published on the website once approved by our team.',
    reviewErrorMsg: 'Failed to submit review. Please check your connection and try again.',
    reviewValidationError: 'Please enter your name, select a star rating, and write your review.',
    reviewNoticeText: 'For quality & safety, your review will appear publicly after approval by the boutique owner.',
    noReviewsYet: 'No customer reviews published yet. Be the first to share your experience by clicking "Write a Review".',
    filterAllReviews: 'All Reviews',
    filterPendingReviews: 'Pending Approval',
    filterPublishedReviews: 'Published',
    badgePending: 'Pending',
    badgePublished: 'Published',
    approveBtn: '✓ Approve',
    hideBtn: 'Hide',
    statPendingReviews: 'Pending Reviews',
    thDate: 'Date',
    noPendingReviewsMsg: 'No pending reviews waiting for moderation.',

    // Admin Storage
    cleanOrphanImages: 'Scan & Clean Orphan Images',
    orphanScanResult: 'Orphan Storage Scan Complete',
    noOrphansFound: 'No orphaned image files found in storage.',
    deleteSelectedOrphans: 'Delete Orphaned Images',

    // Pagination & Status Badges
    prevPage: 'Previous',
    nextPage: 'Next',
    pageInfo: 'Page {current} of {total}',
    visible: '✓ Visible',
    hidden: 'Hidden',

    // Toast & Confirmations
    toastSuccess: 'Operation completed successfully',
    toastSaveSuccess: 'Changes saved successfully',
    toastDeleteSuccess: 'Deleted successfully',
    toastError: 'An error occurred',
    logoutSuccess: 'Signed out successfully',

    // Admin Website Customization Tab & Sub-tabs
    tabCustomization: 'Website Customization',
    subtabLogo: 'Logo & Brand',
    subtabNav: 'Header & Menu',
    subtabHero: 'Hero Banner',
    subtabSections: 'Sections & Content',
    subtabDesign: 'Design & Colors',

    // Logo & Brand
    logoUploadHeading: 'Logo Image Upload & Preview',
    btnUploadLogo: 'Upload New Logo',
    btnRemoveLogo: 'Remove Custom Logo',
    logoWidth: 'Logo Width (Width in px)',
    logoHeight: 'Logo Height (Height in px)',
    logoAlign: 'Logo Alignment',
    logoAlignLeft: 'Left',
    logoAlignCenter: 'Center',
    logoAlignRight: 'Right',
    logoAltText: 'Logo Alt Text',
    brandNameBn: 'Brand Name (Bengali)',
    brandNameEn: 'Brand Name (English)',
    logoPreviewText: 'Logo Preview:',

    // Header & Navigation Editor
    headerSettings: 'Header Bar Settings',
    headerBgColor: 'Header Background Color',
    headerTextColor: 'Header Text Color',
    headerHeight: 'Header Height (px)',
    logoSpacing: 'Logo Margin Spacing (px)',
    navSpacing: 'Navigation Item Spacing (px)',
    navFontSize: 'Navigation Font Size (px)',
    mobileNavToggle: 'Keep mobile navigation menu enabled',
    navItemOrder: 'Order',
    navItemTarget: 'Link / Section ID (e.g. #products)',
    navItemVisible: 'Visible?',

    // Hero Section Editor
    heroHeadingSettings: 'Hero Banner Content & Image',
    heroHeadlineBn: 'Main Heading (Bengali)',
    heroHeadlineEn: 'Main Heading (English)',
    heroSubheadBn: 'Subtitle (Bengali)',
    heroSubheadEn: 'Subtitle (English)',
    heroBtnLabelBn: 'Button Label (Bengali)',
    heroBtnLabelEn: 'Button Label (English)',
    heroBtnTarget: 'Button Destination URL / Section',
    heroBgUpload: 'Hero Background Image',
    heroBgPosition: 'Background Position',
    heroTextAlign: 'Text Alignment',
    heroHeight: 'Hero Section Height (e.g. 80vh)',
    heroBgColor: 'Banner Background Color',
    heroTextColor: 'Banner Text Color',

    // Section Editor
    sectionSettings: 'General Section Customization',
    showCollectionSection: 'Display Product Collection Section',
    collectionTitleBn: 'Collection Title (Bengali)',
    collectionTitleEn: 'Collection Title (English)',
    collectionSubBn: 'Collection Subtitle (Bengali)',
    collectionSubEn: 'Collection Subtitle (English)',
    showAboutSection: 'Display About Us Section',
    aboutTitleBn: 'About Us Title (Bengali)',
    aboutTitleEn: 'About Us Title (English)',
    showReviewsSection: 'Display Customer Reviews Section',
    reviewsTitleBn: 'Reviews Title (Bengali)',
    reviewsTitleEn: 'Reviews Title (English)',
    showContactSection: 'Display Contact & Store Section',
    contactTitleBn: 'Contact Title (Bengali)',
    contactTitleEn: 'Contact Title (English)',
    contactEmail: 'Contact Email Address',
    footerSettings: 'Footer & Social Media Links',
    footerCopyrightBn: 'Copyright Text (Bengali, {year} replaced)',
    footerCopyrightEn: 'Copyright Text (English, {year} replaced)',
    socialFacebook: 'Facebook URL',
    socialInstagram: 'Instagram URL',

    // Design & Theme
    designSettings: 'Colors & Global Visual Design',
    primaryColor: 'Primary Brand Color',
    secondaryColor: 'Secondary Accent Color',
    accentColor: 'Zari Gold Accent Color',
    pageBgColor: 'Page Background Color (Light Mode)',
    textColor: 'Main Text Color',
    btnBorderRadius: 'Button Border Radius (px)',
    cardBorderRadius: 'Product Card Border Radius (px)',
    contentMaxWidth: 'Max Page Content Width (px)',
    sectionSpacing: 'Vertical Section Spacing (px)',
    btnSaveCustomization: 'Save Customization',
    btnResetCustomization: 'Restore Defaults',
    btnCancelChanges: 'Cancel Changes',
    unsavedWarning: 'You have unsaved changes. Are you sure you want to discard them?'
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
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
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

  // 1. Text elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[lang]?.[key]) {
      const childSpan = el.querySelector(':scope > span');
      const childSvg = el.querySelector(':scope > svg');
      const childInput = el.querySelector(':scope > input');

      if (childSpan && (childSvg || childInput)) {
        childSpan.textContent = translations[lang][key];
      } else if (!childSvg && !childInput) {
        el.textContent = translations[lang][key];
      }
    }
  });

  // 2. Input placeholders with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[lang]?.[key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // 3. Titles / tooltips with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key && translations[lang]?.[key]) {
      el.setAttribute('title', translations[lang][key]);
    }
  });

  // 3b. Accessible labels with data-i18n-aria-label
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (key && translations[lang]?.[key]) {
      el.setAttribute('aria-label', translations[lang][key]);
    }
  });

  // 4. Document title and description meta
  const titleKey = document.querySelector('meta[name="i18n-title-key"]')?.getAttribute('content');
  if (titleKey && translations[lang]?.[titleKey]) {
    document.title = translations[lang][titleKey];
  }

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && translations[lang]?.metaDesc) {
    metaDesc.setAttribute('content', translations[lang].metaDesc);
  }

  // 5. Update language toggle buttons visual state (desktop, mobile drawer, admin)
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = lang === 'bn' ? 'English' : 'বাংলা';
    btn.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
  });

  // 6. Keep theme toggle buttons localized
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeButtons(currentTheme, lang);
}

/**
 * Localized Theme Toggle Button state helper (synchronizes Desktop, Mobile Drawer, and Admin)
 */
export function updateThemeButtons(theme, lang = getCurrentLang()) {
  const isDark = theme === 'dark';
  const label = isDark
    ? (lang === 'bn' ? '☀️ আলো' : '☀️ Light')
    : (lang === 'bn' ? '🌙 অন্ধকার' : '🌙 Dark');
  const ariaLabel = isDark
    ? (lang === 'bn' ? 'হালকা থিম সক্রিয় করুন' : 'Switch to light mode')
    : (lang === 'bn' ? 'গাঢ় থিম সক্রিয় করুন' : 'Switch to dark mode');

  // Desktop public toggle
  const mainThemeText = document.getElementById('theme-btn-text');
  const mainThemeBtn = document.getElementById('theme-toggle-btn');
  if (mainThemeText) mainThemeText.textContent = label;
  if (mainThemeBtn) {
    mainThemeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    mainThemeBtn.setAttribute('aria-label', ariaLabel);
  }

  // Mobile drawer toggle
  const mobileThemeText = document.getElementById('mobile-theme-btn-text');
  const mobileThemeBtn = document.getElementById('mobile-theme-toggle-btn');
  if (mobileThemeText) mobileThemeText.textContent = label;
  if (mobileThemeBtn) {
    mobileThemeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    mobileThemeBtn.setAttribute('aria-label', ariaLabel);
  }

  // Admin portal toggle
  const adminThemeText = document.getElementById('admin-theme-text');
  const adminThemeBtn = document.getElementById('admin-theme-toggle');
  if (adminThemeText) adminThemeText.textContent = label;
  if (adminThemeBtn) {
    adminThemeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    adminThemeBtn.setAttribute('aria-label', ariaLabel);
  }
}
