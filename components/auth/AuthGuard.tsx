'use client';

import { useAuth } from './AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { coreService } from '@/lib/services/core-service';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define paths that require authentication
  const isAppPage = pathname === '/home' ||
                    pathname === '/library' ||
                    pathname === '/profile' ||
                    pathname.startsWith('/bridge');
  
  // Define paths that should be inaccessible to logged in users
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';

  useEffect(() => {
    const checkState = async () => {
      if (!loading) {
        if (!user && isAppPage) {
          router.push('/');
        } else if (user && (isAuthPage || isLandingPage)) {
          router.push('/home');
        }
      }
    };
    checkState();
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
