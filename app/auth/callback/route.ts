import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If we are in a popup, we might want to redirect to a "success" page 
      // that sends a message to the opener and closes itself.
      return NextResponse.redirect(`${origin}/auth/callback-success?next=${encodeURIComponent(next)}`);
    }
    
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
  }

  const error = searchParams.get('error');
  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(searchParams.get('error_description') || error)}`);
  }

  return NextResponse.redirect(`${origin}/auth?error=auth-code-missing`);
}
