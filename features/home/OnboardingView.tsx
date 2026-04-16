'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const OnboardingView = ({ onStart }: { onStart: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#fdfcfb] dark:bg-[#0d0d0d]"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            I&apos;m here to listen. What&apos;s on your mind?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-serif italic">
            Let&apos;s turn your thoughts into something meaningful.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
