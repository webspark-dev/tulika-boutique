// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Admin Portal Controller (js/admin.js)
// Gated Supabase Auth + Admins Table Authorization + Full CRUD
// ==============================================================================

import {
  getCurrentLang,
  setLang,
  t,
  formatPrice,
  applyI18nToDOM
} from './i18n.js';
import { renderSetupNotice, isConfigured } from './supabase.js';
import {
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  processAndUploadImage,
  cleanOrphanImages,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  signIn,
  signOut,
  getSession,
  checkIsAdmin
} from './store.js';

// State
let currentUser = null;
let isUserAdmin = false;
let adminProducts = [];
let adminCategories = [];
let adminReviews = [];
let adminSettings = null;

let currentProductPage = 1;
const PRODUCTS_PER_PAGE = 10;
let productSearchTerm = '';
let productCategoryFilter = 'all';

// Pending confirmation callback
let confirmActionCallback = null;

/**
 * Toast Notification Helper
 */
function showToast(message, isError = false) {
  const container = document.getElementById('admin-toast-slot');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.innerHTML = `
    <span>${isError ? '⚠️' : '✓'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Custom In-Page Confirmation Modal (Replaces window.confirm)
 */
function openConfirmModal({ title, description, onConfirm }) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const descEl = document.getElementById('confirm-modal-desc');

  if (titleEl && title) titleEl.textContent = title;
  if (descEl && description) descEl.textContent = description;

  confirmActionCallback = onConfirm;
  if (modal) modal.style.display = 'flex';
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'none';
  confirmActionCallback = null;
}

/**
 * Tab Navigation
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-nav-tab');
  const panels = {
    products: document.getElementById('panel-products'),
    categories: document.getElementById('panel-categories'),
    settings: document.getElementById('panel-settings'),
    reviews: document.getElementById('panel-reviews'),
    storage: document.getElementById('panel-storage')
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(panels).forEach((key) => {
        if (panels[key]) {
          panels[key].style.display = key === target ? 'block' : 'none';
        }
      });
    });
  });
}

/**
 * Authentication Flow:
 * 1. Check existing session
 * 2. Check is_admin in admins table
 * 3. Never show dashboard if not an authorized admin
 */
async function initAuth() {
  const loginSection = document.getElementById('admin-login-section');
  const unauthorizedSection = document.getElementById('admin-unauthorized-section');
  const dashboardContainer = document.getElementById('admin-dashboard-container');
  const logoutBtn = document.getElementById('admin-logout-btn');

  // If running in placeholder mode with no Supabase configured yet:
  if (!isConfigured()) {
    // Provide demo access for visual testing in local environment
    loginSection.style.display = 'none';
    unauthorizedSection.style.display = 'none';
    dashboardContainer.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';
    await loadAllAdminData();
    return;
  }

  try {
    const session = await getSession();
    if (session && session.user) {
      currentUser = session.user;
      const isAdmin = await checkIsAdmin(currentUser);
      if (isAdmin) {
        isUserAdmin = true;
        loginSection.style.display = 'none';
        unauthorizedSection.style.display = 'none';
        dashboardContainer.style.display = 'block';
        logoutBtn.style.display = 'inline-flex';
        await loadAllAdminData();
      } else {
        // Authenticated in Supabase, but NOT in public.admins table
        loginSection.style.display = 'none';
        unauthorizedSection.style.display = 'block';
        dashboardContainer.style.display = 'none';
        logoutBtn.style.display = 'none';
      }
    } else {
      // Unauthenticated
      loginSection.style.display = 'block';
      unauthorizedSection.style.display = 'none';
      dashboardContainer.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Auth verification failed:', err);
    loginSection.style.display = 'block';
    dashboardContainer.style.display = 'none';
  }
}

function setupAuthForms() {
  const loginForm = document.getElementById('admin-login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const submitBtn = document.getElementById('login-submit-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      errorMsg.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = t('loggingIn');

      try {
        const data = await signIn(email, password);
        currentUser = data.user;
        const isAdmin = await checkIsAdmin(currentUser);

        if (!isAdmin) {
          document.getElementById('admin-login-section').style.display = 'none';
          document.getElementById('admin-unauthorized-section').style.display = 'block';
          document.getElementById('admin-dashboard-container').style.display = 'none';
          return;
        }

        isUserAdmin = true;
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard-container').style.display = 'block';
        document.getElementById('admin-logout-btn').style.display = 'inline-flex';
        await loadAllAdminData();
        showToast(t('toastSuccess'));
      } catch (err) {
        errorMsg.textContent = `লগইন ব্যর্থ: ${err.message}`;
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = t('loginBtn');
      }
    });
  }

  const handleLogout = async () => {
    try {
      await signOut();
      currentUser = null;
      isUserAdmin = false;
      document.getElementById('admin-login-section').style.display = 'block';
      document.getElementById('admin-unauthorized-section').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'none';
      document.getElementById('admin-logout-btn').style.display = 'none';
      showToast('লগআউট সম্পন্ন হয়েছে');
    } catch (err) {
      showToast(`লগআউট ত্রুটি: ${err.message}`, true);
    }
  };

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const unauthorizedLogoutBtn = document.getElementById('unauthorized-logout-btn');
  if (unauthorizedLogoutBtn) unauthorizedLogoutBtn.addEventListener('click', handleLogout);
}

/**
 * Load all Admin Datasets
 */
async function loadAllAdminData() {
  await Promise.all([
    loadAdminProducts(),
    loadAdminCategories(),
    loadAdminSettings(),
    loadAdminReviews()
  ]);
  updateDashboardStats();
}

function updateDashboardStats() {
  const total = adminProducts.length;
  const visible = adminProducts.filter((p) => p.is_visible).length;
  const soldout = adminProducts.filter((p) => p.stock_status === 'sold_out').length;

  document.getElementById('stat-total-products').textContent = total;
  document.getElementById('stat-visible-products').textContent = visible;
  document.getElementById('stat-soldout-products').textContent = soldout;
  document.getElementById('stat-categories-count').textContent = adminCategories.length;
  document.getElementById('stat-reviews-count').textContent = adminReviews.length;
}

// ==============================================================================
// PRODUCT CRUD CONTROLLER
// ==============================================================================
async function loadAdminProducts() {
  try {
    const { data } = await getProducts({
      categoryId: productCategoryFilter,
      search: productSearchTerm,
      includeHidden: true,
      page: 1,
      limit: 200
    });
    adminProducts = data;
    renderAdminProductsTable();
  } catch (err) {
    showToast(`পণ্য লোড করতে ব্যর্থ: ${err.message}`, true);
  }
}

function renderAdminProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  let filtered = [...adminProducts];
  if (productCategoryFilter !== 'all') {
    filtered = filtered.filter((p) => p.category_id === productCategoryFilter);
  }
  if (productSearchTerm.trim()) {
    const q = productSearchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name_bn.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q)
    );
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE) || 1;
  if (currentProductPage > totalPages) currentProductPage = totalPages;
  const start = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = filtered.slice(start, start + PRODUCTS_PER_PAGE);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">${t('noProductsFound')}</td></tr>`;
    renderAdminProductsPagination(totalPages);
    return;
  }

  tbody.innerHTML = pageItems
    .map((product) => {
      const cat = adminCategories.find((c) => c.id === product.category_id);
      const catName = cat ? (isBn ? cat.name_bn : cat.name_en) : '—';
      const isSoldOut = product.stock_status === 'sold_out';

      return `
        <tr>
          <td>
            <img src="${product.image_url || ''}" alt="" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);">
          </td>
          <td>
            <strong>${product.name_bn}</strong>
            <div style="font-size: 0.825rem; color: var(--text-muted);">${product.name_en}</div>
          </td>
          <td>${catName}</td>
          <td>${formatPrice(product.price)}</td>
          <td>
            <span class="badge ${isSoldOut ? 'badge-soldout' : 'badge-new'}">
              ${isSoldOut ? t('soldOutBadge') : t('inStock')}
            </span>
          </td>
          <td>
            ${product.is_visible ? '<span style="color: var(--secondary); font-weight: 600;">✓ দৃশ্যমান</span>' : '<span style="color: var(--text-muted);">হাইড</span>'}
          </td>
          <td style="text-align: right;">
            <button class="pill-btn btn-edit-prod" data-id="${product.id}" style="margin-right: 0.4rem;">${t('edit')}</button>
            <button class="pill-btn btn-del-prod" data-id="${product.id}" style="color: var(--danger); border-color: var(--danger);">${t('delete')}</button>
          </td>
        </tr>
      `;
    })
    .join('');

  renderAdminProductsPagination(totalPages);

  // Attach button events
  tbody.querySelectorAll('.btn-edit-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = adminProducts.find((p) => p.id === btn.getAttribute('data-id'));
      if (prod) openProductModal(prod);
    });
  });

  tbody.querySelectorAll('.btn-del-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = adminProducts.find((p) => p.id === btn.getAttribute('data-id'));
      if (prod) {
        openConfirmModal({
          title: `${prod.name_bn} মুছে ফেলতে চান?`,
          description: 'পণ্যটি স্থায়ীভাবে ডাটাবেজ এবং স্টোরেজ থেকে মুছে যাবে।',
          onConfirm: async () => {
            try {
              await deleteProduct(prod);
              showToast(t('toastDeleteSuccess'));
              await loadAdminProducts();
              updateDashboardStats();
            } catch (err) {
              showToast(err.message, true);
            }
          }
        });
      }
    });
  });
}

