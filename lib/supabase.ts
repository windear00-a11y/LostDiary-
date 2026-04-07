import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const errorMsg = 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  supabaseInstance = createSupabaseClient(url, key);
  return supabaseInstance;
}
