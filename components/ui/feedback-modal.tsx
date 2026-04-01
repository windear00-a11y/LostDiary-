'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<'loved' | 'improvement' | null>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
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
            className="absolute inset-0 bg-[#111827]/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6"
          >
            {isSuccess ? (
              <div className="text-center py-8">
                <p className="text-xl font-serif italic">{t('feedback.success')}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-serif italic text-[#111827]">{t('feedback.title')}</h2>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setRating('loved')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border ${
                      rating === 'loved' ? 'bg-indigo-50 border-indigo-200' : 'border-gray-100'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                  </button>
                  <button
                    onClick={() => setRating('improvement')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border ${
                      rating === 'improvement' ? 'bg-indigo-50 border-indigo-200' : 'border-gray-100'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                  rows={4}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!rating || isSubmitting}
                  className="w-full bg-[#111827] text-white py-4 rounded-2xl font-medium hover:bg-[#1f2937] transition-all disabled:opacity-50"
                >
                  {t('feedback.submit')}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
