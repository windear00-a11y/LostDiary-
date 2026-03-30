'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

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
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error.message);
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      } else if (event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthPage = pathname === '/auth';
  const isAppPage = pathname === '/app' || pathname.startsWith('/app/');
  const isLandingPage = pathname === '/';

  const isRedirecting = (!loading && !user && isAppPage) || (!loading && user && (isAuthPage || isLandingPage));

  // Route protection logic
  useEffect(() => {
    if (loading) return;

    if (!user && isAppPage) {
      router.push('/');
    } else if (user && (isAuthPage || isLandingPage)) {
      router.push('/app');
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
      {showLoader ? (
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
