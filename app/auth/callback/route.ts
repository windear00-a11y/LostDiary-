import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  logger.log('Auth Callback: Received request', { code: !!code, next });

  if (code) {
    logger.log('Auth Callback: Redirecting to /auth with code');
    return NextResponse.redirect(`${origin}/auth?code=${code}&next=${encodeURIComponent(next)}`);
  }

  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    logger.error('Auth Callback: Error received', { error, error_description });
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`);
  }

  logger.warn('Auth Callback: Missing code and error');
  return NextResponse.redirect(`${origin}/auth?error=auth-code-missing`);
}
