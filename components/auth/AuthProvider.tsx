'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { authService } from '@/lib/services/auth-service';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AlertCircle } from 'lucide-react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';

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
      console.error('AuthProvider: Failed to initialize Supabase client:', e);
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
        const currentUser = await authService.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('AuthProvider: Unexpected error in initializeAuth:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('AuthProvider: Auth state changed:', event);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthPage = pathname === '/auth';
  const isLandingPage = pathname === '/';

  const signOut = async () => {
    try {
      await authService.signOut();
      router.push('/');
    } catch (err) {
      console.error('AuthProvider: Error signing out:', err);
    }
  };

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
