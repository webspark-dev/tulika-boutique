// Tulika Boutique Configuration
// The anon/publishable key is safe for browser use because Row Level Security (RLS) protects the database.
// NEVER put your service_role secret key in this file.

const env = (typeof window !== 'undefined' && window.__ENV__) || {};

export const SUPABASE_URL = env.SUPABASE_URL || "https://meqwvikovixhokehjmee.supabase.co";
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || "sb_publishable_Kx8qK3E6ML19iBtLw4-wOw_IqEtQuTh";
export const SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY;
export const WHATSAPP_PLACEHOLDER = env.WHATSAPP_NUMBER || "919876543210";
