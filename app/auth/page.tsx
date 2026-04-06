'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { Book, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const { loading } = useAuth();
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (e) {
      logger.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Authentication is not configured.' });
      return;
    }
    if (!email || !password) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! You can now sign in.' });
        setIsSignUp(false);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-4 sm:p-6 pt-safe pb-safe relative overflow-hidden transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-50 dark:bg-yellow-900/10 rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-6">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-[#2E2E2E]">
              <Book className="w-6 h-6 text-[#6366F1]" />
            </div>
            <h1 className="text-3xl font-serif italic tracking-tight text-[#111827] dark:text-[#F9FAFB]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 dark:shadow-none border border-gray-100 dark:border-[#2E2E2E] space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] dark:text-gray-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
              />
            </div>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-sm text-[#6366F1] dark:text-indigo-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 w-full text-right"
              >
                Forgot password?
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || loading || !email || !password}
              className="w-full bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] py-4 rounded-2xl font-medium hover:bg-[#1f2937] dark:hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? 'Creating...' : 'Signing in...'}</span>
                </>
              ) : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F9FAFB]"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-3 text-sm p-4 rounded-xl ${
                  message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}>
                  {message.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="flex-1">{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-gray-500 font-medium pt-4">
          <button onClick={() => router.push('/privacy')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Privacy Policy</button>
          <button onClick={() => router.push('/terms')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Terms of Service</button>
          <button onClick={() => router.push('/support')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Support</button>
        </div>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0A0A]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
