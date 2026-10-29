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
  applyI18nToDOM,
  updateThemeButtons
} from './i18n.js';
import { renderSetupNotice, isConfigured, getSupabase } from './supabase.js';
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
  formatReviewDate,
  signIn,
  signInWithOtp,
  verifyOtp,
  signOut,
  getSession,
  checkIsAdmin,
  getLastAdminCheckError,
  withTimeout,
  PRODUCT_PHOTO_MAP,
  DEFAULT_CUSTOMIZATION
} from './store.js';

// State
let currentUser = null;
let isUserAdmin = false;
let adminProducts = [];
let adminCategories = [];
let adminReviews = [];
let adminSettings = null;

// Customization State
let currentCustomization = null;
let isCustomizationDirty = false;
let uploadedLogoUrl = '';
let uploadedHeroBgUrl = '';
let editingNavItems = [];

let currentProductPage = 1;
const PRODUCTS_PER_PAGE = 10;
let productSearchTerm = '';
let productCategoryFilter = 'all';
let adminReviewFilter = 'all';

// Pending confirmation callback
let confirmActionCallback = null;

/**
 * Generate a random luxury SKU code (TLK-[6 chars])
 */
function generateRandomSku() {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TLK-${rand}`;
}

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
    customization: document.getElementById('panel-customization'),
    reviews: document.getElementById('panel-reviews'),
    storage: document.getElementById('panel-storage')
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (isCustomizationDirty && target !== 'customization') {
        showToast(t('unsavedWarning'), true);
      }
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
 * Admin Theme Controller
 */
function applyAdminTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme, getCurrentLang());
}

function initAdminTheme() {
  const savedTheme = localStorage.getItem('tulika_theme');
  let activeTheme = 'light';
  if (savedTheme === 'dark' || savedTheme === 'light') {
    activeTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    activeTheme = 'dark';
  }
  applyAdminTheme(activeTheme);

  const themeBtn = document.getElementById('admin-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tulika_theme', next);
      applyAdminTheme(next);
    });
  }
}

/**
 * Sync theme & language changes in real-time across tabs/windows
 */
function initAdminStorageSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'tulika_theme' && e.newValue) {
      applyAdminTheme(e.newValue);
    }
    if (e.key === 'tulika_lang' && e.newValue) {
      applyI18nToDOM(e.newValue);
      updateThemeButtons(document.documentElement.getAttribute('data-theme') || 'light', e.newValue);
      populateCategoryFilters();
      renderAdminProductsTable();
      renderAdminCategoriesTable();
      renderAdminReviewsTable();
    }
  });
}

/**
 * Maps any auth error into clear, language-aware user messages
 */
function formatAuthErrorMessage(err, lang = getCurrentLang()) {
  const isBn = lang === 'bn';
  const rawMsg = String(err?.message || err?.error_description || err || '');
  const msg = rawMsg.toLowerCase();
  const name = String(err?.name || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  const status = Number(err?.status || 0);

  // 1. Timeout
  if (name.includes('timeout') || code.includes('timeout') || msg.includes('timeout') || msg.includes('timed out')) {
    return isBn
      ? t('authTimeout')
      : 'Authentication timed out: The server did not respond in time. Please check your connection and try again.';
  }

  // 2. Network or DNS errors
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('fetch failed') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('err_connection_refused') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    (name === 'typeerror' && msg.includes('fetch'))
  ) {
    return isBn
      ? t('authNetworkError')
      : 'Network error: Unable to connect to authentication server. Please check your internet connection or DNS.';
  }

  // 3. Configuration errors
  if (name.includes('config') || msg.includes('config') || msg.includes('placeholder')) {
    return isBn
      ? t('authConfigError')
      : 'Configuration error: Supabase backend is not configured properly. Check js/config.js.';
  }

  // 4. Rate limit (Email rate limit vs Login attempt limit)
  if (msg.includes('over_email_send_rate_limit') || (status === 429 && msg.includes('email'))) {
    return isBn
      ? t('authOtpRateLimit')
      : 'Email sending rate limit exceeded. Supabase limits email delivery to 1 request per minute. Please wait 60 seconds before requesting another code.';
  }

  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return isBn
      ? t('authRateLimit')
      : 'Too many login attempts. Please wait a moment and try again.';
  }

  // 5. SMTP / Email Provider errors
  if (
    msg.includes('smtp') ||
    msg.includes('provider_disabled') ||
    msg.includes('email_provider_disabled') ||
    msg.includes('error sending confirmation email') ||
    msg.includes('error sending magic link') ||
    msg.includes('error sending')
  ) {
    return isBn
      ? t('authSmtpError')
      : 'Email service error: Custom SMTP or email provider is not active in Supabase. Please sign in with password or configure SMTP in the Supabase Dashboard.';
  }

  // 6. Signups disabled / unregistered email
  if (
    msg.includes('signups not allowed for otp') ||
    msg.includes('otp_disabled') ||
    msg.includes('signup requires a valid password')
  ) {
    return isBn
      ? t('authUnregisteredEmail')
      : 'This email address is not registered as an administrator. Please use your authorized email address.';
  }

  // 7. Invalid credentials
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('invalid_credentials') ||
    msg.includes('user not found')
  ) {
    return isBn
      ? `${t('authInvalidCredentials')}<br><small style="margin-top:6px; display:block; color:inherit;">আপনি যদি Supabase প্রকল্পে এখনও কোনো পাসওয়ার্ড সেট না করে থাকেন, তবে উপরের <strong>"ম্যাজিক লিংক / ওটিপি"</strong> ট্যাব ব্যবহার করে ওটিপি কোড দিয়ে সরাসরি লগইন করতে পারেন।</small>`
      : `${t('authInvalidCredentials')}<br><small style="margin-top:6px; display:block; color:inherit;">If you have not set a password yet in Supabase, sign in using the <strong>"Magic Link / OTP"</strong> tab or set a password in your Supabase dashboard.</small>`;
  }

  // 8. Email not confirmed
  if (msg.includes('email not confirmed')) {
    return isBn
      ? t('authEmailNotConfirmed')
      : 'Email not verified: Please check your inbox and verify your email before signing in.';
  }

  // 9. Invalid OTP
  if (
    (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid'))) ||
    msg.includes('otp_expired') ||
    msg.includes('token has expired')
  ) {
    return isBn
      ? t('authOtpInvalid')
      : 'Invalid or expired OTP code. Please request a new 6-digit code.';
  }

  // Fallback with sanitized message
  return isBn ? `লগইন ব্যর্থ: ${rawMsg}` : `Authentication failed: ${rawMsg}`;
}

/**
 * Renders the unauthorized access screen with account details and exact copyable SQL
 */
function displayUnauthorizedAccess(user) {
  const isBn = getCurrentLang() === 'bn';
  const email = user?.email || '';
  const uid = user?.id || '';
  const lastErr = getLastAdminCheckError();

  const loginSection = document.getElementById('admin-login-section');
  const unauthorizedSection = document.getElementById('admin-unauthorized-section');
  const dashboardContainer = document.getElementById('admin-dashboard-container');
  const logoutBtn = document.getElementById('admin-logout-btn');

  if (loginSection) loginSection.style.display = 'none';
  if (unauthorizedSection) unauthorizedSection.style.display = 'block';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'none';

  const unauthText = document.getElementById('unauthorized-detail-text');
  const helperBox = document.getElementById('unauthorized-sql-helper');
  const sqlCode = document.getElementById('unauthorized-sql-code');

  if (lastErr) {
    const rawMsg = lastErr.message || String(lastErr);
    if (unauthText) {
      unauthText.innerHTML = isBn
        ? `ডেটাবেজ পারমিশন ত্রুটি: <code>${rawMsg}</code><br><small style="margin-top:6px; display:block; color:inherit;">Supabase <code>public.admins</code> টেবিলের RLS পলিসিতে রিকার্সন বা পারমিশন ত্রুটির কারণে আপনার অ্যাডমিন স্ট্যাটাস যাচাই করা সম্ভব হয়নি।</small>`
        : `Database Policy Verification Error: <code>${rawMsg}</code><br><small style="margin-top:6px; display:block; color:inherit;">An RLS policy recursion or permission error occurred while verifying the <code>public.admins</code> table in Supabase.</small>`;
    }

    if (helperBox && sqlCode) {
      const fixSql = `-- 1. Fix RLS Policy Recursion on public.admins:
DROP POLICY IF EXISTS "Authenticated can check admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated user to read own admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated user to view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins viewable by authenticated users" ON public.admins;

CREATE POLICY "Allow authenticated user to read own admin row"
  ON public.admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admins"
  ON public.admins FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 2. Fast Non-Recursive RPC Helper Function:
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 3. Authorize account from auth.users:
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users
WHERE email = 'palasdas2006@gmail.com'
ON CONFLICT (user_id) DO NOTHING;`;

      sqlCode.textContent = fixSql;
      helperBox.style.display = 'block';
    }
  } else {
    if (unauthText) {
      unauthText.innerHTML = isBn
        ? `প্রবেশাধিকার নেই: <strong>${email || 'আপনার অ্যাকাউন্টটি'}</strong> Supabase-এ ভেরিফাইড হলেও <code>public.admins</code> টেবিলে অন্তর্ভুক্ত নয়। নিরাপত্তা সুরক্ষায় আপনাকে স্বয়ংক্রিয়ভাবে সাইন আউট করা হয়েছে।`
        : `Access Restricted: The account <strong>${email || 'Your account'}</strong> is authenticated, but does not exist in the <code>public.admins</code> table. For security, you have been signed out.`;
    }

    if (helperBox && sqlCode && uid) {
      const sql = `INSERT INTO public.admins (user_id)\nVALUES ('${uid}')\nON CONFLICT (user_id) DO NOTHING;`;
      sqlCode.textContent = sql;
      helperBox.style.display = 'block';
    }
  }

  const copyBtn = document.getElementById('btn-copy-admin-sql');
  if (copyBtn && sqlCode) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(sqlCode.textContent).then(() => {
        copyBtn.textContent = isBn ? '✓ কপি হয়েছে!' : '✓ Copied!';
        setTimeout(() => {
          copyBtn.textContent = isBn ? '📋 SQL কপি করুন' : '📋 Copy SQL';
        }, 2500);
      });
    };
  }
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

  // Check if running in demo/preview mode or placeholder mode
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = !isConfigured() || urlParams.get('demo') === '1' || urlParams.get('preview') === '1';

  if (isDemoMode) {
    if (loginSection) loginSection.style.display = 'none';
    if (unauthorizedSection) unauthorizedSection.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    await loadAllAdminData();
    return;
  }

  // Listen for Supabase auth state changes (e.g. magic link redirect)
  const sb = getSupabase();
  if (sb && sb.auth) {
    sb.auth.onAuthStateChange(async (event, session) => {
      console.log('[onAuthStateChange]', event, { hasSession: Boolean(session), isSubmitting: isAuthSubmitting });
      // If user is currently in the middle of active form submission, let the form submit handler manage it
      if (isAuthSubmitting) return;

      if (event === 'SIGNED_IN' && session?.user) {
        if (isUserAdmin) return; // Prevent duplicate execution if already authorized
        currentUser = session.user;
        const isAdmin = await checkIsAdmin(currentUser);
        if (isAdmin && !isUserAdmin) {
          isUserAdmin = true;
          if (loginSection) loginSection.style.display = 'none';
          if (unauthorizedSection) unauthorizedSection.style.display = 'none';
          if (dashboardContainer) dashboardContainer.style.display = 'block';
          if (logoutBtn) logoutBtn.style.display = 'inline-flex';
          await loadAllAdminData();
        } else if (!isAdmin) {
          displayUnauthorizedAccess(session.user);
          await signOut().catch(() => {});
          currentUser = null;
          isUserAdmin = false;
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        isUserAdmin = false;
        if (loginSection) loginSection.style.display = 'block';
        if (unauthorizedSection) unauthorizedSection.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    });
  }

  try {
    const session = await getSession();
    if (session && session.user) {
      currentUser = session.user;
      const isAdmin = await checkIsAdmin(currentUser);
      if (isAdmin) {
        isUserAdmin = true;
        if (loginSection) loginSection.style.display = 'none';
        if (unauthorizedSection) unauthorizedSection.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        await loadAllAdminData();
      } else {
        // Authenticated in Supabase, but NOT in public.admins table: show details & auto sign out
        displayUnauthorizedAccess(session.user);
        await signOut().catch(() => {});
        currentUser = null;
        isUserAdmin = false;
      }
    } else {
      // Unauthenticated
      if (loginSection) loginSection.style.display = 'block';
      if (unauthorizedSection) unauthorizedSection.style.display = 'none';
      if (dashboardContainer) dashboardContainer.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  } catch (err) {
    console.warn('Auth verification failed:', err);
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
  }
}

let authFormsInitialized = false;
let isAuthSubmitting = false;
let otpCooldownInterval = null;
let otpCooldownSeconds = 0;

function updatePasswordToggleLabels() {
  const toggleBtn = document.getElementById('toggle-password-btn');
  const passInput = document.getElementById('login-password');
  if (!toggleBtn || !passInput) return;
  const isVisible = passInput.type === 'text';
  const isBn = getCurrentLang() === 'bn';
  const label = isVisible
    ? (isBn ? t('hidePassword') || 'পাসওয়ার্ড লুকান' : 'Hide password')
    : (isBn ? t('showPassword') || 'পাসওয়ার্ড দেখুন' : 'Show password');
  toggleBtn.setAttribute('aria-label', label);
  toggleBtn.setAttribute('title', label);
  toggleBtn.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
}

function updateOtpCooldownButton() {
  const sendOtpBtn = document.getElementById('send-otp-btn');
  if (!sendOtpBtn) return;
  const isBn = getCurrentLang() === 'bn';
  if (otpCooldownSeconds > 0) {
    sendOtpBtn.textContent = isBn
      ? `পুনরায় কোড পাঠান (${otpCooldownSeconds} সে.)`
      : `Resend OTP in ${otpCooldownSeconds}s`;
    sendOtpBtn.disabled = true;
  } else {
    sendOtpBtn.textContent = isBn ? (t('sendOtpBtn') || 'ওটিপি কোড পাঠান') : 'Send OTP Code';
  }
}

function startOtpCooldown(seconds = 60) {
  if (otpCooldownInterval) {
    clearInterval(otpCooldownInterval);
    otpCooldownInterval = null;
  }
  otpCooldownSeconds = seconds;
  updateOtpCooldownButton();

  otpCooldownInterval = setInterval(() => {
    otpCooldownSeconds--;
    if (otpCooldownSeconds <= 0) {
      clearInterval(otpCooldownInterval);
      otpCooldownInterval = null;
      const sendOtpBtn = document.getElementById('send-otp-btn');
      if (sendOtpBtn) {
        sendOtpBtn.disabled = false;
        const isBn = getCurrentLang() === 'bn';
        sendOtpBtn.textContent = isBn ? (t('resendOtpBtn') || 'পুনরায় ওটিপি পাঠান') : 'Resend OTP Code';
      }
    } else {
      updateOtpCooldownButton();
    }
  }, 1000);
}

function setupPasswordToggle() {
  const toggleBtn = document.getElementById('toggle-password-btn');
  const passInput = document.getElementById('login-password');
  const eyeShow = document.getElementById('icon-eye-show');
  const eyeHide = document.getElementById('icon-eye-hide');

  if (!toggleBtn || !passInput) return;

  // Click event to toggle visibility
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isCurrentlyPassword = passInput.type === 'password';
    if (isCurrentlyPassword) {
      passInput.type = 'text';
      if (eyeShow) eyeShow.style.display = 'none';
      if (eyeHide) eyeHide.style.display = 'inline-block';
    } else {
      passInput.type = 'password';
      if (eyeShow) eyeShow.style.display = 'inline-block';
      if (eyeHide) eyeHide.style.display = 'none';
    }
    updatePasswordToggleLabels();
    passInput.focus();
  });

  // Accessible keyboard support (Enter and Space)
  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  updatePasswordToggleLabels();
}

function setupAuthForms() {
  if (authFormsInitialized) return;
  authFormsInitialized = true;

  // Initialize password visibility toggle
  setupPasswordToggle();

  const loginForm = document.getElementById('admin-login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const submitBtn = document.getElementById('login-submit-btn');

  // Mode Tabs (Password vs OTP)
  const tabPassword = document.getElementById('tab-login-password');
  const tabOtp = document.getElementById('tab-login-otp');
  const otpContainer = document.getElementById('admin-otp-container');

  if (tabPassword && tabOtp && otpContainer && loginForm) {
    tabPassword.addEventListener('click', () => {
      tabPassword.setAttribute('aria-selected', 'true');
      tabOtp.setAttribute('aria-selected', 'false');
      loginForm.style.display = 'block';
      otpContainer.style.display = 'none';
    });

    tabOtp.addEventListener('click', () => {
      tabOtp.setAttribute('aria-selected', 'true');
      tabPassword.setAttribute('aria-selected', 'false');
      otpContainer.style.display = 'block';
      loginForm.style.display = 'none';
    });
  }

  // 1. Password Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isAuthSubmitting) return;

      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      const isBn = getCurrentLang() === 'bn';

      if (!email || !password) {
        if (errorMsg) {
          errorMsg.textContent = isBn
            ? 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড উভয়ই লিখুন।'
            : 'Please enter both email address and password.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (errorMsg) errorMsg.style.display = 'none';
      const helperBox = document.getElementById('unauthorized-sql-helper');
      if (helperBox) helperBox.style.display = 'none';
      isAuthSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isBn ? t('loggingIn') : 'Authenticating...';
      }

      try {
        console.log('[Login Diagnostic] Submitting signIn with email:', email);
        const data = await signIn(email, password);
        console.log('[Login Diagnostic] signIn succeeded:', {
          userId: data?.user?.id,
          userEmail: data?.user?.email,
          hasSession: Boolean(data?.session),
          accessTokenPresent: Boolean(data?.session?.access_token),
          tokenExpiry: data?.session?.expires_at
        });

        currentUser = data.user;
        const isAdmin = await checkIsAdmin(currentUser);
        console.log('[Login Diagnostic] checkIsAdmin result:', isAdmin);

        if (!isAdmin) {
          // Immediately sign out unauthorized user per Requirement 8
          displayUnauthorizedAccess(currentUser);
          await signOut().catch(() => {});
          currentUser = null;
          isUserAdmin = false;
          return;
        }

        // User is an authorized admin
        isUserAdmin = true;
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-unauthorized-section').style.display = 'none';
        document.getElementById('admin-dashboard-container').style.display = 'block';
        document.getElementById('admin-logout-btn').style.display = 'inline-flex';
        showToast(isBn ? t('authSuccess') : 'Signed in successfully!');
        await loadAllAdminData();
      } catch (err) {
        if (errorMsg) {
          errorMsg.innerHTML = formatAuthErrorMessage(err, getCurrentLang());
          errorMsg.style.display = 'block';
        }
      } finally {
        isAuthSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = isBn ? t('loginBtn') : 'Sign In';
        }
      }
    });
  }

  // 2. OTP / Magic Link Request
  const sendOtpForm = document.getElementById('admin-send-otp-form');
  const verifyOtpForm = document.getElementById('admin-verify-otp-form');
  const otpErrorMsg = document.getElementById('otp-error-msg');
  const otpSuccessMsg = document.getElementById('otp-success-msg');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');

  let activeOtpEmail = '';

  if (sendOtpForm) {
    sendOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isAuthSubmitting || otpCooldownSeconds > 0) return;

      const emailEl = document.getElementById('otp-email');
      activeOtpEmail = emailEl ? emailEl.value.trim() : '';
      const isBn = getCurrentLang() === 'bn';

      if (!activeOtpEmail) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = isBn ? 'অনুগ্রহ করে একটি সঠিক ইমেইল লিখুন।' : 'Please enter a valid email address.';
          otpErrorMsg.style.display = 'block';
        }
        return;
      }

      if (otpErrorMsg) otpErrorMsg.style.display = 'none';
      if (otpSuccessMsg) otpSuccessMsg.style.display = 'none';

      isAuthSubmitting = true;
      if (sendOtpBtn) {
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = isBn ? t('sendingOtp') : 'Sending OTP...';
      }

      try {
        await signInWithOtp(activeOtpEmail);
        if (otpSuccessMsg) {
          otpSuccessMsg.textContent = isBn
            ? `${activeOtpEmail} ঠিকানায় ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে। আপনার ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`
            : `A 6-digit OTP code has been successfully sent to ${activeOtpEmail}. Please check your inbox or spam folder.`;
          otpSuccessMsg.style.display = 'block';
        }
        if (verifyOtpForm) {
          verifyOtpForm.style.display = 'block';
          const codeInput = document.getElementById('otp-code');
          if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
          }
        }
        // Start 60-second cooldown timer to prevent rate limit lockout
        startOtpCooldown(60);
      } catch (err) {
        if (otpErrorMsg) {
          otpErrorMsg.innerHTML = formatAuthErrorMessage(err, getCurrentLang());
          otpErrorMsg.style.display = 'block';
        }
        // If rate limited by Supabase, apply cooldown
        const errStr = String(err?.message || '').toLowerCase();
        if (errStr.includes('rate limit') || errStr.includes('over_email_send_rate_limit')) {
          startOtpCooldown(60);
        }
      } finally {
        isAuthSubmitting = false;
        if (otpCooldownSeconds <= 0 && sendOtpBtn) {
          sendOtpBtn.disabled = false;
          sendOtpBtn.textContent = isBn ? t('sendOtpBtn') : 'Send OTP Code';
        }
      }
    });
  }

  // 3. OTP Code Verification
  if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isAuthSubmitting) return;

      const codeInput = document.getElementById('otp-code');
      const code = codeInput ? codeInput.value.trim().replace(/\s+/g, '') : '';
      const isBn = getCurrentLang() === 'bn';

      if (!activeOtpEmail) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = isBn ? 'ইমেইল ঠিকানা পাওয়া যায়নি। অনুগ্রহ করে পুনরায় ওটিপি পাঠান।' : 'Email address not found. Please request an OTP first.';
          otpErrorMsg.style.display = 'block';
        }
        return;
      }

      if (!code || code.length !== 6) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = isBn ? 'অনুগ্রহ করে সঠিক ৬ সংখ্যার ওটিপি কোড লিখুন।' : 'Please enter a valid 6-digit OTP code.';
          otpErrorMsg.style.display = 'block';
        }
        if (codeInput) codeInput.focus();
        return;
      }

      if (otpErrorMsg) otpErrorMsg.style.display = 'none';

      isAuthSubmitting = true;
      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = isBn ? t('verifyingOtp') : 'Verifying...';
      }

      try {
        const data = await verifyOtp(activeOtpEmail, code);
        currentUser = data.user;
        const isAdmin = await checkIsAdmin(currentUser);

        if (!isAdmin) {
          // Immediately sign out unauthorized user per Requirement 8
          displayUnauthorizedAccess(currentUser);
          await signOut().catch(() => {});
          currentUser = null;
          isUserAdmin = false;
          return;
        }

        // User is an authorized admin
        isUserAdmin = true;
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-unauthorized-section').style.display = 'none';
        document.getElementById('admin-dashboard-container').style.display = 'block';
        document.getElementById('admin-logout-btn').style.display = 'inline-flex';
        showToast(isBn ? t('authSuccess') : 'Signed in successfully!');
        await loadAllAdminData();
      } catch (err) {
        if (otpErrorMsg) {
          otpErrorMsg.innerHTML = formatAuthErrorMessage(err, getCurrentLang());
          otpErrorMsg.style.display = 'block';
        }
      } finally {
        isAuthSubmitting = false;
        if (verifyOtpBtn) {
          verifyOtpBtn.disabled = false;
          verifyOtpBtn.textContent = isBn ? t('verifyOtpBtn') : 'Verify Code & Sign In';
        }
      }
    });
  }

  const handleLogout = async () => {
    try {
      if (otpCooldownInterval) {
        clearInterval(otpCooldownInterval);
        otpCooldownInterval = null;
      }
      otpCooldownSeconds = 0;

      await signOut();
      currentUser = null;
      isUserAdmin = false;
      document.getElementById('admin-login-section').style.display = 'block';
      document.getElementById('admin-unauthorized-section').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'none';
      document.getElementById('admin-logout-btn').style.display = 'none';

      // Restore submit buttons and input states to clean state
      const isBn = getCurrentLang() === 'bn';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isBn ? t('loginBtn') : 'Sign In';
      }
      if (sendOtpBtn) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = isBn ? t('sendOtpBtn') : 'Send OTP Code';
      }
      if (errorMsg) errorMsg.style.display = 'none';
      if (otpErrorMsg) otpErrorMsg.style.display = 'none';
      if (otpSuccessMsg) otpSuccessMsg.style.display = 'none';

      const passInput = document.getElementById('login-password');
      if (passInput) {
        passInput.value = '';
        passInput.type = 'password';
        const eyeShow = document.getElementById('icon-eye-show');
        const eyeHide = document.getElementById('icon-eye-hide');
        if (eyeShow) eyeShow.style.display = 'inline-block';
        if (eyeHide) eyeHide.style.display = 'none';
        updatePasswordToggleLabels();
      }

      const helperBox = document.getElementById('unauthorized-sql-helper');
      if (helperBox) helperBox.style.display = 'none';

      showToast(isBn ? 'সফলভাবে লগআউট হয়েছে।' : 'Signed out successfully.');
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
  await Promise.allSettled([
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
  const totalCategories = adminCategories.length;
  const totalReviews = adminReviews.length;
  const pendingReviews = adminReviews.filter((r) => !r.is_visible).length;
  const publishedReviews = adminReviews.filter((r) => r.is_visible).length;

  const totalEl = document.getElementById('stat-total-products');
  if (totalEl) totalEl.textContent = total;
  const visibleEl = document.getElementById('stat-visible-products');
  if (visibleEl) visibleEl.textContent = visible;
  const soldoutEl = document.getElementById('stat-soldout-products');
  if (soldoutEl) soldoutEl.textContent = soldout;
  const catEl = document.getElementById('stat-categories-count');
  if (catEl) catEl.textContent = totalCategories;
  const revEl = document.getElementById('stat-reviews-count');
  if (revEl) revEl.textContent = totalReviews;

  const pendingStat = document.getElementById('stat-pending-reviews-count');
  if (pendingStat) pendingStat.textContent = pendingReviews;

  const countAll = document.getElementById('count-all-reviews');
  if (countAll) countAll.textContent = totalReviews;
  const countPending = document.getElementById('count-pending-reviews');
  if (countPending) countPending.textContent = pendingReviews;
  const countPub = document.getElementById('count-published-reviews');
  if (countPub) countPub.textContent = publishedReviews;

  // Toggle empty catalog notice if neither products nor categories exist
  const emptyNotice = document.getElementById('admin-empty-catalog-notice');
  if (emptyNotice) {
    emptyNotice.style.display = (total === 0 && totalCategories === 0) ? 'block' : 'none';
  }
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
    const isFiltered = productCategoryFilter !== 'all' || productSearchTerm.trim().length > 0;
    const emptyMsg = isFiltered
      ? (isBn ? 'এই ফিল্টারে কোনো পণ্য পাওয়া যায়নি।' : 'No products matched this filter.')
      : (isBn ? 'এখনো কোনো পণ্য তৈরি করা হয়নি। নতুন পণ্য যোগ করতে "+ নতুন পণ্য যোগ করুন" বাটনে ক্লিক করুন।' : 'No products created yet. Click "+ Add New Product" to create your first product.');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); line-height: 1.6;">${emptyMsg}</td></tr>`;
    renderAdminProductsPagination(totalPages);
    return;
  }

  tbody.innerHTML = pageItems
    .map((product) => {
      const cat = adminCategories.find((c) => c.id === product.category_id);
      const catName = cat ? (isBn ? cat.name_bn : cat.name_en) : '—';
      const isSoldOut = product.stock_status === 'sold_out';

      const fallbackPhoto = (product.id && PRODUCT_PHOTO_MAP[product.id]) || 'assets/images/products/jamdani-saree.jpg';
      const imgSrc = product.image_url || fallbackPhoto;

      return `
        <tr>
          <td>
            <img src="${imgSrc}" alt="" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.onerror=null; this.src='${fallbackPhoto}';">
          </td>
          <td>
            <strong>${product.name_bn}</strong>
            <div style="font-size: 0.825rem; color: var(--text-muted);">${product.name_en}</div>
            <div style="font-size: 0.75rem; color: var(--accent); margin-top: 3px; display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              ${product.sku_code ? `<span style="font-family: monospace; font-size: 0.72rem; background: var(--bg-subtle); padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border);">${product.sku_code}</span>` : ''}
              <span>${product.fabric_type || 'Pure Handloom'}</span>
              ${Array.isArray(product.available_sizes) && product.available_sizes.length ? `<span style="color: var(--text-muted);">(${product.available_sizes.join(', ')})</span>` : ''}
            </div>
          </td>
          <td>${catName}</td>
          <td>${formatPrice(product.price)}</td>
          <td>
            <span class="badge ${isSoldOut ? 'badge-soldout' : 'badge-new'}">
              ${isSoldOut ? t('soldOutBadge') : t('inStock')}
            </span>
          </td>
          <td>
            ${product.is_visible ? `<span style="color: var(--secondary); font-weight: 600;">${t('visible')}</span>` : `<span style="color: var(--text-muted);">${t('hidden')}</span>`}
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
          title: isBn ? `${prod.name_bn} মুছে ফেলতে চান?` : `Delete "${prod.name_en || prod.name_bn}"?`,
          description: isBn ? 'পণ্যটি স্থায়ীভাবে ডাটাবেজ এবং স্টোরেজ থেকে মুছে যাবে।' : 'This product will be permanently deleted from database and storage.',
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
    <button class="pill-btn" id="prod-prev-page" ${currentProductPage === 1 ? 'disabled' : ''}>&larr; ${t('prevPage')}</button>
    <span style="align-self: center; font-size: 0.875rem; color: var(--text-muted); padding: 0 0.5rem;">
      ${t('pageInfo', { current: currentProductPage, total: totalPages })}
    </span>
    <button class="pill-btn" id="prod-next-page" ${currentProductPage === totalPages ? 'disabled' : ''}>${t('nextPage')} &rarr;</button>
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
  const isBn = getCurrentLang() === 'bn';
  const btnRemoveImg = document.getElementById('btn-remove-product-image');

  // Populate categories dropdown
  const lang = getCurrentLang();
  if (adminCategories.length === 0) {
    catSelect.innerHTML = `<option value="" disabled selected>${isBn ? '-- কোনো বিভাগ নেই (প্রথমে বিভাগ তৈরি করুন) --' : '-- No categories found (create category first) --'}</option>`;
    showToast(isBn ? 'পণ্য তৈরি করার আগে অনুগ্রহ করে কমপক্ষে একটি বিভাগ তৈরি করুন।' : 'Please create at least one category before adding products.', true);
  } else {
    catSelect.innerHTML = adminCategories
      .map(
        (c) =>
          `<option value="${c.id}">${lang === 'bn' ? c.name_bn : c.name_en}</option>`
      )
      .join('');
  }

  if (product) {
    titleEl.textContent = t('editProduct');
    document.getElementById('modal-product-id').value = product.id;
    document.getElementById('modal-product-name-bn').value = product.name_bn || '';
    document.getElementById('modal-product-name-en').value = product.name_en || '';
    document.getElementById('modal-product-category').value = product.category_id || '';
    document.getElementById('modal-product-price').value = product.price || 0;
    document.getElementById('modal-product-fabric').value = product.fabric_type || 'Pure Handloom';
    document.getElementById('modal-product-sku').value = product.sku_code || generateRandomSku();
    document.getElementById('modal-product-stock').value = product.stock_status || 'in_stock';
    document.getElementById('modal-product-featured').checked = Boolean(product.is_featured);
    document.getElementById('modal-product-new').checked = Boolean(product.is_new);
    document.getElementById('modal-product-visible').checked = Boolean(product.is_visible);
    document.getElementById('modal-product-desc-bn').value = product.description_bn || '';
    document.getElementById('modal-product-desc-en').value = product.description_en || '';
    document.getElementById('modal-product-existing-image').value = product.image_url || '';

    // Check sizes
    const currentSizes = Array.isArray(product.available_sizes) && product.available_sizes.length > 0
      ? product.available_sizes
      : ['Free Size'];
    document.querySelectorAll('input[name="product-size"]').forEach((cb) => {
      cb.checked = currentSizes.includes(cb.value);
    });

    const preview = document.getElementById('modal-product-preview-img');
    if (product.image_url) {
      preview.src = product.image_url;
      preview.style.display = 'block';
      if (btnRemoveImg) btnRemoveImg.style.display = 'inline-block';
    } else {
      preview.style.display = 'none';
      if (btnRemoveImg) btnRemoveImg.style.display = 'none';
    }
  } else {
    titleEl.textContent = t('addProduct');
    document.getElementById('product-form').reset();
    document.getElementById('modal-product-id').value = '';
    document.getElementById('modal-product-fabric').value = 'Pure Handloom';
    document.getElementById('modal-product-sku').value = generateRandomSku();
    document.getElementById('modal-product-existing-image').value = '';
    document.getElementById('modal-product-visible').checked = true;
    document.querySelectorAll('input[name="product-size"]').forEach((cb) => {
      cb.checked = cb.value === 'Free Size';
    });
    document.getElementById('modal-product-preview-img').style.display = 'none';
    if (btnRemoveImg) btnRemoveImg.style.display = 'none';
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
  const btnRemoveImg = document.getElementById('btn-remove-product-image');

  // Remove image button
  if (btnRemoveImg) {
    btnRemoveImg.addEventListener('click', () => {
      document.getElementById('modal-product-existing-image').value = '';
      fileInput.value = '';
      previewImg.src = '';
      previewImg.style.display = 'none';
      btnRemoveImg.style.display = 'none';
      const isBn = getCurrentLang() === 'bn';
      statusText.textContent = isBn ? 'ছবি সরানো হয়েছে।' : 'Image removed.';
      statusText.style.color = 'var(--text-muted)';
    });
  }

  // Auto-generate SKU button listener
  const btnGenSku = document.getElementById('btn-generate-sku');
  if (btnGenSku) {
    btnGenSku.addEventListener('click', () => {
      document.getElementById('modal-product-sku').value = generateRandomSku();
    });
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const isBn = getCurrentLang() === 'bn';
    if (!file) {
      statusText.textContent = '';
      return;
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (file.type && !allowedMime.includes(file.type)) {
      statusText.textContent = isBn ? 'ত্রুটি: শুধুমাত্র JPG, PNG, WEBP বা SVG ফাইল গ্রহণযোগ্য।' : 'Error: Only JPG, PNG, WEBP, or SVG files allowed.';
      statusText.style.color = 'var(--danger)';
      previewImg.style.display = 'none';
      if (btnRemoveImg) btnRemoveImg.style.display = 'none';
      fileInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      statusText.textContent = isBn ? `ত্রুটি: ফাইলের আকার (${sizeMb} MB) অতিরিক্ত বড় (সর্বোচ্চ ৫ MB)।` : `Error: File size (${sizeMb} MB) exceeds 5 MB limit.`;
      statusText.style.color = 'var(--danger)';
      previewImg.style.display = 'none';
      if (btnRemoveImg) btnRemoveImg.style.display = 'none';
      fileInput.value = '';
      return;
    }

    statusText.textContent = isBn
      ? `ফাইল নির্বাচিত: ${file.name} (${Math.round(file.size / 1024)} KB)`
      : `File selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    statusText.style.color = 'var(--text-muted)';
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = 'block';
    if (btnRemoveImg) btnRemoveImg.style.display = 'inline-block';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isBn = getCurrentLang() === 'bn';
    const saveBtn = document.getElementById('save-product-submit-btn');

    const nameBn = document.getElementById('modal-product-name-bn').value.trim();
    const nameEn = document.getElementById('modal-product-name-en').value.trim();
    const categoryId = document.getElementById('modal-product-category').value;
    const rawPrice = document.getElementById('modal-product-price').value.trim();
    const numPrice = parseFloat(rawPrice);

    // Strict Validations
    if (!nameBn) {
      showToast(isBn ? 'পণ্যের বাংলা নাম আবশ্যক' : 'Product Bengali name is required', true);
      document.getElementById('modal-product-name-bn').focus();
      return;
    }
    if (!nameEn) {
      showToast(isBn ? 'পণ্যের ইংরেজি নাম আবশ্যক' : 'Product English name is required', true);
      document.getElementById('modal-product-name-en').focus();
      return;
    }
    if (!categoryId) {
      showToast(isBn ? 'অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন' : 'Please select a valid category', true);
      document.getElementById('modal-product-category').focus();
      return;
    }
    if (!rawPrice || isNaN(numPrice) || numPrice < 0) {
      showToast(isBn ? 'সঠিক মূল্য উল্লেখ করুন (ঋণাত্মক বা খালি মূল্য গ্রহণযোগ্য নয়)' : 'Please enter a valid non-negative price', true);
      document.getElementById('modal-product-price').focus();
      return;
    }
    if (numPrice <= 0) {
      showToast(isBn ? 'পণ্যের মূল্য ০ থেকে বেশি হতে হবে' : 'Product price must be greater than 0', true);
      document.getElementById('modal-product-price').focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = t('saving');

    try {
      const id = document.getElementById('modal-product-id').value;
      const file = fileInput.files[0];
      let imageUrl = document.getElementById('modal-product-existing-image').value;

      // Handle image upload with auto-resize and EXIF stripping
      if (file) {
        statusText.textContent = isBn ? 'ইমেজ রিসাইজ ও আপলোড হচ্ছে...' : 'Resizing and uploading image...';
        statusText.style.color = 'var(--text-muted)';
        imageUrl = await processAndUploadImage(file);
      }

      const checkedSizes = Array.from(document.querySelectorAll('input[name="product-size"]:checked')).map(cb => cb.value);
      const availableSizes = checkedSizes.length > 0 ? checkedSizes : ['Free Size'];
      const fabricVal = document.getElementById('modal-product-fabric').value.trim() || 'Pure Handloom';
      const skuVal = document.getElementById('modal-product-sku').value.trim() || generateRandomSku();

      const productPayload = {
        name_bn: nameBn,
        name_en: nameEn,
        category_id: categoryId,
        price: numPrice,
        stock_status: document.getElementById('modal-product-stock').value,
        fabric_type: fabricVal,
        sku_code: skuVal,
        available_sizes: availableSizes,
        is_featured: document.getElementById('modal-product-featured').checked,
        is_new: document.getElementById('modal-product-new').checked,
        is_visible: document.getElementById('modal-product-visible').checked,
        description_bn: document.getElementById('modal-product-desc-bn').value.trim(),
        description_en: document.getElementById('modal-product-desc-en').value.trim(),
        image_url: imageUrl
      };

      if (id) {
        await updateProduct(id, productPayload);
        showToast(isBn ? 'পণ্য সফলভাবে আপডেট করা হয়েছে!' : 'Product updated successfully!');
      } else {
        await createProduct(productPayload);
        showToast(isBn ? 'নতুন পণ্য সফলভাবে যুক্ত করা হয়েছে!' : 'New product created successfully!');
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
    `<option value="all">${t('filterAllCategories')}</option>` +
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

  const isBn = getCurrentLang() === 'bn';

  if (adminCategories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); line-height: 1.6;">${isBn ? 'কোনো বিভাগ তৈরি করা হয়নি। নতুন বিভাগ যোগ করতে "+ নতুন বিভাগ যোগ করুন" বাটনে ক্লিক করুন।' : 'No categories created yet. Click "+ Add New Category" to create your first category.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCategories
    .map((cat, index) => {
      // Check if products reference this category
      const productCount = adminProducts.filter((p) => p.category_id === cat.id).length;
      const isBlocked = productCount > 0;

      return `
        <tr>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="pill-btn btn-sm btn-reorder-up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="${isBn ? 'উপরে তুলুন' : 'Move up'}">▲</button>
              <button class="pill-btn btn-sm btn-reorder-down" data-index="${index}" ${index === adminCategories.length - 1 ? 'disabled' : ''} title="${isBn ? 'নিচে নামান' : 'Move down'}">▼</button>
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
              ${isBlocked ? `disabled title="${isBn ? 'এই বিভাগে পণ্য রয়েছে — মুছে ফেলা সম্ভব নয়' : 'Category contains products — cannot delete'}"` : ''}
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
          title: isBn ? `বিভাগ '${cat.name_bn}' মুছে ফেলতে চান?` : `Delete category '${cat.name_en || cat.name_bn}'?`,
          description: isBn ? 'বিভাগটি মুছে ফেলা হবে।' : 'This category will be permanently removed.',
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
  const isBn = getCurrentLang() === 'bn';

  if (cat) {
    titleEl.textContent = isBn ? 'বিভাগ সম্পাদনা' : 'Edit Category';
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
  const nameEnInput = document.getElementById('modal-category-name-en');
  const slugInput = document.getElementById('modal-category-slug');

  // Auto-suggest slug when typing English name for new categories
  if (nameEnInput && slugInput) {
    nameEnInput.addEventListener('input', () => {
      const catId = document.getElementById('modal-category-id').value;
      if (!catId) {
        slugInput.value = nameEnInput.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isBn = getCurrentLang() === 'bn';
    const saveBtn = document.getElementById('save-category-submit-btn');

    const nameBn = document.getElementById('modal-category-name-bn').value.trim();
    const nameEn = document.getElementById('modal-category-name-en').value.trim();
    let slug = document.getElementById('modal-category-slug').value.trim().toLowerCase();

    if (!nameBn) {
      showToast(isBn ? 'বিভাগের বাংলা নাম আবশ্যক' : 'Category Bengali name is required', true);
      document.getElementById('modal-category-name-bn').focus();
      return;
    }
    if (!nameEn) {
      showToast(isBn ? 'বিভাগের ইংরেজি নাম আবশ্যক' : 'Category English name is required', true);
      document.getElementById('modal-category-name-en').focus();
      return;
    }
    if (!slug) {
      slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      slugInput.value = slug;
    }
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      showToast(isBn ? 'স্লাগে শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করা যাবে' : 'Slug must contain only lowercase letters, numbers, and hyphens', true);
      slugInput.focus();
      return;
    }

    saveBtn.disabled = true;

    try {
      const id = document.getElementById('modal-category-id').value;
      const payload = {
        name_bn: nameBn,
        name_en: nameEn,
        slug: slug
      };

      if (id) {
        await updateCategory(id, payload);
        showToast(isBn ? 'বিভাগ সফলভাবে আপডেট করা হয়েছে।' : 'Category updated successfully.');
      } else {
        await createCategory(payload);
        showToast(isBn ? 'নতুন বিভাগ সফলভাবে তৈরি হয়েছে।' : 'New category created successfully.');
      }

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

    // Load Website Customization Form
    if (typeof loadCustomizationToForm === 'function') {
      loadCustomizationToForm(adminSettings.customization || DEFAULT_CUSTOMIZATION);
    }
  } catch (err) {
    showToast(`সেটিংস লোড ব্যর্থ: ${err.message}`, true);
  }
}

function setupSettingsForm() {
  const form = document.getElementById('admin-settings-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const waInputRaw = document.getElementById('setting-whatsapp').value.trim();
    const waClean = waInputRaw.replace(/\D/g, '');

    // Validate WhatsApp number: 8–15 digits only!
    if (!/^[0-9]{8,15}$/.test(waClean)) {
      showToast('হোয়াটসঅ্যাপ নম্বরটি ৮ থেকে ১৫ সংখ্যার মধ্যে হতে হবে', true);
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
        whatsapp: waClean,
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
// WEBSITE CUSTOMIZATION CONTROLLER
// ==============================================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markCustomizationDirty() {
  isCustomizationDirty = true;
  const indicator = document.getElementById('custom-dirty-indicator');
  if (indicator) indicator.style.display = 'inline-flex';
}

function clearCustomizationDirty() {
  isCustomizationDirty = false;
  const indicator = document.getElementById('custom-dirty-indicator');
  if (indicator) indicator.style.display = 'none';
}

function bindColorSync(pickerId, textId) {
  const picker = document.getElementById(pickerId);
  const text = document.getElementById(textId);
  if (!picker || !text) return;

  picker.addEventListener('input', () => {
    text.value = picker.value;
    markCustomizationDirty();
  });

  text.addEventListener('input', () => {
    const val = text.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      picker.value = val;
    }
    markCustomizationDirty();
  });
}

function bindRangeSync(rangeId, badgeId, suffix = 'px') {
  const range = document.getElementById(rangeId);
  const badge = document.getElementById(badgeId);
  if (!range || !badge) return;

  range.addEventListener('input', () => {
    badge.textContent = `${range.value}${suffix}`;
    markCustomizationDirty();
  });
}

function renderNavItemsEditor(navItems) {
  const tbody = document.getElementById('custom-nav-items-tbody');
  if (!tbody) return;

  editingNavItems = (navItems || []).map((item, idx) => ({
    ...item,
    order: Number(item.order) || (idx + 1)
  })).sort((a, b) => a.order - b.order);

  tbody.innerHTML = editingNavItems.map((item, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === editingNavItems.length - 1;

    return `
      <tr data-index="${idx}">
        <td style="text-align: center; font-weight: bold; color: var(--text-muted);">${item.order}</td>
        <td>
          <input type="text" class="form-control nav-input-bn" data-idx="${idx}" value="${escapeHtml(item.label_bn || '')}">
        </td>
        <td>
          <input type="text" class="form-control nav-input-en" data-idx="${idx}" value="${escapeHtml(item.label_en || '')}">
        </td>
        <td>
          <input type="text" class="form-control nav-input-target" data-idx="${idx}" value="${escapeHtml(item.target || '')}">
        </td>
        <td style="text-align: center;">
          <input type="checkbox" class="nav-check-visible" data-idx="${idx}" ${item.visible !== false ? 'checked' : ''}>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="pill-btn btn-sm btn-nav-up" data-idx="${idx}" ${isFirst ? 'disabled style="opacity: 0.3;"' : ''} title="উপরে তুলুন">▲</button>
          <button type="button" class="pill-btn btn-sm btn-nav-down" data-idx="${idx}" ${isLast ? 'disabled style="opacity: 0.3;"' : ''} title="নিচে নামান">▼</button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach input listeners
  tbody.querySelectorAll('.nav-input-bn').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (editingNavItems[idx]) {
        editingNavItems[idx].label_bn = e.target.value;
        markCustomizationDirty();
      }
    });
  });

  tbody.querySelectorAll('.nav-input-en').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (editingNavItems[idx]) {
        editingNavItems[idx].label_en = e.target.value;
        markCustomizationDirty();
      }
    });
  });

  tbody.querySelectorAll('.nav-input-target').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (editingNavItems[idx]) {
        editingNavItems[idx].target = e.target.value;
        markCustomizationDirty();
      }
    });
  });

  tbody.querySelectorAll('.nav-check-visible').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (editingNavItems[idx]) {
        editingNavItems[idx].visible = e.target.checked;
        markCustomizationDirty();
      }
    });
  });

  tbody.querySelectorAll('.btn-nav-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      if (idx > 0) {
        const temp = editingNavItems[idx];
        editingNavItems[idx] = editingNavItems[idx - 1];
        editingNavItems[idx - 1] = temp;
        editingNavItems.forEach((it, i) => { it.order = i + 1; });
        renderNavItemsEditor(editingNavItems);
        markCustomizationDirty();
      }
    });
  });

  tbody.querySelectorAll('.btn-nav-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      if (idx < editingNavItems.length - 1) {
        const temp = editingNavItems[idx];
        editingNavItems[idx] = editingNavItems[idx + 1];
        editingNavItems[idx + 1] = temp;
        editingNavItems.forEach((it, i) => { it.order = i + 1; });
        renderNavItemsEditor(editingNavItems);
        markCustomizationDirty();
      }
    });
  });
}

