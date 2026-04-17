'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Share2 } from 'lucide-react';

interface StoryPreviewProps {
  story: string;
  onClose?: () => void;
}

export const StoryPreview = ({ story, onClose }: StoryPreviewProps) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My WinDear Moment',
          text: story,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(story);
      alert('Story copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-[#1A1A1A] border border-indigo-100/50 dark:border-indigo-900/20 rounded-[32px] p-8 shadow-xl shadow-indigo-100/10 dark:shadow-none my-8"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <BookOpen className="w-24 h-24 text-indigo-600" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Your Story
            </h3>
          </div>
          <button 
            onClick={handleShare}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full transition-colors"
            aria-label="Share this moment"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-serif italic leading-relaxed text-gray-800 dark:text-gray-200 relative"
          >
            <span className="relative z-10">{story}</span>
            <div className="absolute bottom-0 left-0 h-[40%] w-full bg-indigo-500/5 dark:bg-indigo-400/5 -z-0 pointer-events-none" />
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
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
