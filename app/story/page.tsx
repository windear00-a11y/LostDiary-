'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { BookView } from '@/features/story/BookView';

export default function StoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] flex flex-col transition-colors duration-500">
      {/* Minimal Floating Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/home')}
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-lg border border-white/10 text-slate-400 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
          <h1 className="text-xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Your Story</h1>
        </div>

        <div className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/home')}
            className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 shadow-sm border border-indigo-100 dark:border-indigo-500/20"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <main className="flex-1 relative z-0">
        <BookView />
      </main>
    </div>
  );
}
