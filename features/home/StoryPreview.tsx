'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen } from 'lucide-react';

interface StoryPreviewProps {
  story: string;
  onClose?: () => void;
}

export const StoryPreview = ({ story, onClose }: StoryPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-[#1A1A1A] border border-indigo-100/50 dark:border-indigo-900/20 rounded-[32px] p-8 shadow-xl shadow-indigo-100/10 dark:shadow-none my-8"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <BookOpen className="w-24 h-24 text-indigo-600" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Your Story
          </h3>
        </div>

        <div className="space-y-3">
          <motion.p 
            initial={{ filter: 'blur(4px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.5 }}
            className="text-lg font-serif italic leading-relaxed text-gray-800 dark:text-gray-200 relative"
          >
            <span className="relative z-10">{story}</span>
            <motion.span 
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.2, duration: 2, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 h-[40%] bg-indigo-500/5 dark:bg-indigo-400/5 -z-0 pointer-events-none"
            />
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="pt-4 flex items-center gap-4"
        >
          <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-900/20" />
          <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-widest">
            WinDear Reflection
          </span>
          <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-900/20" />
        </motion.div>
      </div>
    </motion.div>
  );
};
