// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Public Site Entry Point (js/main.js)
// ==============================================================================

import {
  getCurrentLang,
  setLang,
  t,
  formatPrice,
  applyI18nToDOM
} from './i18n.js';
import { renderSetupNotice } from './supabase.js';
import {
  getSettings,
  getCategories,
  getProducts,
  getReviews
} from './store.js';

// State
let appSettings = null;
let allCategories = [];
let activeCategoryId = 'all';
let searchQuery = '';
let currentProducts = [];
let allReviews = [];

/**
 * Clean phone number to digits only for wa.me URL
 */
function cleanPhoneForWhatsApp(phoneStr) {
  if (!phoneStr) return '919876543210';
  const digits = String(phoneStr).replace(/\D/g, '');
  return digits || '919876543210';
}

/**
 * Initialize theme (OS preference fresh, with localStorage persistence)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('tulika_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('tulika_theme', next);
    });
  }
}

/**
 * Setup language toggle
 */
function initLanguage() {
  const current = getCurrentLang();
  applyI18nToDOM(current);

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const next = getCurrentLang() === 'bn' ? 'en' : 'bn';
      setLang(next);
      applyI18nToDOM(next);
      renderCategories();
      renderProducts();
      renderReviews();
      updateSettingsDisplay();
    });
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

  if (!currentProducts || currentProducts.length === 0) {
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
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) searchInput.value = '';
        selectCategory('all');
      });
    }
    return;
  }

  grid.innerHTML = currentProducts
    .map((product) => {
      const name = isBn ? product.name_bn : product.name_en;
      const desc = isBn ? product.description_bn : product.description_en;
      const formattedPrice = formatPrice(product.price);
      const isSoldOut = product.stock_status === 'sold_out';

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

      // Order WhatsApp Message Template
      // "Hello, I want to order: [name], Category: [category], Price: ₹[price]"
      // Append "Link: [url]" only when public_image_url exists
      let orderMessage = isBn
        ? `হ্যালো তূলিকা, আমি এই পণ্যটি অর্ডার করতে চাই: ${name}, বিভাগ: ${catName}, মূল্য: ${formattedPrice}`
        : `Hello, I want to order: ${name}, Category: ${catName}, Price: ${formattedPrice}`;

      if (product.image_url && !product.image_url.startsWith('data:')) {
        orderMessage += isBn ? `\nছবি লিংক: ${product.image_url}` : `\nLink: ${product.image_url}`;
      }

      const orderWaHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(orderMessage)}`;

      // Question WhatsApp Message Template
      const askMessage = isBn
        ? `হ্যালো তূলিকা, আমি '${name}' (মূল্য: ${formattedPrice}) সম্পর্কে কিছু তথ্য জানতে চাই।`
        : `Hello Tulika, I have a question regarding '${name}' (Price: ${formattedPrice}).`;
      const askWaHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(askMessage)}`;

      // Action button: <a> to wa.me when in stock; disabled <button> with NO wa.me href when sold out!
      const orderBtnHtml = isSoldOut
        ? `<button class="btn btn-disabled" disabled aria-disabled="true">${t('soldOutButton')}</button>`
        : `<a href="${orderWaHref}" target="_blank" rel="noopener" class="btn btn-primary" aria-label="${name} অর্ডার করুন">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
               <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a12 12 0 0 0 5.8 1.5h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.3-6.2-3.6-8.4ZM12.1 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.7 9.7 0 1 1 8.4 4.6Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.1.2 2.2 3.4 5.4 4.8.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/>
             </svg>
             <span>${t('orderNow')}</span>
           </a>`;

      return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="card-media-wrapper">
            <div class="card-badges">${badgesHtml}</div>
            <img
              src="${product.image_url || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 400\'><rect width=\'400\' height=\'400\' fill=\'%23F5EFEB\'/></svg>'}"
              alt="${name}"
              class="card-img"
              loading="lazy"
              width="400"
              height="400"
            >
          </div>
          <div class="card-body">
            ${catName ? `<div class="card-category">${catName}</div>` : ''}
            <h3 class="card-title">${name}</h3>
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
                <a href="${askWaHref}" target="_blank" rel="noopener" class="btn btn-ask" aria-label="${name} সম্পর্কে প্রশ্ন করুন" title="${t('askQuestion')}">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
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
    container.innerHTML = '';
    return;
  }

  container.innerHTML = allReviews
    .map((rev) => {
      const comment = isBn ? rev.comment_bn : (rev.comment_en || rev.comment_bn);
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(Math.max(0, 5 - rev.rating));

      return `
        <article class="review-card">
          <div class="review-stars" aria-label="${rev.rating} out of 5 stars">${stars}</div>
          <p class="review-text">"${comment}"</p>
          <div class="review-author">— ${rev.author_name}</div>
        </article>
      `;
    })
    .join('');
}

/**
 * Main Initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLanguage();

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
  initSearch();
});
