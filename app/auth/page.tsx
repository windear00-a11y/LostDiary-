'use client';

import { useState, Suspense } from 'react';
import { authService } from '@/lib/services/auth-service';
import { motion } from 'motion/react';
import { useAuth } from '@/components/auth/auth-provider';
import { LoadingSpace } from '@/components/ui/LoadingSpace';

function AuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] z-0" />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-xs text-center space-y-8"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-400 font-serif italic">Your story is waiting.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full bg-white text-black py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-black rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-black rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-black rounded-full" />
              </div>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-transparent"><LoadingSpace /></div>}>
      <AuthForm />
    </Suspense>
  );
}
