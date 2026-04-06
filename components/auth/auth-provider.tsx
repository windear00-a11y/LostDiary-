'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (e) {
      logger.error('AuthProvider: Failed to initialize Supabase client:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.error('AuthProvider: Error getting session:', error.message);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (err) {
        logger.error('AuthProvider: Unexpected error in getSession:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      logger.log('AuthProvider: Auth state changed:', event);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthPage = pathname === '/auth';
  const isAppPage = pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/profile' || pathname === '/updates';
  const isLandingPage = pathname === '/';

  const isRedirecting = (!loading && !user && isAppPage) || (!loading && user && (isAuthPage || isLandingPage));

  // Route protection logic
  useEffect(() => {
    if (loading) return;

    if (!user && isAppPage) {
      router.push('/');
    } else if (user && (isAuthPage || isLandingPage)) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router, isAppPage, isAuthPage, isLandingPage]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const showLoader = loading || isRedirecting;

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {!supabase ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] gap-4 p-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Unavailable</h2>
          <p className="text-sm text-gray-600 max-w-sm">
            The application could not connect to the authentication service. Please check your environment configuration.
          </p>
        </div>
      ) : showLoader ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] gap-4">
          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
          <p className="text-sm text-[#6B7280] font-medium animate-pulse">Checking your session...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
