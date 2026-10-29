// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Public Site Entry Point (js/main.js)
// ==============================================================================

import {
  getCurrentLang,
  setLang,
  t,
  formatPrice,
  applyI18nToDOM,
  updateThemeButtons
} from './i18n.js';
import { renderSetupNotice } from './supabase.js';
import {
  getSettings,
  getCategories,
  getProducts,
  getReviews,
  submitCustomerReview,
  formatReviewDate,
  PRODUCT_PHOTO_MAP
} from './store.js';

// State
let appSettings = null;
let allCategories = [];
let activeCategoryId = 'all';
let searchQuery = '';
let activeSort = 'newest';
let inStockOnly = false;
let currentProducts = [];
let allReviews = [];
const activeSizeSelections = new Map();
let scrollRevealObserver = null;

/**
 * Initialize IntersectionObserver for smooth scroll reveals
 * with automatic fallback and reduced-motion support
 */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
  if (!elements || elements.length === 0) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  if (!scrollRevealObserver) {
    scrollRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );
  }

  elements.forEach((el) => scrollRevealObserver.observe(el));
}

/**
 * Clean phone number to digits only for wa.me URL
 */
function cleanPhoneForWhatsApp(phoneStr) {
  if (!phoneStr) return '919876543210';
  const digits = String(phoneStr).replace(/\D/g, '');
  return digits || '919876543210';
}

/**
 * Generate luxury, conversion-optimized WhatsApp ordering URI
 * Pre-populates: Product Name, SKU, Fabric, Selected Size, Price, and CDN/Image URL
 */
function generateWhatsAppOrderUrl(product, phone, selectedSize) {
  const isBn = getCurrentLang() === 'bn';
  const name = isBn ? product.name_bn : product.name_en;
  const formattedPrice = formatPrice(product.price);
  const sku = product.sku_code || `TLK-${String(product.id || '').slice(0, 6).toUpperCase() || 'BESPOKE'}`;
  const fabric = product.fabric_type || (isBn ? 'বিশুদ্ধ তাঁত' : 'Pure Handloom');
  const size = selectedSize || (product.available_sizes && product.available_sizes[0]) || (isBn ? 'ফ্রি সাইজ' : 'Free Size');

  let orderMessage = isBn
    ? `নমস্কার তূলিকা, আমি এই আকর্ষণীয় পোশাকটি অর্ডার করতে চাই:\n` +
      `• পণ্য: ${name}\n` +
      `• SKU: ${sku}\n` +
      `• ফেব্রিক: ${fabric}\n` +
      `• সাইজ: ${size}\n` +
      `• মূল্য: ${formattedPrice}`
    : `Hello Tulika, I would like to order this handcrafted boutique piece:\n` +
      `• Item: ${name}\n` +
      `• SKU: ${sku}\n` +
      `• Fabric: ${fabric}\n` +
      `• Size: ${size}\n` +
      `• Price: ${formattedPrice}`;

  if (product.image_url && !product.image_url.startsWith('data:')) {
    orderMessage += isBn ? `\n• ছবির লিংক: ${product.image_url}` : `\n• Image: ${product.image_url}`;
  }

  orderMessage += isBn
    ? `\n\nদয়া করে প্রাপ্যতা ও ডেলিভারির বিস্তারিত তথ্য জানাবেন।`
    : `\n\nPlease let me know availability and delivery options.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`;
}

/**
 * Apply theme to document and persist in localStorage
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('tulika_theme', theme);
  updateThemeButtons(theme, getCurrentLang());
  if (appSettings?.customization) {
    applyCustomizationToDOM(appSettings.customization, getCurrentLang());
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/**
 * Initialize theme (OS preference fresh, with localStorage persistence)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('tulika_theme');
  let activeTheme = 'light';
  if (savedTheme === 'dark' || savedTheme === 'light') {
    activeTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    activeTheme = 'dark';
  }
  applyTheme(activeTheme);

  // Desktop Header Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Mobile Drawer Toggle
  const mobileThemeBtn = document.getElementById('mobile-theme-toggle-btn');
  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', toggleTheme);
  }
}

/**
 * Real-time storage synchronization (keeps Public Site and Admin in sync across tabs)
 */
function initStorageSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'tulika_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
    }
    if (e.key === 'tulika_lang' && (e.newValue === 'bn' || e.newValue === 'en')) {
      applyI18nToDOM(e.newValue);
      renderCategories();
      renderProducts();
      renderReviews();
      updateSettingsDisplay();
    }
    if (e.key === 'tulika_customization' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (appSettings) appSettings.customization = parsed;
        updateSettingsDisplay();
      } catch (err) {}
    }
  });
}