function renderAdminProductsPagination(totalPages) {
  const container = document.getElementById('admin-products-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button class="pill-btn" id="prod-prev-page" ${currentProductPage === 1 ? 'disabled' : ''}>&larr; পূর্ববর্তী</button>
    <span style="align-self: center; font-size: 0.875rem; color: var(--text-muted); padding: 0 0.5rem;">
      পৃষ্ঠা ${currentProductPage} / ${totalPages}
    </span>
    <button class="pill-btn" id="prod-next-page" ${currentProductPage === totalPages ? 'disabled' : ''}>পরবর্তী &rarr;</button>
  `;

  document.getElementById('prod-prev-page')?.addEventListener('click', () => {
    if (currentProductPage > 1) {
      currentProductPage--;
      renderAdminProductsTable();
    }
  });

  document.getElementById('prod-next-page')?.addEventListener('click', () => {
    if (currentProductPage < totalPages) {
      currentProductPage++;
      renderAdminProductsTable();
    }
  });
}

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal');
  const titleEl = document.getElementById('product-modal-title');
  const catSelect = document.getElementById('modal-product-category');

  // Populate categories dropdown
  const lang = getCurrentLang();
  catSelect.innerHTML = adminCategories
    .map(
      (c) =>
        `<option value="${c.id}">${lang === 'bn' ? c.name_bn : c.name_en}</option>`
    )
    .join('');

  if (product) {
    titleEl.textContent = t('editProduct');
    document.getElementById('modal-product-id').value = product.id;
    document.getElementById('modal-product-name-bn').value = product.name_bn || '';
    document.getElementById('modal-product-name-en').value = product.name_en || '';
    document.getElementById('modal-product-category').value = product.category_id || '';
    document.getElementById('modal-product-price').value = product.price || 0;
    document.getElementById('modal-product-stock').value = product.stock_status || 'in_stock';
    document.getElementById('modal-product-featured').checked = Boolean(product.is_featured);
    document.getElementById('modal-product-new').checked = Boolean(product.is_new);
    document.getElementById('modal-product-visible').checked = Boolean(product.is_visible);
    document.getElementById('modal-product-desc-bn').value = product.description_bn || '';
    document.getElementById('modal-product-desc-en').value = product.description_en || '';
    document.getElementById('modal-product-existing-image').value = product.image_url || '';

    const preview = document.getElementById('modal-product-preview-img');
    if (product.image_url) {
      preview.src = product.image_url;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  } else {
    titleEl.textContent = t('addProduct');
    document.getElementById('product-form').reset();
    document.getElementById('modal-product-id').value = '';
    document.getElementById('modal-product-existing-image').value = '';
    document.getElementById('modal-product-visible').checked = true;
    document.getElementById('modal-product-preview-img').style.display = 'none';
  }

  document.getElementById('modal-image-status-text').textContent = '';
  modal.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function setupProductForm() {
  const form = document.getElementById('product-form');
  const fileInput = document.getElementById('modal-product-file');
  const previewImg = document.getElementById('modal-product-preview-img');
  const statusText = document.getElementById('modal-image-status-text');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      statusText.textContent = `ফাইল নির্বাচিত: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = 'block';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-product-submit-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = t('saving');

    try {
      const id = document.getElementById('modal-product-id').value;
      const file = fileInput.files[0];
      let imageUrl = document.getElementById('modal-product-existing-image').value;

      // Handle image upload with auto-resize and EXIF stripping
      if (file) {
        statusText.textContent = 'ইমেজ রিসাইজ ও আপলোড হচ্ছে...';
        imageUrl = await processAndUploadImage(file);
      }

      const productPayload = {
        name_bn: document.getElementById('modal-product-name-bn').value.trim(),
        name_en: document.getElementById('modal-product-name-en').value.trim(),
        category_id: document.getElementById('modal-product-category').value,
        price: parseFloat(document.getElementById('modal-product-price').value) || 0,
        stock_status: document.getElementById('modal-product-stock').value,
        is_featured: document.getElementById('modal-product-featured').checked,
        is_new: document.getElementById('modal-product-new').checked,
        is_visible: document.getElementById('modal-product-visible').checked,
        description_bn: document.getElementById('modal-product-desc-bn').value.trim(),
        description_en: document.getElementById('modal-product-desc-en').value.trim(),
        image_url: imageUrl
      };

      if (id) {
        await updateProduct(id, productPayload);
        showToast(t('toastSaveSuccess'));
      } else {
        await createProduct(productPayload);
        showToast(t('toastSaveSuccess'));
      }

      closeProductModal();
      await loadAdminProducts();
      updateDashboardStats();
    } catch (err) {
      showToast(`সংরক্ষণ ব্যর্থ: ${err.message}`, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = t('save');
    }
  });
}

