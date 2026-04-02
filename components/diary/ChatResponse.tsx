'use client';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatResponseProps {
  response: string | null;
  onClose: () => void;
  t: any;
}

export function ChatResponse({ response, onClose, t }: ChatResponseProps) {
  return (
    <AnimatePresence>
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-8 rounded-[2.5rem] relative group"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            aria-label="Close response"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800/30">
              <MessageCircle className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#6366F1]">
                WinDear Assistant
              </p>
              <h3 className="text-lg font-serif italic text-[#111827] dark:text-[#F9FAFB]">
                Your Memory Insight
              </h3>
            </div>
          </div>

          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <div className="text-[#374151] dark:text-[#D1D5DB] leading-relaxed text-lg italic font-serif">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="ml-4">{children}</li>,
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Generated based on your diary entries
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
