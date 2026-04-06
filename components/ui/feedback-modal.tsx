'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState<'loved' | 'improvement' | null>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    logger.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  const handleSubmit = async () => {
    if (!rating || !supabase) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('feedback')
      .insert([{ rating, text }]);

    if (!error) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setRating(null);
        setText('');
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111827]/20 dark:bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-[#2E2E2E] space-y-6"
          >
            {isSuccess ? (
              <div className="text-center py-8">
                <p className="text-xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">Send Feedback</h2>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full">
                    <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setRating('loved')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-colors ${
                      rating === 'loved' 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' 
                        : 'border-gray-100 dark:border-[#2E2E2E] bg-white dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                  </button>
                  <button
                    onClick={() => setRating('improvement')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-colors ${
                      rating === 'improvement' 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' 
                        : 'border-gray-100 dark:border-[#2E2E2E] bg-white dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="w-full p-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-[#111827] dark:text-[#F9FAFB] transition-all outline-none resize-none"
                  rows={4}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!rating || isSubmitting}
                  className="w-full bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] py-4 rounded-2xl font-medium hover:bg-[#1f2937] dark:hover:bg-white transition-all disabled:opacity-50"
                >
                  Submit Feedback
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
