'use client';

import { useAuth } from './auth-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define paths that require authentication
  const isAppPage = pathname === '/home' || 
                    pathname.startsWith('/home/') || 
                    pathname === '/profile' || 
                    pathname === '/updates' ||
                    pathname === '/story';
  
  // Define paths that should be inaccessible to logged in users
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';

  useEffect(() => {
    if (!loading) {
      if (!user && isAppPage) {
        // Redirection once if not logged in and trying to access app
        router.push('/');
      } else if (user && (isAuthPage || isLandingPage)) {
        // Redirection once if logged in and trying to access auth/landing
        router.push('/home');
      }
    }
  }, [user, loading, pathname, router, isAppPage, isAuthPage, isLandingPage]);

  // Handle Loading States and Prevent Flicker
  // If still loading auth state, show global loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d]">
        <LoadingSpace message="Finding your story..." />
      </div>
    );
  }

  // If redirecting, continue showing loader to prevent flicker of unauthorized content
  const isRedirecting = (!loading && !user && isAppPage) || (!loading && user && (isAuthPage || isLandingPage));
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d]">
        <LoadingSpace message="Connecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
