'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

export const CookieConsent = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsent = localStorage.getItem('cookie_consent');
    if (!hasConsent) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 z-[999]"
        >
          <div className="max-w-xl mx-auto bg-[#1A1A1D]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3 text-white">
              <Cookie className="w-5 h-5 text-indigo-400" />
              <p className="text-[12px] font-serif italic">
                Essential cookies used to preserve your sanctuary. <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">Learn more</Link>.
              </p>
            </div>
            <button
              onClick={handleAccept}
              aria-label="Accept cookies"
              className="ml-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-[10px] uppercase tracking-widest font-bold transition-colors"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
