'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfb] dark:bg-[#0d0d0d] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-[#fdfcfb]">
            Something went wrong.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-serif italic">
            WinDear encountered an unexpected error while writing your story.
          </p>
          {error.message && (
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-mono text-gray-400 break-all">
              {error.message}
            </div>
          )}
        </div>

        <div className="pt-8">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#111827] dark:bg-[#fdfcfb] text-white dark:text-[#111827] rounded-full font-medium hover:scale-105 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
