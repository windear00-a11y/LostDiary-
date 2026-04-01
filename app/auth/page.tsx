'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { Book, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useAuth();
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth-code-error') {
      setMessage({ type: 'error', text: 'Authentication failed. Please try again or use a different method.' });
    } else if (error === 'auth-code-missing') {
      // Ignore this error as it's not critical
    } else if (error) {
      setMessage({ type: 'error', text: error });
    }

    const code = searchParams.get('code');
    if (code && supabase && !exchangeAttempted.current) {
      exchangeAttempted.current = true;
      setIsSubmitting(true);
      supabase.auth.exchangeCodeForSession(code).then((response: any) => {
        if (response.error) {
          setMessage({ type: 'error', text: response.error.message });
          setIsSubmitting(false);
          exchangeAttempted.current = false;
          router.replace('/auth');
        } else {
          router.push(searchParams.get('next') || '/app');
        }
      });
    }
  }, [searchParams, supabase, router]);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/app`,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;

      if (data?.url) {
        const authWindow = window.open(
          data.url,
          'oauth_popup',
          'width=600,height=700'
        );
        if (!authWindow) {
          setMessage({ type: 'error', text: 'Please allow popups for this site to connect your account.' });
          setIsSubmitting(false);
        } else {
          const timer = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(timer);
              setIsSubmitting(false);
            }
          }, 500);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to sign in with Google' });
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Ensure the message comes from our own domain (works for localhost, run.app, vercel.app, etc.)
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost') && !event.origin.includes('vercel.app')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('OAUTH_AUTH_SUCCESS received');
        router.push('/app');
      } else if (event.data?.type === 'OAUTH_CALLBACK') {
        console.log('OAUTH_CALLBACK received', event.data);
        const url = new URL(event.data.url);
        const code = url.searchParams.get('code');
        console.log('Code:', code);
        if (code && supabase && !exchangeAttempted.current) {
          exchangeAttempted.current = true;
          setIsSubmitting(true);
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          console.log('Exchange error:', error);
          if (error) {
            setMessage({ type: 'error', text: error.message });
            setIsSubmitting(false);
            exchangeAttempted.current = false;
          } else {
            router.push(url.searchParams.get('next') || '/app');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, supabase]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.' });
      return;
    }
    if (!email) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Check your email for the login link!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send magic link' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-6 pt-safe pb-safe relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-8"
      >
        <div className="absolute -top-16 right-0">
          <LanguageSwitcher />
        </div>
        <div className="text-center space-y-6">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t('auth.back')}
          </button>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
              <Book className="w-6 h-6 text-[#6366F1]" />
            </div>
            <h1 className="text-3xl font-serif italic tracking-tight text-[#111827]">{t('auth.welcome')}</h1>
            <p className="text-[#6B7280] text-sm max-w-[280px] mx-auto">
              {t('auth.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-[#374151] px-6 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('auth.signingIn')}</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('auth.google')}
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-[#9CA3AF]">
              <span className="bg-white px-4">{t('auth.orEmail')}</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading || !email}
              className="w-full bg-[#111827] text-white py-4 rounded-2xl font-medium hover:bg-[#1f2937] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('auth.sending')}</span>
                </>
              ) : t('auth.sendLink')}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-3 text-sm p-4 rounded-xl ${
                  message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {message.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="flex-1">{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-[#9CA3AF] font-serif italic">
          Takes less than 10 seconds to start.
        </p>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
