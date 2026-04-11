'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Book, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfb] dark:bg-[#0d0d0d] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <Book className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-[#fdfcfb]">
            This chapter is missing.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-serif italic">
            It seems you&apos;ve wandered into a page that hasn&apos;t been written yet.
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href={user ? "/home" : "/"}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#111827] dark:bg-[#fdfcfb] text-white dark:text-[#111827] rounded-full font-medium hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to your story
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

