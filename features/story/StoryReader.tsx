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
    <div className="min-h-screen bg-transparent">
      {/* Story Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8 md:py-12">
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to chat
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
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
    </div>
  );
};
