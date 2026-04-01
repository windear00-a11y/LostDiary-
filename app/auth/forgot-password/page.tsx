'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your email for the password reset link!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset link' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
          <h1 className="text-2xl font-serif italic text-center">Reset Password</h1>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full bg-[#111827] text-white py-4 rounded-2xl font-medium hover:bg-[#1f2937] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'error' && <AlertCircle className="w-4 h-4 inline mr-2" />}
              {message.text}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