// ==============================================================================
// CATEGORY CRUD CONTROLLER
// ==============================================================================
async function loadAdminCategories() {
  try {
    adminCategories = await getCategories();
    renderAdminCategoriesTable();
    populateCategoryFilters();
  } catch (err) {
    showToast(`বিভাগ লোড ব্যর্থ: ${err.message}`, true);
  }
}

function populateCategoryFilters() {
  const filter = document.getElementById('admin-category-filter');
  if (!filter) return;
  const lang = getCurrentLang();
  filter.innerHTML =
    '<option value="all">সকল বিভাগ</option>' +
    adminCategories
      .map(
        (c) =>
          `<option value="${c.id}">${lang === 'bn' ? c.name_bn : c.name_en}</option>`
      )
      .join('');
}

function renderAdminCategoriesTable() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  tbody.innerHTML = adminCategories
    .map((cat, index) => {
      // Check if products reference this category
      const productCount = adminProducts.filter((p) => p.category_id === cat.id).length;
      const isBlocked = productCount > 0;

      return `
        <tr>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="pill-btn btn-sm btn-reorder-up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="উপরে তুলুন">▲</button>
              <button class="pill-btn btn-sm btn-reorder-down" data-index="${index}" ${index === adminCategories.length - 1 ? 'disabled' : ''} title="নিচে নামান">▼</button>
            </div>
          </td>
          <td><strong>${cat.name_bn}</strong></td>
          <td>${cat.name_en}</td>
          <td><code>${cat.slug}</code></td>
          <td style="text-align: right;">
            <button class="pill-btn btn-edit-cat" data-id="${cat.id}" style="margin-right: 0.4rem;">${t('edit')}</button>
            <button
              class="pill-btn btn-del-cat"
              data-id="${cat.id}"
              ${isBlocked ? 'disabled title="এই বিভাগে পণ্য রয়েছে — মুছে ফেলা সম্ভব নয়"' : ''}
              style="color: var(--danger); border-color: var(--danger);"
            >
              ${t('delete')}
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Attach reorder events
  tbody.querySelectorAll('.btn-reorder-up').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (idx > 0) {
        const temp = adminCategories[idx];
        adminCategories[idx] = adminCategories[idx - 1];
        adminCategories[idx - 1] = temp;
        await reorderCategories(adminCategories.map((c) => c.id));
        renderAdminCategoriesTable();
      }
    });
  });

  tbody.querySelectorAll('.btn-reorder-down').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (idx < adminCategories.length - 1) {
        const temp = adminCategories[idx];
        adminCategories[idx] = adminCategories[idx + 1];
        adminCategories[idx + 1] = temp;
        await reorderCategories(adminCategories.map((c) => c.id));
        renderAdminCategoriesTable();
      }
    });
  });

  // Attach Edit events
  tbody.querySelectorAll('.btn-edit-cat').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = adminCategories.find((c) => c.id === btn.getAttribute('data-id'));
      if (cat) openCategoryModal(cat);
    });
  });

  // Attach Delete events
  tbody.querySelectorAll('.btn-del-cat').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = adminCategories.find((c) => c.id === btn.getAttribute('data-id'));
      if (cat) {
        openConfirmModal({
          title: `বিভাগ '${cat.name_bn}' মুছে ফেলতে চান?`,
          description: 'বিভাগটি মুছে ফেলা হবে।',
          onConfirm: async () => {
            try {
              await deleteCategory(cat.id);
              showToast(t('toastDeleteSuccess'));
              await loadAdminCategories();
              updateDashboardStats();
            } catch (err) {
              showToast(err.message, true);
            }
          }
        });
      }
    });
  });
}

function openCategoryModal(cat = null) {
  const modal = document.getElementById('category-modal');
  const titleEl = document.getElementById('category-modal-title');

  if (cat) {
    titleEl.textContent = 'বিভাগ সম্পাদনা';
    document.getElementById('modal-category-id').value = cat.id;
    document.getElementById('modal-category-name-bn').value = cat.name_bn;
    document.getElementById('modal-category-name-en').value = cat.name_en;
    document.getElementById('modal-category-slug').value = cat.slug;
  } else {
    titleEl.textContent = t('addCategory');
    document.getElementById('category-form').reset();
    document.getElementById('modal-category-id').value = '';
  }

  modal.style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('category-modal').style.display = 'none';
}

function setupCategoryForm() {
  const form = document.getElementById('category-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-category-submit-btn');
    saveBtn.disabled = true;

    try {
      const id = document.getElementById('modal-category-id').value;
      const payload = {
        name_bn: document.getElementById('modal-category-name-bn').value.trim(),
        name_en: document.getElementById('modal-category-name-en').value.trim(),
        slug: document.getElementById('modal-category-slug').value.trim().toLowerCase()
      };

      if (id) {
        await updateCategory(id, payload);
      } else {
        await createCategory(payload);
      }

      showToast(t('toastSaveSuccess'));
      closeCategoryModal();
      await loadAdminCategories();
      updateDashboardStats();
    } catch (err) {
      showToast(`বিভাগ সংরক্ষণ ব্যর্থ: ${err.message}`, true);
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==============================================================================
// SETTINGS CONTROLLER
// ==============================================================================
async function loadAdminSettings() {
  try {
    adminSettings = await getSettings();
    if (!adminSettings) return;

    document.getElementById('setting-name-bn').value = adminSettings.store_name_bn || '';
    document.getElementById('setting-name-en').value = adminSettings.store_name_en || '';
    document.getElementById('setting-tagline-bn').value = adminSettings.tagline_bn || '';
    document.getElementById('setting-tagline-en').value = adminSettings.tagline_en || '';
    document.getElementById('setting-about-bn').value = adminSettings.about_bn || '';
    document.getElementById('setting-about-en').value = adminSettings.about_en || '';
    document.getElementById('setting-phone').value = adminSettings.phone || '';
    document.getElementById('setting-whatsapp').value = adminSettings.whatsapp || '';
    document.getElementById('setting-address-bn').value = adminSettings.address_bn || '';
    document.getElementById('setting-address-en').value = adminSettings.address_en || '';
    document.getElementById('setting-hours-bn').value = adminSettings.hours_bn || '';
    document.getElementById('setting-hours-en').value = adminSettings.hours_en || '';
  } catch (err) {
    showToast(`সেটিংস লোড ব্যর্থ: ${err.message}`, true);
  }
}

function setupSettingsForm() {
  const form = document.getElementById('admin-settings-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const waInput = document.getElementById('setting-whatsapp').value.trim();

    // Validate WhatsApp number: 8–15 digits only!
    if (!/^[0-9]{8,15}$/.test(waInput)) {
      showToast('হোয়াটসঅ্যাপ নম্বরটি ৮ থেকে ১৫ সংখ্যার মধ্যে হতে হবে (কোনো + বা স্পেস ছাড়া)', true);
      return;
    }

    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.disabled = true;

    try {
      const payload = {
        store_name_bn: document.getElementById('setting-name-bn').value.trim(),
        store_name_en: document.getElementById('setting-name-en').value.trim(),
        tagline_bn: document.getElementById('setting-tagline-bn').value.trim(),
        tagline_en: document.getElementById('setting-tagline-en').value.trim(),
        about_bn: document.getElementById('setting-about-bn').value.trim(),
        about_en: document.getElementById('setting-about-en').value.trim(),
        phone: document.getElementById('setting-phone').value.trim(),
        whatsapp: waInput,
        address_bn: document.getElementById('setting-address-bn').value.trim(),
        address_en: document.getElementById('setting-address-en').value.trim(),
        hours_bn: document.getElementById('setting-hours-bn').value.trim(),
        hours_en: document.getElementById('setting-hours-en').value.trim()
      };

      await updateSettings(payload);
      showToast(t('toastSaveSuccess'));
    } catch (err) {
      showToast(`সেটিংস আপডেট ব্যর্থ: ${err.message}`, true);
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==============================================================================
// REVIEWS CRUD CONTROLLER
// ==============================================================================
async function loadAdminReviews() {
  try {
    adminReviews = await getReviews({ includeHidden: true });
    renderAdminReviewsTable();
  } catch (err) {
    showToast(`রিভিউ লোড ব্যর্থ: ${err.message}`, true);
  }
}

function renderAdminReviewsTable() {
  const tbody = document.getElementById('admin-reviews-tbody');
  if (!tbody) return;

  tbody.innerHTML = adminReviews
    .map((rev) => {
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(Math.max(0, 5 - rev.rating));

      return `
        <tr>
          <td><strong>${rev.author_name}</strong></td>
          <td><span style="color: var(--accent);">${stars}</span></td>
          <td style="max-width: 320px; font-size: 0.875rem;">${rev.comment_bn}</td>
          <td>
            <button class="pill-btn btn-sm btn-toggle-rev-vis" data-id="${rev.id}">
              ${rev.is_visible ? '✓ প্রদর্শিত' : 'হাইড করা'}
            </button>
          </td>
          <td style="text-align: right;">
            <button class="pill-btn btn-edit-rev" data-id="${rev.id}" style="margin-right: 0.4rem;">${t('edit')}</button>
            <button class="pill-btn btn-del-rev" data-id="${rev.id}" style="color: var(--danger); border-color: var(--danger);">${t('delete')}</button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Visibility toggle
  tbody.querySelectorAll('.btn-toggle-rev-vis').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const rev = adminReviews.find((r) => r.id === btn.getAttribute('data-id'));
      if (rev) {
        try {
          await updateReview(rev.id, { is_visible: !rev.is_visible });
          showToast(t('toastSaveSuccess'));
          await loadAdminReviews();
        } catch (err) {
          showToast(err.message, true);
        }
      }
    });
  });

  // Edit Review
  tbody.querySelectorAll('.btn-edit-rev').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rev = adminReviews.find((r) => r.id === btn.getAttribute('data-id'));
      if (rev) openReviewModal(rev);
    });
  });

  // Delete Review
  tbody.querySelectorAll('.btn-del-rev').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rev = adminReviews.find((r) => r.id === btn.getAttribute('data-id'));
      if (rev) {
        openConfirmModal({
          title: 'রিভিউটি মুছে ফেলতে চান?',
          description: 'এই রিভিউটি স্থায়ীভাবে মুছে যাবে।',
          onConfirm: async () => {
            try {
              await deleteReview(rev.id);
              showToast(t('toastDeleteSuccess'));
              await loadAdminReviews();
              updateDashboardStats();
            } catch (err) {
              showToast(err.message, true);
            }
          }
        });
      }
    });
  });
}

