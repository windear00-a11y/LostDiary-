'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { authService } from '@/lib/services/auth-service';
import { Book, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

function AuthForm() {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useAuth();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) });
    }
  }, [searchParams]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authService.signInWithOtp(identifier);
      setStep('otp');
      setMessage({ type: 'success', text: 'OTP sent! Please check your inbox or phone.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send OTP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authService.verifyOtp(identifier, otp);
      router.push('/home');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verification failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Google login failed' });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12 text-center"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-white dark:bg-[#161616] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800/50">
              <Book className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-3xl font-serif italic tracking-tight">WinDear</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your private story begins here.</p>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 'identifier' ? (
              <motion.form 
                key="identifier"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp} 
                className="space-y-4"
              >
                <input
                  type="text"
                  placeholder="Email or Phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white dark:bg-[#161616] border border-gray-100 dark:border-gray-800/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !identifier}
                  className="w-full bg-[#111827] dark:bg-[#fdfcfb] text-white dark:text-[#111827] py-4 rounded-2xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-4"
              >
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white dark:bg-[#161616] border border-gray-100 dark:border-gray-800/50 rounded-2xl text-sm text-center tracking-[0.5em] font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !otp}
                  className="w-full bg-[#111827] dark:bg-[#fdfcfb] text-white dark:text-[#111827] py-4 rounded-2xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                </button>
                <button 
                  type="button"
                  onClick={() => setStep('identifier')}
                  className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  Change email or phone
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 'identifier' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800/50"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-[#02040a] px-4 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-white dark:bg-[#161616] border border-gray-100 dark:border-gray-800/50 py-4 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs p-4 rounded-xl ${
                  message.type === 'success' ? 'bg-green-50/50 text-green-600' : 'bg-red-50/50 text-red-600'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">
          &copy; {new Date().getFullYear()} WinDear
        </p>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#02040a]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
