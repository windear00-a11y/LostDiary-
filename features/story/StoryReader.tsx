'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chapter } from '@/lib/services/core-service';

interface StoryReaderProps {
  chapters: Chapter[];
  onBack: () => void;
}

export const StoryReader = ({ chapters, onBack }: StoryReaderProps) => {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen transition-colors duration-1000"
      style={{
        background: 'linear-gradient(135deg, #fdfcfb 0%, #f1f5f9 100%)'
      }}
    >
      {/* Subtle animated gradient overlay */}
      <motion.div 
        animate={{
          background: [
            'linear-gradient(135deg, #fdfcfb 0%, #f1f5f9 100%)',
            'linear-gradient(135deg, #fdfcfb 0%, #e2e8f0 100%)',
            'linear-gradient(135deg, #fdfcfb 0%, #f1f5f9 100%)'
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="fixed inset-0 z-0"
      />
      
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-transparent backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to chat
          </button>
        </div>
      </div>

      {/* Story Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-24"
        >
          {chapters.map((chapter, index) => (
            <article key={chapter.id || index} className="space-y-8">
              {/* Chapter Title */}
              <header className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  {chapter.title || `Chapter ${index + 1}`}
                </h2>
                <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </header>

              {/* Chapter Content */}
              <div className="prose prose-slate dark:prose-invert prose-lg md:prose-xl font-serif leading-relaxed text-slate-800 dark:text-slate-300">
                {chapter.content.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-6">{paragraph}</p>
                ))}
              </div>

              {/* Subtle Divider */}
              {index < chapters.length - 1 && (
                <div className="flex justify-center py-12">
                  <div className="text-2xl tracking-[0.5em] text-slate-300 dark:text-slate-700">***</div>
                </div>
              )}
            </article>
          ))}
        </motion.div>
      </main>
    </motion.div>
  );
};