function openReviewModal(rev = null) {
  const modal = document.getElementById('review-modal');
  const titleEl = document.getElementById('review-modal-title');

  if (rev) {
    titleEl.textContent = 'রিভিউ সম্পাদনা';
    document.getElementById('modal-review-id').value = rev.id;
    document.getElementById('modal-review-author').value = rev.author_name;
    document.getElementById('modal-review-rating').value = rev.rating;
    document.getElementById('modal-review-comment-bn').value = rev.comment_bn;
    document.getElementById('modal-review-comment-en').value = rev.comment_en || '';
    document.getElementById('modal-review-visible').checked = rev.is_visible;
  } else {
    titleEl.textContent = t('addReview');
    document.getElementById('review-form').reset();
    document.getElementById('modal-review-id').value = '';
    document.getElementById('modal-review-visible').checked = true;
  }

  modal.style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('review-modal').style.display = 'none';
}

function setupReviewForm() {
  const form = document.getElementById('review-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-review-submit-btn');
    saveBtn.disabled = true;

    try {
      const id = document.getElementById('modal-review-id').value;
      const payload = {
        author_name: document.getElementById('modal-review-author').value.trim(),
        rating: parseInt(document.getElementById('modal-review-rating').value, 10),
        comment_bn: document.getElementById('modal-review-comment-bn').value.trim(),
        comment_en: document.getElementById('modal-review-comment-en').value.trim(),
        is_visible: document.getElementById('modal-review-visible').checked
      };

      if (id) {
        await updateReview(id, payload);
      } else {
        await createReview(payload);
      }

      showToast(t('toastSaveSuccess'));
      closeReviewModal();
      await loadAdminReviews();
      updateDashboardStats();
    } catch (err) {
      showToast(`রিভিউ সংরক্ষণ ব্যর্থ: ${err.message}`, true);
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==============================================================================
// STORAGE CLEAN ORPHAN CONTROLLER
// ==============================================================================
function setupStorageTab() {
  const scanBtn = document.getElementById('scan-orphans-btn');
  const resultsBox = document.getElementById('orphan-results-box');

  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      scanBtn.disabled = true;
      scanBtn.textContent = 'স্ক্যান চলছে...';
      resultsBox.style.display = 'block';
      resultsBox.innerHTML = '<p>স্টোরেজ বাকেট বিশ্লেষণ করা হচ্ছে...</p>';

      try {
        const result = await cleanOrphanImages();
        if (result.removed === 0) {
          resultsBox.innerHTML = `
            <div style="background: #F0FFF4; border: 1px solid #9AE6B4; padding: 1rem; border-radius: 8px; color: #22543D;">
              <strong>✓ কোনো অব্যবহৃত ছবি পাওয়া যায়নি।</strong>
              <p style="font-size: 0.875rem; margin-top: 0.25rem;">মোট স্ক্যান করা ফাইল: ${result.scanned} টি। সমস্ত ফাইল পণ্যের সাথে যুক্ত রয়েছে।</p>
            </div>
          `;
        } else {
          resultsBox.innerHTML = `
            <div style="background: #FFF5F5; border: 1px solid #FEB2B2; padding: 1rem; border-radius: 8px; color: #9B2C2C;">
              <strong>✓ সফলভাবে ${result.removed} টি অব্যবহৃত ছবি মুছে ফেলা হয়েছে!</strong>
              <ul style="font-size: 0.85rem; margin-top: 0.5rem; padding-left: 1.25rem;">
                ${result.orphans.map((name) => `<li>${name}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      } catch (err) {
        resultsBox.innerHTML = `
          <div style="background: #FFF5F5; border: 1px solid #FEB2B2; padding: 1rem; border-radius: 8px; color: #9B2C2C;">
            <strong>স্ক্যান ব্যর্থ:</strong> ${err.message}
          </div>
        `;
      } finally {
        scanBtn.disabled = false;
        scanBtn.textContent = '🔍 অব্যবহৃত ছবির স্ক্যান শুরু করুন';
      }
    });
  }
}