function loadCustomizationToForm(cust) {
  currentCustomization = JSON.parse(JSON.stringify(cust || DEFAULT_CUSTOMIZATION));
  uploadedLogoUrl = currentCustomization.logo?.url || '';
  uploadedHeroBgUrl = currentCustomization.hero?.bg_image || '';

  // 1. Logo & Brand
  const logo = currentCustomization.logo || {};
  const logoWidthInp = document.getElementById('custom-logo-width');
  if (logoWidthInp) {
    logoWidthInp.value = logo.width || 130;
    const badge = document.getElementById('badge-logo-width');
    if (badge) badge.textContent = `${logoWidthInp.value}px`;
  }

  const logoHeightInp = document.getElementById('custom-logo-height');
  if (logoHeightInp) {
    logoHeightInp.value = logo.height || 42;
    const badge = document.getElementById('badge-logo-height');
    if (badge) badge.textContent = `${logoHeightInp.value}px`;
  }

  const logoAlign = document.getElementById('custom-logo-align');
  if (logoAlign) logoAlign.value = logo.alignment || 'left';

  const logoAlt = document.getElementById('custom-logo-alt');
  if (logoAlt) logoAlt.value = logo.alt || '';

  const brandNameBn = document.getElementById('custom-brand-name-bn');
  if (brandNameBn) brandNameBn.value = logo.brand_name_bn || '';

  const brandNameEn = document.getElementById('custom-brand-name-en');
  if (brandNameEn) brandNameEn.value = logo.brand_name_en || '';

  const previewImg = document.getElementById('logo-preview-img');
  const placeholder = document.getElementById('logo-preview-placeholder');
  if (uploadedLogoUrl && previewImg) {
    previewImg.src = uploadedLogoUrl;
    previewImg.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'block';
  }

  // 2. Header & Nav
  const header = currentCustomization.header || {};
  const headerBg = document.getElementById('custom-header-bg');
  const headerBgPicker = document.getElementById('custom-header-bg-picker');
  if (headerBg) {
    headerBg.value = header.bg_color || '';
    if (headerBgPicker && /^#[0-9A-Fa-f]{6}$/.test(header.bg_color)) {
      headerBgPicker.value = header.bg_color;
    }
  }

  const headerText = document.getElementById('custom-header-text');
  const headerTextPicker = document.getElementById('custom-header-text-picker');
  if (headerText) {
    headerText.value = header.text_color || '#2D2327';
    if (headerTextPicker && /^#[0-9A-Fa-f]{6}$/.test(header.text_color)) {
      headerTextPicker.value = header.text_color;
    }
  }

  const headerHeight = document.getElementById('custom-header-height');
  if (headerHeight) {
    headerHeight.value = header.height || 72;
    const badge = document.getElementById('badge-header-height');
    if (badge) badge.textContent = `${headerHeight.value}px`;
  }

  const logoSpacing = document.getElementById('custom-logo-spacing');
  if (logoSpacing) {
    logoSpacing.value = header.logo_spacing || 16;
    const badge = document.getElementById('badge-logo-spacing');
    if (badge) badge.textContent = `${logoSpacing.value}px`;
  }

  const navSpacing = document.getElementById('custom-nav-spacing');
  if (navSpacing) {
    navSpacing.value = header.nav_spacing || 24;
    const badge = document.getElementById('badge-nav-spacing');
    if (badge) badge.textContent = `${navSpacing.value}px`;
  }

  const navFontSize = document.getElementById('custom-nav-font-size');
  if (navFontSize) {
    navFontSize.value = header.nav_font_size || 15;
    const badge = document.getElementById('badge-nav-font-size');
    if (badge) badge.textContent = `${navFontSize.value}px`;
  }

  const mobileNavVis = document.getElementById('custom-mobile-nav-visible');
  if (mobileNavVis) mobileNavVis.checked = header.mobile_nav_visible !== false;

  // Nav Items
  const navItems = Array.isArray(currentCustomization.nav_items) && currentCustomization.nav_items.length
    ? currentCustomization.nav_items
    : DEFAULT_CUSTOMIZATION.nav_items;
  renderNavItemsEditor(navItems);

  // 3. Hero Section
  const hero = currentCustomization.hero || {};
  const heroHdBn = document.getElementById('custom-hero-headline-bn');
  if (heroHdBn) heroHdBn.value = hero.headline_bn || '';

  const heroHdEn = document.getElementById('custom-hero-headline-en');
  if (heroHdEn) heroHdEn.value = hero.headline_en || '';

  const heroSubBn = document.getElementById('custom-hero-subhead-bn');
  if (heroSubBn) heroSubBn.value = hero.subhead_bn || '';

  const heroSubEn = document.getElementById('custom-hero-subhead-en');
  if (heroSubEn) heroSubEn.value = hero.subhead_en || '';

  const heroBtnBn = document.getElementById('custom-hero-btn-bn');
  if (heroBtnBn) heroBtnBn.value = hero.btn_label_bn || '';

  const heroBtnEn = document.getElementById('custom-hero-btn-en');
  if (heroBtnEn) heroBtnEn.value = hero.btn_label_en || '';

  const heroBtnTarget = document.getElementById('custom-hero-btn-target');
  if (heroBtnTarget) heroBtnTarget.value = hero.btn_target || '#products';

  const heroPos = document.getElementById('custom-hero-position');
  if (heroPos) heroPos.value = hero.bg_position || 'center center';

  const heroAlign = document.getElementById('custom-hero-align');
  if (heroAlign) heroAlign.value = hero.text_alignment || 'center';

  const heroHeight = document.getElementById('custom-hero-height');
  if (heroHeight) heroHeight.value = hero.height || '80vh';

  const heroBgColor = document.getElementById('custom-hero-bg-color');
  const heroBgPicker = document.getElementById('custom-hero-bg-picker');
  if (heroBgColor) {
    heroBgColor.value = hero.bg_color || '';
    if (heroBgPicker && /^#[0-9A-Fa-f]{6}$/.test(hero.bg_color)) {
      heroBgPicker.value = hero.bg_color;
    }
  }

  const heroTextColor = document.getElementById('custom-hero-text-color');
  const heroTextPicker = document.getElementById('custom-hero-text-picker');
  if (heroTextColor) {
    heroTextColor.value = hero.text_color || '';
    if (heroTextPicker && /^#[0-9A-Fa-f]{6}$/.test(hero.text_color)) {
      heroTextPicker.value = hero.text_color;
    }
  }

  const heroBox = document.getElementById('hero-preview-box');
  const heroText = document.getElementById('hero-preview-text');
  if (uploadedHeroBgUrl && heroBox) {
    heroBox.style.backgroundImage = `url("${uploadedHeroBgUrl}")`;
    if (heroText) heroText.style.display = 'none';
  } else {
    if (heroBox) heroBox.style.backgroundImage = '';
    if (heroText) heroText.style.display = 'inline-block';
  }

  // 4. Sections
  const secs = currentCustomization.sections || {};
  // Collection
  const collVis = document.getElementById('custom-sec-coll-visible');
  if (collVis) collVis.checked = secs.collection?.visible !== false;
  const collTitleBn = document.getElementById('custom-sec-coll-title-bn');
  if (collTitleBn) collTitleBn.value = secs.collection?.title_bn || '';
  const collTitleEn = document.getElementById('custom-sec-coll-title-en');
  if (collTitleEn) collTitleEn.value = secs.collection?.title_en || '';
  const collSubBn = document.getElementById('custom-sec-coll-sub-bn');
  if (collSubBn) collSubBn.value = secs.collection?.sub_bn || '';
  const collSubEn = document.getElementById('custom-sec-coll-sub-en');
  if (collSubEn) collSubEn.value = secs.collection?.sub_en || '';

  // About
  const aboutVis = document.getElementById('custom-sec-about-visible');
  if (aboutVis) aboutVis.checked = secs.about?.visible !== false;
  const aboutTitleBn = document.getElementById('custom-sec-about-title-bn');
  if (aboutTitleBn) aboutTitleBn.value = secs.about?.title_bn || '';
  const aboutTitleEn = document.getElementById('custom-sec-about-title-en');
  if (aboutTitleEn) aboutTitleEn.value = secs.about?.title_en || '';
  const aboutDescBn = document.getElementById('custom-sec-about-desc-bn');
  if (aboutDescBn) aboutDescBn.value = secs.about?.desc_bn || '';
  const aboutDescEn = document.getElementById('custom-sec-about-desc-en');
  if (aboutDescEn) aboutDescEn.value = secs.about?.desc_en || '';

  // Reviews
  const revVis = document.getElementById('custom-sec-reviews-visible');
  if (revVis) revVis.checked = secs.reviews?.visible !== false;
  const revTitleBn = document.getElementById('custom-sec-reviews-title-bn');
  if (revTitleBn) revTitleBn.value = secs.reviews?.title_bn || '';
  const revTitleEn = document.getElementById('custom-sec-reviews-title-en');
  if (revTitleEn) revTitleEn.value = secs.reviews?.title_en || '';

  // Contact
  const conVis = document.getElementById('custom-sec-contact-visible');
  if (conVis) conVis.checked = secs.contact?.visible !== false;
  const conTitleBn = document.getElementById('custom-sec-contact-title-bn');
  if (conTitleBn) conTitleBn.value = secs.contact?.title_bn || '';
  const conTitleEn = document.getElementById('custom-sec-contact-title-en');
  if (conTitleEn) conTitleEn.value = secs.contact?.title_en || '';
  const conEmail = document.getElementById('custom-sec-contact-email');
  if (conEmail) conEmail.value = secs.contact?.email || '';
  const conPhone = document.getElementById('custom-sec-contact-phone');
  if (conPhone) conPhone.value = secs.contact?.phone || '';

  // Footer
  const footCrBn = document.getElementById('custom-sec-footer-cr-bn');
  if (footCrBn) footCrBn.value = secs.footer?.copyright_bn || '';
  const footCrEn = document.getElementById('custom-sec-footer-cr-en');
  if (footCrEn) footCrEn.value = secs.footer?.copyright_en || '';
  const footFb = document.getElementById('custom-sec-footer-fb');
  if (footFb) footFb.value = secs.footer?.facebook_url || '';
  const footInsta = document.getElementById('custom-sec-footer-insta');
  if (footInsta) footInsta.value = secs.footer?.instagram_url || '';

  // 5. Design & Colors
  const design = currentCustomization.design || {};
  const syncDesignColor = (textId, pickerId, val) => {
    const textEl = document.getElementById(textId);
    const pickerEl = document.getElementById(pickerId);
    if (textEl) textEl.value = val;
    if (pickerEl && /^#[0-9A-Fa-f]{6}$/.test(val)) pickerEl.value = val;
  };

  syncDesignColor('custom-color-primary', 'custom-color-primary-picker', design.primary_color || '#5A1B33');
  syncDesignColor('custom-color-secondary', 'custom-color-secondary-picker', design.secondary_color || '#D48C17');
  syncDesignColor('custom-color-accent', 'custom-color-accent-picker', design.accent_color || '#1E6B58');
  syncDesignColor('custom-color-bg', 'custom-color-bg-picker', design.page_bg_color || design.bg_color || '#FDFBF7');
  syncDesignColor('custom-color-text', 'custom-color-text-picker', design.text_color || '#2D2327');

  const btnRad = document.getElementById('custom-btn-radius');
  if (btnRad) {
    btnRad.value = design.btn_border_radius ?? design.btn_radius ?? 8;
    const badge = document.getElementById('badge-btn-radius');
    if (badge) badge.textContent = `${btnRad.value}px`;
  }

  const cardRad = document.getElementById('custom-card-radius');
  if (cardRad) {
    cardRad.value = design.card_border_radius ?? design.card_radius ?? 12;
    const badge = document.getElementById('badge-card-radius');
    if (badge) badge.textContent = `${cardRad.value}px`;
  }

  const contWidth = document.getElementById('custom-container-width');
  if (contWidth) {
    contWidth.value = design.content_max_width ?? design.container_max_width ?? 1200;
    const badge = document.getElementById('badge-container-width');
    if (badge) badge.textContent = `${contWidth.value}px`;
  }

  const secSpacing = document.getElementById('custom-section-spacing');
  if (secSpacing) {
    secSpacing.value = design.section_spacing ?? 80;
    const badge = document.getElementById('badge-section-spacing');
    if (badge) badge.textContent = `${secSpacing.value}px`;
  }

  clearCustomizationDirty();
}

function gatherCustomizationFormData() {
  const btnRadVal = Number(document.getElementById('custom-btn-radius')?.value) ?? 8;
  const cardRadVal = Number(document.getElementById('custom-card-radius')?.value) ?? 12;
  const contWidthVal = Number(document.getElementById('custom-container-width')?.value) ?? 1200;
  const secSpacingVal = Number(document.getElementById('custom-section-spacing')?.value) ?? 80;
  const pageBgVal = document.getElementById('custom-color-bg')?.value.trim() || '#FDFBF7';

  return {
    logo: {
      url: uploadedLogoUrl || '',
      width: Number(document.getElementById('custom-logo-width')?.value) || 130,
      height: Number(document.getElementById('custom-logo-height')?.value) || 42,
      alignment: document.getElementById('custom-logo-align')?.value || 'left',
      alt: document.getElementById('custom-logo-alt')?.value.trim() || '',
      brand_name_bn: document.getElementById('custom-brand-name-bn')?.value.trim() || '',
      brand_name_en: document.getElementById('custom-brand-name-en')?.value.trim() || ''
    },
    header: {
      bg_color: document.getElementById('custom-header-bg')?.value.trim() || '',
      text_color: document.getElementById('custom-header-text')?.value.trim() || '',
      height: Number(document.getElementById('custom-header-height')?.value) || 72,
      logo_spacing: Number(document.getElementById('custom-logo-spacing')?.value) || 16,
      nav_spacing: Number(document.getElementById('custom-nav-spacing')?.value) || 24,
      nav_font_size: Number(document.getElementById('custom-nav-font-size')?.value) || 15,
      mobile_nav_visible: document.getElementById('custom-mobile-nav-visible')?.checked !== false
    },
    nav_items: [...editingNavItems],
    hero: {
      headline_bn: document.getElementById('custom-hero-headline-bn')?.value.trim() || '',
      headline_en: document.getElementById('custom-hero-headline-en')?.value.trim() || '',
      subhead_bn: document.getElementById('custom-hero-subhead-bn')?.value.trim() || '',
      subhead_en: document.getElementById('custom-hero-subhead-en')?.value.trim() || '',
      btn_label_bn: document.getElementById('custom-hero-btn-bn')?.value.trim() || '',
      btn_label_en: document.getElementById('custom-hero-btn-en')?.value.trim() || '',
      btn_target: document.getElementById('custom-hero-btn-target')?.value.trim() || '#products',
      bg_image: uploadedHeroBgUrl || '',
      bg_position: document.getElementById('custom-hero-position')?.value || 'center center',
      text_alignment: document.getElementById('custom-hero-align')?.value || 'center',
      height: document.getElementById('custom-hero-height')?.value.trim() || '80vh',
      bg_color: document.getElementById('custom-hero-bg-color')?.value.trim() || '',
      text_color: document.getElementById('custom-hero-text-color')?.value.trim() || ''
    },
    sections: {
      collection: {
        visible: document.getElementById('custom-sec-coll-visible')?.checked !== false,
        title_bn: document.getElementById('custom-sec-coll-title-bn')?.value.trim() || '',
        title_en: document.getElementById('custom-sec-coll-title-en')?.value.trim() || '',
        sub_bn: document.getElementById('custom-sec-coll-sub-bn')?.value.trim() || '',
        sub_en: document.getElementById('custom-sec-coll-sub-en')?.value.trim() || ''
      },
      about: {
        visible: document.getElementById('custom-sec-about-visible')?.checked !== false,
        title_bn: document.getElementById('custom-sec-about-title-bn')?.value.trim() || '',
        title_en: document.getElementById('custom-sec-about-title-en')?.value.trim() || '',
        desc_bn: document.getElementById('custom-sec-about-desc-bn')?.value.trim() || '',
        desc_en: document.getElementById('custom-sec-about-desc-en')?.value.trim() || ''
      },
      reviews: {
        visible: document.getElementById('custom-sec-reviews-visible')?.checked !== false,
        title_bn: document.getElementById('custom-sec-reviews-title-bn')?.value.trim() || '',
        title_en: document.getElementById('custom-sec-reviews-title-en')?.value.trim() || ''
      },
      contact: {
        visible: document.getElementById('custom-sec-contact-visible')?.checked !== false,
        title_bn: document.getElementById('custom-sec-contact-title-bn')?.value.trim() || '',
        title_en: document.getElementById('custom-sec-contact-title-en')?.value.trim() || '',
        email: document.getElementById('custom-sec-contact-email')?.value.trim() || '',
        phone: document.getElementById('custom-sec-contact-phone')?.value.trim() || ''
      },
      footer: {
        copyright_bn: document.getElementById('custom-sec-footer-cr-bn')?.value.trim() || '',
        copyright_en: document.getElementById('custom-sec-footer-cr-en')?.value.trim() || '',
        facebook_url: document.getElementById('custom-sec-footer-fb')?.value.trim() || '',
        instagram_url: document.getElementById('custom-sec-footer-insta')?.value.trim() || ''
      }
    },
    design: {
      primary_color: document.getElementById('custom-color-primary')?.value.trim() || '#5A1B33',
      secondary_color: document.getElementById('custom-color-secondary')?.value.trim() || '#D48C17',
      accent_color: document.getElementById('custom-color-accent')?.value.trim() || '#1E6B58',
      page_bg_color: pageBgVal,
      bg_color: pageBgVal,
      text_color: document.getElementById('custom-color-text')?.value.trim() || '#2D2327',
      btn_border_radius: btnRadVal,
      btn_radius: btnRadVal,
      card_border_radius: cardRadVal,
      card_radius: cardRadVal,
      content_max_width: contWidthVal,
      container_max_width: contWidthVal,
      section_spacing: secSpacingVal
    }
  };
}

function setupCustomizationController() {
  // 1. Sub-Tabs Switching
  const subtabs = document.querySelectorAll('.custom-sub-tab');
  const panels = {
    logo: document.getElementById('subpanel-logo'),
    nav: document.getElementById('subpanel-nav'),
    hero: document.getElementById('subpanel-hero'),
    sections: document.getElementById('subpanel-sections'),
    design: document.getElementById('subpanel-design')
  };

  subtabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-subtab');
      subtabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(panels).forEach((key) => {
        if (panels[key]) {
          panels[key].classList.toggle('active', key === target);
        }
      });
    });
  });

  // 2. Color Sync Bindings
  bindColorSync('custom-header-bg-picker', 'custom-header-bg');
  bindColorSync('custom-header-text-picker', 'custom-header-text');
  bindColorSync('custom-hero-bg-picker', 'custom-hero-bg-color');
  bindColorSync('custom-hero-text-picker', 'custom-hero-text-color');
  bindColorSync('custom-color-primary-picker', 'custom-color-primary');
  bindColorSync('custom-color-secondary-picker', 'custom-color-secondary');
  bindColorSync('custom-color-accent-picker', 'custom-color-accent');
  bindColorSync('custom-color-bg-picker', 'custom-color-bg');
  bindColorSync('custom-color-text-picker', 'custom-color-text');

  // 3. Range Sliders Sync Bindings
  bindRangeSync('custom-logo-width', 'badge-logo-width');
  bindRangeSync('custom-logo-height', 'badge-logo-height');
  bindRangeSync('custom-header-height', 'badge-header-height');
  bindRangeSync('custom-logo-spacing', 'badge-logo-spacing');
  bindRangeSync('custom-nav-spacing', 'badge-nav-spacing');
  bindRangeSync('custom-nav-font-size', 'badge-nav-font-size');
  bindRangeSync('custom-btn-radius', 'badge-btn-radius');
  bindRangeSync('custom-card-radius', 'badge-card-radius');
  bindRangeSync('custom-container-width', 'badge-container-width');
  bindRangeSync('custom-section-spacing', 'badge-section-spacing');

  // Real-time live visual preview bindings
  const logoWidthRange = document.getElementById('custom-logo-width');
  const logoHeightRange = document.getElementById('custom-logo-height');
  const logoAlignSelect = document.getElementById('custom-logo-align');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const logoPreviewBox = document.getElementById('logo-preview-box');

  if (logoWidthRange && logoPreviewImg) {
    logoWidthRange.addEventListener('input', () => {
      logoPreviewImg.style.maxWidth = `${logoWidthRange.value}px`;
    });
  }
  if (logoHeightRange && logoPreviewImg) {
    logoHeightRange.addEventListener('input', () => {
      logoPreviewImg.style.maxHeight = `${logoHeightRange.value}px`;
    });
  }
  if (logoAlignSelect && logoPreviewBox) {
    logoAlignSelect.addEventListener('change', () => {
      if (logoAlignSelect.value === 'center') logoPreviewBox.style.justifyContent = 'center';
      else if (logoAlignSelect.value === 'right') logoPreviewBox.style.justifyContent = 'flex-end';
      else logoPreviewBox.style.justifyContent = 'flex-start';
    });
  }

  const heroBgColorInp = document.getElementById('custom-hero-bg-color');
  const heroPosSelect = document.getElementById('custom-hero-position');
  const heroPreviewBox = document.getElementById('hero-preview-box');

  if (heroBgColorInp && heroPreviewBox) {
    heroBgColorInp.addEventListener('input', () => {
      heroPreviewBox.style.backgroundColor = heroBgColorInp.value;
    });
  }
  if (heroPosSelect && heroPreviewBox) {
    heroPosSelect.addEventListener('change', () => {
      heroPreviewBox.style.backgroundPosition = heroPosSelect.value;
    });
  }

  // 4. Dirty Change Observers on standard inputs
  const inputs = document.querySelectorAll(
    '#panel-customization input:not([type="file"]):not([type="range"]):not([type="color"]), #panel-customization textarea, #panel-customization select'
  );
  inputs.forEach((input) => {
    input.addEventListener('input', markCustomizationDirty);
    input.addEventListener('change', markCustomizationDirty);
  });

  // 5. Logo File Upload & Removal
  const logoFileInput = document.getElementById('custom-logo-file');
  if (logoFileInput) {
    logoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        showToast(getCurrentLang() === 'bn' ? 'অনুমোদিত ইমেজ ফরম্যাট: PNG, JPG, SVG, WebP' : 'Allowed formats: PNG, JPG, SVG, WebP', true);
        logoFileInput.value = '';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showToast(getCurrentLang() === 'bn' ? 'লোগো ফাইলের আকার সর্বোচ্চ ২ মেগাবাইট হতে পারে' : 'Logo file size must be under 2MB', true);
        logoFileInput.value = '';
        return;
      }

      const previewImg = document.getElementById('logo-preview-img');
      const placeholder = document.getElementById('logo-preview-placeholder');
      const tempUrl = URL.createObjectURL(file);
      if (previewImg) {
        previewImg.src = tempUrl;
        previewImg.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';

      try {
        showToast(getCurrentLang() === 'bn' ? 'লোগো প্রসেস ও আপলোড হচ্ছে...' : 'Processing and uploading logo...');
        let publicUrl;
        if (file.type === 'image/svg+xml') {
          const reader = new FileReader();
          publicUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        } else {
          publicUrl = await processAndUploadImage(file);
        }
        uploadedLogoUrl = publicUrl;
        if (previewImg) previewImg.src = publicUrl;
        markCustomizationDirty();
        showToast(getCurrentLang() === 'bn' ? 'লোগো তৈরি হয়েছে! সংরক্ষণ করতে সেভ বাটনে চাপুন।' : 'Logo processed! Click Save to apply.');
      } catch (err) {
        showToast(err.message, true);
        if (uploadedLogoUrl && previewImg) {
          previewImg.src = uploadedLogoUrl;
        } else {
          if (previewImg) previewImg.style.display = 'none';
          if (placeholder) placeholder.style.display = 'block';
        }
      } finally {
        logoFileInput.value = '';
      }
    });
  }

  const removeLogoBtn = document.getElementById('btn-remove-logo');
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', () => {
      uploadedLogoUrl = '';
      const previewImg = document.getElementById('logo-preview-img');
      const placeholder = document.getElementById('logo-preview-placeholder');
      if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
      }
      if (placeholder) placeholder.style.display = 'block';
      markCustomizationDirty();
      showToast(getCurrentLang() === 'bn' ? 'কাস্টম লোগো সরানো হয়েছে। ডিফল্ট এসভিজি প্রদর্শিত হবে।' : 'Custom logo removed. Default logo will be shown.');
    });
  }

  // 6. Hero Banner Upload & Removal
  const heroBgFileInput = document.getElementById('custom-hero-bg-file');
  if (heroBgFileInput) {
    heroBgFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast(getCurrentLang() === 'bn' ? 'অনুমোদিত ইমেজ ফরম্যাট: JPG, PNG, WebP' : 'Allowed formats: JPG, PNG, WebP', true);
        heroBgFileInput.value = '';
        return;
      }

      if (file.size > 3 * 1024 * 1024) {
        showToast(getCurrentLang() === 'bn' ? 'হিরো ইমেজ ফাইলের আকার সর্বোচ্চ ৩ মেগাবাইট হতে পারে' : 'Hero image must be under 3MB', true);
        heroBgFileInput.value = '';
        return;
      }

      const heroBox = document.getElementById('hero-preview-box');
      const heroText = document.getElementById('hero-preview-text');
      const tempUrl = URL.createObjectURL(file);
      if (heroBox) heroBox.style.backgroundImage = `url("${tempUrl}")`;
      if (heroText) heroText.style.display = 'none';

      try {
        showToast(getCurrentLang() === 'bn' ? 'হিরো ইমেজ প্রসেস ও আপলোড হচ্ছে...' : 'Processing and uploading hero banner...');
        const publicUrl = await processAndUploadImage(file);
        uploadedHeroBgUrl = publicUrl;
        if (heroBox) heroBox.style.backgroundImage = `url("${publicUrl}")`;
        markCustomizationDirty();
        showToast(getCurrentLang() === 'bn' ? 'হিরো ইমেজ তৈরি হয়েছে! সংরক্ষণ করতে সেভ বাটনে চাপুন।' : 'Hero image processed! Click Save to apply.');
      } catch (err) {
        showToast(err.message, true);
        if (uploadedHeroBgUrl && heroBox) {
          heroBox.style.backgroundImage = `url("${uploadedHeroBgUrl}")`;
        } else {
          if (heroBox) heroBox.style.backgroundImage = '';
          if (heroText) heroText.style.display = 'inline-block';
        }
      } finally {
        heroBgFileInput.value = '';
      }
    });
  }

  const removeHeroBgBtn = document.getElementById('btn-remove-hero-bg');
  if (removeHeroBgBtn) {
    removeHeroBgBtn.addEventListener('click', () => {
      uploadedHeroBgUrl = '';
      const heroBox = document.getElementById('hero-preview-box');
      const heroText = document.getElementById('hero-preview-text');
      if (heroBox) heroBox.style.backgroundImage = '';
      if (heroText) heroText.style.display = 'inline-block';
      markCustomizationDirty();
      showToast(getCurrentLang() === 'bn' ? 'হিরো ব্যাকগ্রাউন্ড ছবি সরানো হয়েছে।' : 'Hero background image removed.');
    });
  }

  // 7. Save Customization Button
  const saveBtn = document.getElementById('btn-save-customization');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const isBn = getCurrentLang() === 'bn';
      saveBtn.disabled = true;
      saveBtn.textContent = isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...';
      try {
        const payload = gatherCustomizationFormData();
        await updateSettings({ customization: payload });
        adminSettings = { ...(adminSettings || {}), customization: payload };
        clearCustomizationDirty();
        showToast(isBn ? 'কাস্টমাইজেশন সফলভাবে সংরক্ষিত হয়েছে!' : 'Customization saved successfully!');
      } catch (err) {
        showToast(`সংরক্ষণ ত্রুটি: ${err.message}`, true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = isBn ? '💾 কাস্টমাইজেশন সংরক্ষণ করুন' : '💾 Save Customization';
      }
    });
  }

  // 8. Cancel Customization Button
  const cancelBtn = document.getElementById('btn-cancel-customization');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const isBn = getCurrentLang() === 'bn';
      loadCustomizationToForm(adminSettings?.customization || DEFAULT_CUSTOMIZATION);
      clearCustomizationDirty();
      showToast(isBn ? 'পরিবর্তন বাতিল করা হয়েছে।' : 'Changes reverted.');
    });
  }

  // 9. Reset Defaults Button
  const resetBtn = document.getElementById('btn-reset-customization-defaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const isBn = getCurrentLang() === 'bn';
      openConfirmModal({
        title: isBn ? 'ডিফল্ট সেটিংস পুনরুদ্ধার' : 'Restore Default Settings',
        description: isBn
          ? 'আপনি কি সমস্ত কাস্টমাইজেশন মুছে ডিফল্ট ডিজাইনে ফিরে যেতে চান? আপনার সংরক্ষিত পরিবর্তন পরিবর্তিত হবে।'
          : 'Are you sure you want to restore all customization settings to their default values?',
        onConfirm: () => {
          loadCustomizationToForm(DEFAULT_CUSTOMIZATION);
          markCustomizationDirty();
          showToast(isBn ? 'ডিফল্ট মান লোড হয়েছে। সেভ করতে বাটন চাপুন।' : 'Default values loaded. Click Save to persist.');
        }
      });
    });
  }

  // 10. Warn before unload if dirty
  window.addEventListener('beforeunload', (e) => {
    if (isCustomizationDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Initial Form population
  loadCustomizationToForm(adminSettings?.customization || DEFAULT_CUSTOMIZATION);
}

// ==============================================================================
// REVIEWS CRUD CONTROLLER
// ==============================================================================
async function loadAdminReviews() {
  try {
    adminReviews = await getReviews({ includeHidden: true });
    renderAdminReviewsTable();
    updateDashboardStats();
  } catch (err) {
    showToast(`রিভিউ লোড ব্যর্থ: ${err.message}`, true);
  }
}

function renderAdminReviewsTable() {
  const tbody = document.getElementById('admin-reviews-tbody');
  if (!tbody) return;

  const isBn = getCurrentLang() === 'bn';

  let filtered = [...adminReviews];
  if (adminReviewFilter === 'pending') {
    filtered = filtered.filter((r) => !r.is_visible);
  } else if (adminReviewFilter === 'published') {
    filtered = filtered.filter((r) => r.is_visible);
  }

  if (filtered.length === 0) {
    const emptyMsg = adminReviewFilter === 'pending'
      ? (t('noPendingReviewsMsg') || 'কোনো অপেক্ষমাণ রিভিউ পাওয়া যায়নি।')
      : (t('noReviewsYet') || 'কোনো রিভিউ পাওয়া যায়নি।');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">${emptyMsg}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((rev) => {
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(Math.max(0, 5 - rev.rating));
      const formattedDate = rev.created_at ? formatReviewDate(rev.created_at, getCurrentLang()) : '—';
      const isPending = !rev.is_visible;

      return `
        <tr style="${isPending ? 'background: rgba(212, 140, 23, 0.05);' : ''}">
          <td>
            <span style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">${formattedDate}</span>
          </td>
          <td>
            <strong>${rev.author_name}</strong>
          </td>
          <td>
            <span style="color: var(--accent); white-space: nowrap;">${stars}</span>
          </td>
          <td style="max-width: 320px; font-size: 0.875rem;">
            ${isBn ? rev.comment_bn : (rev.comment_en || rev.comment_bn)}
          </td>
          <td>
            <span class="badge ${isPending ? 'badge-pending' : 'badge-published'}">
              ${isPending ? (isBn ? '⏳ অপেক্ষমাণ' : '⏳ Pending') : (isBn ? '✓ প্রকাশিত' : '✓ Published')}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${isPending
              ? `<button class="pill-btn btn-sm btn-approve-rev" data-id="${rev.id}" style="background: #E6FFFA; color: #234E52; border-color: #38B2AC; margin-right: 0.35rem;" title="${t('approveBtn')}">${t('approveBtn') || '✓ অনুমোদন'}</button>`
              : `<button class="pill-btn btn-sm btn-hide-rev" data-id="${rev.id}" style="margin-right: 0.35rem;" title="${t('hideBtn')}">${t('hideBtn') || 'হাইড'}</button>`
            }
            <button class="pill-btn btn-edit-rev" data-id="${rev.id}" style="margin-right: 0.35rem;">${t('edit')}</button>
            <button class="pill-btn btn-del-rev" data-id="${rev.id}" style="color: var(--danger); border-color: var(--danger);">${t('delete')}</button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Quick Approve action
  tbody.querySelectorAll('.btn-approve-rev').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        btn.disabled = true;
        btn.textContent = isBn ? 'অনুমোদন হচ্ছে...' : 'Approving...';
        await updateReview(id, { is_visible: true });
        showToast(isBn ? 'রিভিউটি সফলভাবে অনুমোদিত ও প্রকাশিত হয়েছে!' : 'Review approved & published successfully!');
        await loadAdminReviews();
      } catch (err) {
        showToast(err.message, true);
        btn.disabled = false;
        btn.textContent = t('approveBtn');
      }
    });
  });

  // Quick Hide action
  tbody.querySelectorAll('.btn-hide-rev').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        btn.disabled = true;
        btn.textContent = isBn ? 'হাইড হচ্ছে...' : 'Hiding...';
        await updateReview(id, { is_visible: false });
        showToast(isBn ? 'রিভিউটি হাইড করা হয়েছে।' : 'Review hidden from storefront.');
        await loadAdminReviews();
      } catch (err) {
        showToast(err.message, true);
        btn.disabled = false;
        btn.textContent = t('hideBtn');
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
          title: isBn ? 'রিভিউটি মুছে ফেলতে চান?' : 'Delete this review?',
          description: isBn ? 'এই রিভিউটি স্থায়ীভাবে মুছে যাবে।' : 'This review will be permanently deleted.',
          onConfirm: async () => {
            try {
              await deleteReview(rev.id);
              showToast(t('toastDeleteSuccess'));
              await loadAdminReviews();
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
  const isBn = getCurrentLang() === 'bn';

  if (rev) {
    titleEl.textContent = isBn ? 'রিভিউ সম্পাদনা' : 'Edit Review';
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
  // Review Moderation Filter Tabs
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      adminReviewFilter = btn.getAttribute('data-filter') || 'all';
      renderAdminReviewsTable();
    });
  });

  const form = document.getElementById('review-form');
  if (!form) return;
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
      updateThemeButtons(document.documentElement.getAttribute('data-theme') || 'light', next);
      updatePasswordToggleLabels();
      updateOtpCooldownButton();
      populateCategoryFilters();
      renderAdminProductsTable();
      renderAdminCategoriesTable();
      renderAdminReviewsTable();
      if (typeof renderNavItemsEditor === 'function' && Array.isArray(editingNavItems) && editingNavItems.length) {
        renderNavItemsEditor(editingNavItems);
      }
    });
  }
}

/**
 * Main Initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  initAdminTheme();
  setupAdminLanguage();
  initAdminStorageSync();
  setupTabs();
  setupModals();
  setupProductForm();
  setupCategoryForm();
  setupSettingsForm();
  setupCustomizationController();
  setupReviewForm();
  setupStorageTab();
  setupAuthForms();

  const noticeSlot = document.getElementById('admin-setup-notice-slot');
  if (noticeSlot) {
    renderSetupNotice(noticeSlot);
  }

  await initAuth();
});