/**
 * Initialize mobile navigation toggle & drawer
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!menuBtn || !drawer) return;

  const iconMenu = menuBtn.querySelector('.icon-menu');
  const iconClose = menuBtn.querySelector('.icon-close');

  const toggleDrawer = (forceState) => {
    const isOpening = typeof forceState === 'boolean' ? forceState : !drawer.classList.contains('open');
    drawer.classList.toggle('open', isOpening);
    menuBtn.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', isOpening ? 'false' : 'true');

    if (iconMenu && iconClose) {
      iconMenu.style.display = isOpening ? 'none' : 'block';
      iconClose.style.display = isOpening ? 'block' : 'none';
    }
  };

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDrawer();
  });

  // Close when clicking any nav link in the drawer
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && !menuBtn.contains(e.target)) {
      toggleDrawer(false);
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleDrawer(false);
      menuBtn.focus();
    }
  });
}

/**
 * Setup language toggle (desktop & mobile)
 */
function initLanguage() {
  const current = getCurrentLang();
  applyI18nToDOM(current);

  const toggleLanguage = () => {
    const next = getCurrentLang() === 'bn' ? 'en' : 'bn';
    setLang(next);
    applyI18nToDOM(next);
    renderCategories();
    renderProducts();
    renderReviews();
    updateSettingsDisplay();
  };

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }

  const mobileLangBtn = document.getElementById('mobile-lang-toggle-btn');
  if (mobileLangBtn) {
    mobileLangBtn.addEventListener('click', toggleLanguage);
  }
}

/**
 * Load and apply store settings
 */
async function loadStoreSettings() {
  try {
    appSettings = await getSettings();
    updateSettingsDisplay();
  } catch (err) {
    console.warn('Failed to load store settings:', err);
  }
}

