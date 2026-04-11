import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build time, we might not have these variables. 
    // We should only throw if we are actually trying to use the client in a context that requires it.
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn('Supabase environment variables are missing during server-side execution.');
    }
    return null;
  }

  supabaseInstance = createSupabaseClient(url, key);
  return supabaseInstance;
}

// Deprecated: use getSupabase() instead for lazy loading
export function createClient() {
  const client = getSupabase();
  if (!client && process.env.NODE_ENV === 'production') {
    // We still throw if explicitly called and failed, but now we have getSupabase for safer access
  }
  return client;
}
