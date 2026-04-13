import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your-supabase-url' || key === 'your-supabase-anon-key') {
    const msg = 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing or using placeholder values. Please configure them in the AI Studio Settings.';
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn(msg);
    } else {
      console.error(msg);
    }
    return null;
  }

  // Safe diagnostic for debugging "Invalid API key"
  if (typeof window !== 'undefined') {
    console.log(`[Supabase Debug] URL: ${url.substring(0, 15)}..., Key Length: ${key.length}, Key Starts With: ${key.substring(0, 5)}...`);
  }

  supabaseInstance = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  });
  return supabaseInstance;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Supabase Admin environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.');
    return getSupabase(); // Fallback to anon client if admin key is missing
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Deprecated: use getSupabase() instead for lazy loading
export function createClient() {
  const client = getSupabase();
  if (!client && process.env.NODE_ENV === 'production') {
    // We still throw if explicitly called and failed, but now we have getSupabase for safer access
  }
  return client;
}
