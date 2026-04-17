'use client';

import { useState, useMemo } from 'react';
import { authService } from '@/lib/services/auth-service';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authService.updatePassword(password);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => router.push('/auth'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-xl dark:shadow-none border border-gray-100 dark:border-[#2E2E2E] space-y-6">
          <h1 className="text-2xl font-serif italic text-center text-[#111827] dark:text-[#F9FAFB]">Update Password</h1>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] py-4 rounded-2xl font-medium hover:bg-[#1f2937] dark:hover:bg-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-white dark:bg-[#0A0A0A] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-white dark:bg-[#0A0A0A] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-white dark:bg-[#0A0A0A] rounded-full" />
                </div>
              ) : 'Update Password'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
              {message.type === 'error' && <AlertCircle className="w-4 h-4 inline mr-2" />}
              {message.text}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
