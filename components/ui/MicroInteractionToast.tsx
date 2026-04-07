'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMicroInteractionStore } from '@/lib/store/use-micro-interaction-store';

export const MicroInteractionToast: React.FC = () => {
  const { message, setMessage } = useMicroInteractionStore();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4 pointer-events-none"
        >
          <div className="text-center">
            <p className="text-[11px] font-medium text-indigo-400/60 dark:text-indigo-400/40 italic tracking-wider uppercase">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