function updateSettingsDisplay() {
  if (!appSettings) return;
  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  // Store Brand Name & Tagline
  const brandName = isBn ? appSettings.store_name_bn : appSettings.store_name_en;
  const brandTagline = isBn ? appSettings.tagline_bn : appSettings.tagline_en;

  const brandEl = document.getElementById('store-brand-name');
  if (brandEl) brandEl.textContent = brandName || 'তূলিকা';

  const brandTaglineEl = document.getElementById('store-brand-tagline');
  if (brandTaglineEl) brandTaglineEl.textContent = isBn ? 'বুটিক ও হস্তশিল্প' : 'Heritage Boutique';

  // Hero Tagline
  const heroTaglineEl = document.getElementById('hero-tagline-text');
  if (heroTaglineEl && brandTagline) {
    heroTaglineEl.textContent = brandTagline;
  }

  // About Section
  const aboutText = isBn ? appSettings.about_bn : appSettings.about_en;
  const aboutEl = document.getElementById('about-store-desc');
  if (aboutEl && aboutText) aboutEl.textContent = aboutText;

  // Contact Info
  const addressText = isBn ? appSettings.address_bn : appSettings.address_en;
  const addressEl = document.getElementById('contact-address-text');
  if (addressEl && addressText) addressEl.textContent = addressText;

  const hoursText = isBn ? appSettings.hours_bn : appSettings.hours_en;
  const hoursEl = document.getElementById('contact-hours-text');
  if (hoursEl && hoursText) hoursEl.textContent = hoursText;

  const phone = appSettings.phone || '+91 98765 43210';
  const phoneEl = document.getElementById('contact-phone-link');
  if (phoneEl) {
    phoneEl.textContent = phone;
    phoneEl.href = `tel:${phone.replace(/\s+/g, '')}`;
  }

  // WhatsApp Links
  const waNumber = cleanPhoneForWhatsApp(appSettings.whatsapp);
  const heroWa = document.getElementById('hero-wa-btn');
  if (heroWa) {
    const greeting = encodeURIComponent(
      isBn
        ? 'নমস্কার তূলিকা, আমি আপনাদের আকর্ষণীয় বুটিক সম্ভার দেখতে চাই।'
        : 'Hello Tulika, I would like to explore your boutique collection.'
    );
    heroWa.href = `https://wa.me/${waNumber}?text=${greeting}`;
  }

  const floatingWa = document.getElementById('floating-wa-btn');
  if (floatingWa) {
    floatingWa.href = `https://wa.me/${waNumber}`;
  }

  const contactWa = document.getElementById('contact-wa-link');
  if (contactWa) {
    contactWa.href = `https://wa.me/${waNumber}`;
  }

  // Map Link
  const mapLink = document.getElementById('contact-map-link');
  if (mapLink && appSettings.address_en) {
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      appSettings.address_en
    )}`;
  }

  // Apply full Website Customization
  if (appSettings.customization) {
    applyCustomizationToDOM(appSettings.customization, lang);
  }
}

/**
 * Apply dynamic Website Customization to the DOM
 */
function applyCustomizationToDOM(customization, lang = getCurrentLang()) {
  if (!customization) return;
  const isBn = lang === 'bn';
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';

  // 1. Logo & Brand
  const logo = customization.logo;
  if (logo) {
    const logoImg = document.getElementById('store-logo-img');
    const defaultSvg = document.getElementById('store-default-logo-svg');
    const brandLink = document.getElementById('store-brand-link');

    if (logo.url && logoImg) {
      logoImg.src = logo.url;
      logoImg.alt = logo.alt || (isBn ? 'তূলিকা লোগো' : 'Tulika Logo');
      logoImg.style.width = logo.width ? `${logo.width}px` : 'auto';
      logoImg.style.maxHeight = logo.height ? `${logo.height}px` : '48px';
      logoImg.style.display = 'block';
      if (defaultSvg) defaultSvg.style.display = 'none';
    } else {
      if (logoImg) logoImg.style.display = 'none';
      if (defaultSvg) defaultSvg.style.display = 'block';
    }

    if (brandLink && logo.alignment) {
      if (logo.alignment === 'center') brandLink.style.justifyContent = 'center';
      else if (logo.alignment === 'right') brandLink.style.justifyContent = 'flex-end';
      else brandLink.style.justifyContent = 'flex-start';
    }

    const brandName = isBn ? (logo.brand_name_bn || appSettings?.store_name_bn) : (logo.brand_name_en || appSettings?.store_name_en);
    const brandNameEl = document.getElementById('store-brand-name');
    if (brandNameEl && brandName) brandNameEl.textContent = brandName;
  }

  // 2. Header & Navigation Links
  const header = customization.header;
  const siteHeader = document.querySelector('.site-header');
  if (header && siteHeader) {
    if (header.bg_color && !isDark) siteHeader.style.backgroundColor = header.bg_color;
    else if (!isDark) siteHeader.style.backgroundColor = '';

    if (header.height) root.style.setProperty('--header-height', `${header.height}px`);
    if (header.logo_spacing) {
      const brandText = document.getElementById('store-brand-text');
      if (brandText) brandText.style.marginLeft = `${header.logo_spacing}px`;
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.style.display = header.mobile_nav_visible === false ? 'none' : '';
    }
  }

  // Nav Items
  if (Array.isArray(customization.nav_items)) {
    const desktopNav = document.getElementById('site-nav');
    const mobileNav = document.getElementById('mobile-nav-links');

    const visibleItems = [...customization.nav_items]
      .filter((item) => item.visible !== false)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (desktopNav) {
      desktopNav.innerHTML = visibleItems
        .map((item) => {
          const label = isBn ? item.label_bn : item.label_en;
          const style = [];
          if (header?.text_color && !isDark) style.push(`color: ${header.text_color}`);
          if (header?.nav_font_size) style.push(`font-size: ${header.nav_font_size}px`);
          return `<a href="${item.target}" class="nav-link" ${style.length ? `style="${style.join(';')}"` : ''}>${label}</a>`;
        })
        .join('');
      if (header?.nav_spacing) desktopNav.style.gap = `${header.nav_spacing}px`;
    }

    if (mobileNav) {
      mobileNav.innerHTML = visibleItems
        .map((item) => `<a href="${item.target}" class="mobile-nav-link">${isBn ? item.label_bn : item.label_en}</a>`)
        .join('') + `<a href="admin.html" class="mobile-nav-link admin-link">${isBn ? 'অ্যাডমিন লগইন' : 'Admin Login'}</a>`;
    }
  }

  // 3. Hero Section
  const hero = customization.hero;
  const heroSec = document.getElementById('hero-section');
  if (hero && heroSec) {
    const titleEl = document.getElementById('hero-title');
    if (titleEl) {
      const hText = isBn ? hero.headline_bn : hero.headline_en;
      if (hText) titleEl.textContent = hText;
    }

    const subEl = document.getElementById('hero-tagline-text');
    if (subEl) {
      const sText = isBn ? hero.subhead_bn : hero.subhead_en;
      if (sText) subEl.textContent = sText;
    }

    const btnEl = document.getElementById('hero-explore-btn');
    if (btnEl) {
      const bText = isBn ? hero.btn_label_bn : hero.btn_label_en;
      if (bText) btnEl.textContent = bText;
      if (hero.btn_target) btnEl.href = hero.btn_target;
    }

    if (hero.height) heroSec.style.minHeight = hero.height;

    const heroContent = heroSec.querySelector('.hero-content');
    if (heroContent && hero.text_alignment) {
      heroContent.style.textAlign = hero.text_alignment;
    }

    if (hero.bg_image) {
      heroSec.style.backgroundImage = `url("${hero.bg_image}")`;
      heroSec.style.backgroundPosition = hero.bg_position || 'center center';
      heroSec.style.backgroundSize = 'cover';
    } else {
      heroSec.style.backgroundImage = '';
    }

    if (!isDark) {
      if (hero.bg_color) heroSec.style.backgroundColor = hero.bg_color;
      if (hero.text_color && heroContent) heroContent.style.color = hero.text_color;
    } else {
      heroSec.style.backgroundColor = '';
      if (heroContent) heroContent.style.color = '';
    }
  }

  // 4. General Sections
  const secs = customization.sections;
  if (secs) {
    // Collection
    const collSec = document.getElementById('collection');
    if (collSec && secs.collection) {
      collSec.style.display = secs.collection.visible === false ? 'none' : '';
      const cTitle = document.getElementById('collection-title');
      const cSub = document.getElementById('collection-subtitle');
      if (cTitle) cTitle.textContent = isBn ? secs.collection.title_bn : secs.collection.title_en;
      if (cSub) cSub.textContent = isBn ? secs.collection.sub_bn : secs.collection.sub_en;
    }

    // About
    const aboutSec = document.getElementById('about');
    if (aboutSec && secs.about) {
      aboutSec.style.display = secs.about.visible === false ? 'none' : '';
      const aTitle = document.getElementById('about-title');
      const aDesc = document.getElementById('about-store-desc');
      if (aTitle) aTitle.textContent = isBn ? secs.about.title_bn : secs.about.title_en;
      if (aDesc) aDesc.textContent = isBn ? secs.about.desc_bn : secs.about.desc_en;
    }

    // Reviews
    const revSec = document.getElementById('reviews');
    if (revSec && secs.reviews) {
      revSec.style.display = secs.reviews.visible === false ? 'none' : '';
      const rTitle = document.getElementById('reviews-title');
      if (rTitle) rTitle.textContent = isBn ? secs.reviews.title_bn : secs.reviews.title_en;
    }

    // Contact
    const conSec = document.getElementById('contact');
    if (conSec && secs.contact) {
      conSec.style.display = secs.contact.visible === false ? 'none' : '';
      const cTitle = document.getElementById('contact-title');
      const cAddr = document.getElementById('contact-address-text');
      if (cTitle) cTitle.textContent = isBn ? secs.contact.title_bn : secs.contact.title_en;
      if (cAddr) cAddr.textContent = isBn ? secs.contact.address_bn : secs.contact.address_en;
      const cPhone = document.getElementById('contact-phone-link');
      if (cPhone && secs.contact.phone) {
        cPhone.textContent = secs.contact.phone;
        cPhone.href = `tel:${secs.contact.phone.replace(/\s+/g, '')}`;
      }
    }

    // Footer
    const footerSec = document.getElementById('site-footer');
    if (footerSec && secs.footer) {
      const copyEl = document.getElementById('footer-copyright-text');
      if (copyEl) {
        const copyPattern = isBn ? secs.footer.copyright_bn : secs.footer.copyright_en;
        if (copyPattern) copyEl.textContent = copyPattern.replace('{year}', new Date().getFullYear());
      }

      const socialContainer = document.getElementById('footer-social-links');
      if (socialContainer) {
        let socialHtml = '';
        if (secs.footer.facebook_url) {
          socialHtml += `<a href="${secs.footer.facebook_url}" target="_blank" rel="noopener" class="footer-link" aria-label="Facebook">Facebook</a>`;
        }
        if (secs.footer.instagram_url) {
          socialHtml += `<a href="${secs.footer.instagram_url}" target="_blank" rel="noopener" class="footer-link" aria-label="Instagram">Instagram</a>`;
        }
        socialContainer.innerHTML = socialHtml;
      }
    }
  }

  // 5. Design & Colors (Theme-aware injection)
  const design = customization.design;
  if (design) {
    const btnRad = design.btn_border_radius ?? design.btn_radius;
    if (btnRad !== undefined && btnRad !== null) root.style.setProperty('--btn-radius', `${btnRad}px`);

    const cardRad = design.card_border_radius ?? design.card_radius;
    if (cardRad !== undefined && cardRad !== null) root.style.setProperty('--card-radius', `${cardRad}px`);

    const contWidth = design.content_max_width ?? design.container_max_width;
    if (contWidth !== undefined && contWidth !== null) root.style.setProperty('--container-max', `${contWidth}px`);

    const secSpacing = design.section_spacing;
    if (secSpacing !== undefined && secSpacing !== null) root.style.setProperty('--section-spacing', `${secSpacing}px`);

    if (!isDark) {
      if (design.primary_color) root.style.setProperty('--primary', design.primary_color);
      if (design.secondary_color) root.style.setProperty('--secondary', design.secondary_color);
      if (design.accent_color) root.style.setProperty('--accent', design.accent_color);
      const pageBg = design.page_bg_color || design.bg_color;
      if (pageBg) root.style.setProperty('--bg', pageBg);
      if (design.text_color) root.style.setProperty('--text-main', design.text_color);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--bg');
      root.style.removeProperty('--text-main');
    }
  }
}

/**
 * Render Category Tabs with keyboard navigation (Arrows, Home, End)
 */
async function loadCategories() {
  try {
    allCategories = await getCategories();
    renderCategories();
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

function renderCategories() {
  const tablist = document.getElementById('category-tablist');
  if (!tablist) return;

  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  tablist.innerHTML = '';

  // "All Products" tab
  const allBtn = document.createElement('button');
  allBtn.className = 'tab-btn';
  allBtn.setAttribute('role', 'tab');
  allBtn.setAttribute('id', 'tab-all');
  allBtn.setAttribute('aria-controls', 'product-grid');
  allBtn.setAttribute('aria-selected', activeCategoryId === 'all' ? 'true' : 'false');
  allBtn.setAttribute('tabindex', activeCategoryId === 'all' ? '0' : '-1');
  allBtn.textContent = isBn ? 'সকল পণ্য' : 'All Products';
  allBtn.addEventListener('click', () => selectCategory('all'));
  tablist.appendChild(allBtn);

  // Category items
  allCategories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('id', `tab-${cat.id}`);
    btn.setAttribute('aria-controls', 'product-grid');
    btn.setAttribute('aria-selected', activeCategoryId === cat.id ? 'true' : 'false');
    btn.setAttribute('tabindex', activeCategoryId === cat.id ? '0' : '-1');
    btn.textContent = isBn ? cat.name_bn : cat.name_en;
    btn.addEventListener('click', () => selectCategory(cat.id));
    tablist.appendChild(btn);
  });

  // Setup Keyboard Navigation (Arrows, Home, End)
  setupTablistKeynav(tablist);
}

function setupTablistKeynav(tablist) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      let targetIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = tabs.length - 1;
      }

      if (targetIndex !== null) {
        tabs[targetIndex].focus();
        tabs[targetIndex].click();
      }
    });
  });
}

function selectCategory(catId) {
  activeCategoryId = catId;
  const tablist = document.getElementById('category-tablist');
  if (tablist) {
    const tabs = tablist.querySelectorAll('[role="tab"]');
    tabs.forEach((tab) => {
      const isSelected =
        (catId === 'all' && tab.id === 'tab-all') || tab.id === `tab-${catId}`;
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
  }
  loadProductGrid();
}

/**
 * Render Product Grid with Skeletons, Empty State, Error State
 */
function showProductSkeletons() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = Array(4)
    .fill(0)
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-box skeleton-img"></div>
        <div class="skeleton-box skeleton-text" style="width: 40%;"></div>
        <div class="skeleton-box skeleton-text" style="width: 75%;"></div>
        <div class="skeleton-box skeleton-text" style="width: 50%;"></div>
      </div>
    `
    )
    .join('');
}