/**
 * Global Modal Event Listeners
 */
function setupModals() {
  // Product Modal
  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal(null));
  document.getElementById('close-product-modal-btn')?.addEventListener('click', closeProductModal);
  document.getElementById('cancel-product-modal-btn')?.addEventListener('click', closeProductModal);

  // Category Modal
  document.getElementById('add-category-btn')?.addEventListener('click', () => openCategoryModal(null));
  document.getElementById('close-category-modal-btn')?.addEventListener('click', closeCategoryModal);
  document.getElementById('cancel-category-modal-btn')?.addEventListener('click', closeCategoryModal);

  // Review Modal
  document.getElementById('add-review-btn')?.addEventListener('click', () => openReviewModal(null));
  document.getElementById('close-review-modal-btn')?.addEventListener('click', closeReviewModal);
  document.getElementById('cancel-review-modal-btn')?.addEventListener('click', closeReviewModal);

  // Confirm Modal
  document.getElementById('confirm-modal-cancel-btn')?.addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-modal-ok-btn')?.addEventListener('click', () => {
    if (confirmActionCallback) {
      confirmActionCallback();
    }
    closeConfirmModal();
  });

  // Filter & Search events
  document.getElementById('admin-category-filter')?.addEventListener('change', (e) => {
    productCategoryFilter = e.target.value;
    currentProductPage = 1;
    renderAdminProductsTable();
  });

  document.getElementById('admin-product-search')?.addEventListener('input', (e) => {
    productSearchTerm = e.target.value;
    currentProductPage = 1;
    renderAdminProductsTable();
  });
}

/**
 * Setup Language toggle for Admin
 */
function setupAdminLanguage() {
  const current = getCurrentLang();
  applyI18nToDOM(current);

  const langBtn = document.getElementById('admin-lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const next = getCurrentLang() === 'bn' ? 'en' : 'bn';
      setLang(next);
      applyI18nToDOM(next);
      renderAdminProductsTable();
      renderAdminCategoriesTable();
      renderAdminReviewsTable();
    });
  }
}

/**
 * Main Initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupAdminLanguage();
  setupTabs();
  setupModals();
  setupProductForm();
  setupCategoryForm();
  setupSettingsForm();
  setupReviewForm();
  setupStorageTab();
  setupAuthForms();

  const noticeSlot = document.getElementById('admin-setup-notice-slot');
  if (noticeSlot) {
    renderSetupNotice(noticeSlot);
  }

  await initAuth();
});
