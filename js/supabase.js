// ==============================================================================
// Tulika Boutique / তূলিকা বুটিক
// Supabase Singleton Client (Placeholder-Safe & Resilient)
// Free tier: supabase-js @2.45.4 from jsDelivr
// ==============================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { getCurrentLang, t } from './i18n.js';

/**
 * Validates whether real Supabase credentials have been configured
 */
export function isConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (
    SUPABASE_URL.includes('YOUR-PROJECT') ||
    SUPABASE_URL.includes('YOUR_SUPABASE') ||
    SUPABASE_ANON_KEY.includes('YOUR_SUPABASE') ||
    SUPABASE_ANON_KEY.includes('YOUR-PROJECT')
  ) {
    return false;
  }
  return true;
}

let supabaseInstance = null;

/**
 * Returns the Supabase singleton client, or null if placeholder credentials
 */
export function getSupabase() {
  if (!isConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      supabaseInstance = createClient(cleanUrl, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * Renders a friendly setup guidance banner when running with placeholder config
 * Does not throw and does not make failing network requests.
 */
export function renderSetupNotice(container) {
  if (!container || isConfigured()) return;
  const lang = getCurrentLang();
  const isBn = lang === 'bn';

  const heading = isBn ? 'সুপাবেস (Supabase) সংযোগ অপেক্ষা করছে' : 'Supabase Backend Setup Required';
  const desc = isBn
    ? 'বর্তমানে ডেমো ডাটা প্রদর্শিত হচ্ছে। আপনার নিজস্ব ক্লাউড ডাটাবেজ সক্রিয় করতে <code>js/config.js</code> ফাইলে আপনার Supabase URL ও anon key যুক্ত করুন।'
    : 'Running in demonstration mode with seeded mock data. To connect your live database, add your Supabase URL & anon key into <code>js/config.js</code>.';

  const notice = document.createElement('div');
  notice.className = 'setup-notice wrap';
  notice.setAttribute('role', 'region');
  notice.setAttribute('aria-label', heading);
  notice.innerHTML = `
    <div class="setup-notice-content">
      <div class="setup-notice-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div>
        <strong>${heading}</strong>
        <p>${desc}</p>
      </div>
    </div>
  `;

  container.prepend(notice);
}

