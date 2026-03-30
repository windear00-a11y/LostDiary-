import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: any = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  supabaseInstance = createBrowserClient(url, key, {
    cookieOptions: {
      name: 'sb-auth-token',
      sameSite: 'none',
      secure: true,
      maxAge: 31536000, // 1 year
    }
  });
  return supabaseInstance;
}