async function loadProductGrid() {
  showProductSkeletons();
  try {
    const { data } = await getProducts({
      categoryId: activeCategoryId,
      search: searchQuery,
      includeHidden: false
    });
    currentProducts = data;
    renderProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
    renderProductError();
  }
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const lang = getCurrentLang();
  const isBn = lang === 'bn';
  const waNumber = cleanPhoneForWhatsApp(appSettings?.whatsapp);

  // Apply In-Stock Filter
  let displayProducts = [...currentProducts];
  if (inStockOnly) {
    displayProducts = displayProducts.filter((p) => p.stock_status !== 'sold_out');
  }

  // Apply Sorting
  if (activeSort === 'price-asc') {
    displayProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (activeSort === 'price-desc') {
    displayProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    // 'newest' first (priority to is_new, then created_at desc)
    displayProducts.sort((a, b) => {
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }

  if (displayProducts.length === 0) {
    grid.innerHTML = `
      <div class="state-box">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>${t('noProductsFound')}</h3>
        <p>${t('noProductsSub')}</p>
        <button class="btn btn-secondary btn-sm" id="reset-search-btn">${isBn ? 'সব পণ্য দেখুন' : 'Show All Products'}</button>
      </div>
    `;
    const resetBtn = document.getElementById('reset-search-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        searchQuery = '';
        activeCategoryId = 'all';
        inStockOnly = false;
        activeSort = 'newest';
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) searchInput.value = '';
        const inStockCheckbox = document.getElementById('filter-instock-only');
        if (inStockCheckbox) inStockCheckbox.checked = false;
        const sortSelect = document.getElementById('product-sort-select');
        if (sortSelect) sortSelect.value = 'newest';
        selectCategory('all');
      });
    }
    return;
  }

  const fabricLabel = t('fabricLabel') || (isBn ? 'ফেব্রিক:' : 'Fabric:');
  const sizeLabel = t('sizeLabel') || (isBn ? 'সাইজ:' : 'Size:');

  grid.innerHTML = displayProducts
    .map((product) => {
      const name = isBn ? product.name_bn : product.name_en;
      const desc = isBn ? product.description_bn : product.description_en;
      const formattedPrice = formatPrice(product.price);
      const isSoldOut = product.stock_status === 'sold_out';
      const fabricText = product.fabric_type || (isBn ? 'বিশুদ্ধ তাঁত' : 'Pure Handloom');

      // Sizes list & selected size
      const sizes = Array.isArray(product.available_sizes) && product.available_sizes.length > 0
        ? product.available_sizes
        : ['Free Size'];
      const selectedSize = activeSizeSelections.get(product.id) || sizes[0];

      // Find category name
      const catObj = allCategories.find((c) => c.id === product.category_id);
      const catName = catObj ? (isBn ? catObj.name_bn : catObj.name_en) : '';

      // Badges
      let badgesHtml = '';
      if (isSoldOut) {
        badgesHtml += `<span class="badge badge-soldout">${t('soldOutBadge')}</span>`;
      } else {
        if (product.is_new) {
          badgesHtml += `<span class="badge badge-new">${t('newBadge')}</span>`;
        }
        if (product.is_featured) {
          badgesHtml += `<span class="badge badge-featured">${t('featured')}</span>`;
        }
      }

      // Size pills HTML
      const sizePillsHtml = sizes
        .map(
          (sz) => `
          <button
            type="button"
            class="size-pill ${sz === selectedSize ? 'active' : ''}"
            data-product-id="${product.id}"
            data-size="${sz}"
            ${isSoldOut ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isBn ? `মাপ ${sz}` : `Size ${sz}`}"
          >${sz}</button>
        `
        )
        .join('');

      // WhatsApp Order URL
      const orderWaHref = generateWhatsAppOrderUrl(product, waNumber, selectedSize);

      // Action button
      const orderBtnHtml = isSoldOut
        ? `<button class="btn btn-disabled" disabled aria-disabled="true">${t('soldOutButton')}</button>`
        : `<a href="${orderWaHref}" target="_blank" rel="noopener" class="btn btn-primary order-btn" data-product-id="${product.id}" aria-label="${name} অর্ডার করুন">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
               <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a12 12 0 0 0 5.8 1.5h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.3-6.2-3.6-8.4ZM12.1 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.7 9.7 0 1 1 8.4 4.6Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.1.2 2.2 3.4 5.4 4.8.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/>
             </svg>
             <span>${t('orderNow')}</span>
           </a>`;

      const fallbackPhoto = (product.id && PRODUCT_PHOTO_MAP[product.id]) || 'assets/images/products/jamdani-saree.jpg';
      const imgSrc = product.image_url || fallbackPhoto;

      return `
        <article class="product-card reveal-on-scroll" data-product-id="${product.id}">
          <div class="card-media-wrapper">
            <div class="card-badges">${badgesHtml}</div>
            <img
              src="${imgSrc}"
              alt="${name}"
              class="card-img"
              loading="lazy"
              width="400"
              height="533"
              onerror="this.onerror=null; this.src='${fallbackPhoto}';"
            >
          </div>
          <div class="card-body">
            ${catName ? `<div class="card-category">${catName}</div>` : ''}
            <h3 class="card-title">${name}</h3>
            <div class="card-fabric">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M20.38 3.46 16 2a8 8 0 0 1-8 7.54l-1.08 1.08a2 2 0 0 0-.54.92L6 14l-4 4 4 4 4-4 2.46-.38a2 2 0 0 0 .92-.54L14.46 16A8 8 0 0 1 22 8l-1.62-4.38Z"/>
              </svg>
              <span>${fabricLabel} ${fabricText}</span>
            </div>
            <div class="card-sizes" data-product-id="${product.id}">
              <span class="sizes-label">${sizeLabel}</span>
              <div class="size-pills">${sizePillsHtml}</div>
            </div>
            ${desc ? `<p class="card-desc">${desc}</p>` : ''}
            <div class="card-footer">
              <div class="card-price-row">
                <span class="card-price">${formattedPrice}</span>
                <span class="card-stock-label ${isSoldOut ? 'sold-out' : 'in-stock'}">
                  ${isSoldOut ? t('soldOutBadge') : t('inStock')}
                </span>
              </div>
              <div class="card-actions">
                ${orderBtnHtml}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Attach interactive size selection listeners
  grid.querySelectorAll('.size-pill:not([disabled])').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const prodId = pill.getAttribute('data-product-id');
      const chosenSize = pill.getAttribute('data-size');
      const prod = displayProducts.find((p) => String(p.id) === String(prodId));
      if (!prod) return;

      activeSizeSelections.set(prodId, chosenSize);

      const card = pill.closest('.product-card');
      if (card) {
        card.querySelectorAll('.size-pill').forEach((p) => {
          p.classList.toggle('active', p.getAttribute('data-size') === chosenSize);
        });
        const orderBtn = card.querySelector('.order-btn');
        if (orderBtn) {
          orderBtn.href = generateWhatsAppOrderUrl(prod, waNumber, chosenSize);
        }
      }
    });
  });

  // Re-observe scroll reveal elements
  initScrollReveal();
}

function renderProductError() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const isBn = getCurrentLang() === 'bn';

  grid.innerHTML = `
    <div class="state-box">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#BA1A1A" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>${isBn ? 'সংযোগ ব্যর্থ হয়েছে' : 'Connection Failed'}</h3>
      <p>${t('networkError')}</p>
      <button class="btn btn-primary btn-sm" id="retry-products-btn">${t('retry')}</button>
    </div>
  `;

  const retryBtn = document.getElementById('retry-products-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', loadProductGrid);
  }
}

/**
 * Setup Real-Time Search with Debounce
 */
function initSearch() {
  const input = document.getElementById('product-search-input');
  if (!input) return;

  let timer = null;
  input.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadProductGrid();
    }, 250);
  });
}

/**
 * Setup In-Stock and Sorting Filter Controls
 */
function initFiltersAndSort() {
  const instockCheckbox = document.getElementById('filter-instock-only');
  if (instockCheckbox) {
    instockCheckbox.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      renderProducts();
    });
  }

  const sortSelect = document.getElementById('product-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderProducts();
    });
  }
}

/**
 * Render Customer Reviews
 */
async function loadReviews() {
  try {
    allReviews = await getReviews({ includeHidden: false });
    renderReviews();
  } catch (err) {
    console.warn('Failed to load reviews:', err);
  }
}

function renderReviews() {
  const container = document.getElementById('reviews-grid');
  if (!container) return;

  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  if (!allReviews || allReviews.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--surface); border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌸</p>
        <p>${t('noReviewsYet')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allReviews
    .map((rev) => {
      const comment = isBn ? (rev.comment_bn || rev.comment_en) : (rev.comment_en || rev.comment_bn);
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(Math.max(0, 5 - rev.rating));
      const formattedDate = rev.created_at ? formatReviewDate(rev.created_at, lang) : '';

      return `
        <article class="review-card reveal-on-scroll">
          <div class="review-card-header">
            <div class="review-stars" aria-label="${rev.rating} out of 5 stars">${stars}</div>
            ${formattedDate ? `<time class="review-date" datetime="${rev.created_at}">${formattedDate}</time>` : ''}
          </div>
          <p class="review-text">"${comment}"</p>
          <div class="review-author">— ${rev.author_name}</div>
        </article>
      `;
    })
    .join('');

  initScrollReveal();
}

/**
 * Customer Review Submission Modal & Rating Controller
 */
function getStarFeedbackText(rating, lang = getCurrentLang()) {
  const isBn = lang === 'bn';
  const labels = {
    1: isBn ? '১/৫ - সন্তুষ্ট নই' : '1/5 - Poor',
    2: isBn ? '২/৫ - চলনসই' : '2/5 - Fair',
    3: isBn ? '৩/৫ - ভালো' : '3/5 - Good',
    4: isBn ? '৪/৫ - খুব ভালো' : '4/5 - Very Good',
    5: isBn ? '৫/৫ - অসাধারণ' : '5/5 - Excellent'
  };
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return `${stars} (${labels[rating] || ''})`;
}

function updateStarRatingUI(currentValue) {
  const stars = document.querySelectorAll('#customer-review-modal .star-btn');
  const ratingInput = document.getElementById('customer-review-rating');
  const feedback = document.getElementById('star-rating-feedback');
  if (ratingInput) ratingInput.value = currentValue;

  stars.forEach((btn) => {
    const val = parseInt(btn.dataset.value, 10);
    btn.classList.toggle('active', val <= currentValue);
  });

  if (feedback) {
    feedback.textContent = getStarFeedbackText(currentValue);
  }
}

function initCustomerReviews() {
  const openBtn = document.getElementById('btn-open-review-modal');
  const modal = document.getElementById('customer-review-modal');
  const closeBtn = document.getElementById('close-customer-review-modal-btn');
  const cancelBtn = document.getElementById('cancel-customer-review-btn');
  const form = document.getElementById('customer-review-form');
  const commentInput = document.getElementById('customer-review-comment');
  const charCount = document.getElementById('review-char-count');
  const errBox = document.getElementById('customer-review-alert-error');
  const successBox = document.getElementById('customer-review-alert-success');
  const formFields = document.getElementById('customer-review-form-fields');
  const footer = document.getElementById('customer-review-form-footer');
  const submitBtn = document.getElementById('submit-customer-review-btn');

  if (!openBtn || !modal || !form) return;

  const closeModal = () => {
    modal.style.display = 'none';
    form.reset();
    updateStarRatingUI(5);
    if (errBox) errBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';
    if (formFields) formFields.style.display = 'block';
    if (footer) footer.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = false;
      const isBn = getCurrentLang() === 'bn';
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = isBn ? t('submitReviewBtn') : 'Submit Review';
    }
  };

  const openModal = () => {
    closeModal();
    modal.style.display = 'flex';
    updateStarRatingUI(5);
    const authorInput = document.getElementById('customer-review-author');
    if (authorInput) authorInput.focus();
  };

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });

  // Star rating click and hover
  const stars = modal.querySelectorAll('.star-btn');
  stars.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = parseInt(btn.dataset.value, 10);
      updateStarRatingUI(val);
    });

    btn.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(btn.dataset.value, 10);
      stars.forEach((s) => {
        const val = parseInt(s.dataset.value, 10);
        s.classList.toggle('hover', val <= hoverVal);
      });
    });

    btn.addEventListener('mouseleave', () => {
      stars.forEach((s) => s.classList.remove('hover'));
    });
  });

  // Textarea character count
  commentInput?.addEventListener('input', () => {
    const len = commentInput.value.length;
    if (charCount) {
      const isBn = getCurrentLang() === 'bn';
      charCount.textContent = isBn ? String(len).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]) : len;
    }
  });

  // Review Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errBox) errBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';

    const author = document.getElementById('customer-review-author')?.value.trim();
    const rating = parseInt(document.getElementById('customer-review-rating')?.value, 10) || 5;
    const comment = commentInput?.value.trim();
    const isBn = getCurrentLang() === 'bn';

    if (!author || !comment) {
      if (errBox) {
        errBox.textContent = isBn ? t('reviewValidationError') : 'Please enter your name and review text.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = isBn ? t('submittingReview') : 'Submitting...';
    }

    try {
      await submitCustomerReview({ author_name: author, rating, comment });

      if (formFields) formFields.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (successBox) {
        successBox.textContent = isBn ? t('reviewSuccessMsg') : 'Thank you! Your review has been submitted successfully and will appear once approved by our team.';
        successBox.style.display = 'block';
      }

      // Close modal automatically after 4 seconds
      setTimeout(() => {
        closeModal();
      }, 4000);
    } catch (err) {
      console.error('Customer review submission error:', err);
      if (errBox) {
        errBox.textContent = (isBn ? t('reviewErrorMsg') : 'Failed to submit review: ') + (err.message ? ` (${err.message})` : '');
        errBox.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = isBn ? t('submitReviewBtn') : 'Submit Review';
      }
    }
  });
}

/**
 * Main Initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLanguage();
  initMobileMenu();
  initStorageSync();
  initFiltersAndSort();
  initScrollReveal();

  // Render placeholder setup warning if config has not been customized yet
  const noticeSlot = document.getElementById('setup-notice-slot');
  if (noticeSlot) {
    renderSetupNotice(noticeSlot);
  }

  // Load backend content
  await loadStoreSettings();
  await loadCategories();
  await loadProductGrid();
  await loadReviews();
  initCustomerReviews();
  initSearch();
  initScrollReveal();
  window.__STORE_READY__ = true;
});

