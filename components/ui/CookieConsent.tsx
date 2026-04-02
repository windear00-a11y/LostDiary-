'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to make it feel more natural
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem('cookie-consent', choice);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 z-[100] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] shadow-2xl shadow-indigo-100/50 dark:shadow-none rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 pointer-events-auto">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <Cookie className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                We use cookies to improve your experience.
              </p>
              <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
                By clicking &ldquo;Accept&rdquo;, you agree to our use of cookies for analytics and personalization. Read our{' '}
                <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link> to learn more.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleChoice('rejected')}
                className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleChoice('accepted')}
                className="flex-1 sm:flex-none px-8 py-3 bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] rounded-xl text-sm font-semibold hover:bg-[#1f2937] dark:hover:bg-white transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Accept
              </button>
            </div>

            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
