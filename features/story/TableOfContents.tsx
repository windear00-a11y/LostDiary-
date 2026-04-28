'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { Chapter, Volume } from '@/lib/services/core-service';

interface TableOfContentsProps {
  chapters: Chapter[];
  volumes?: Volume[];
  onSelectChapter: (id: string | null) => void;
  onBack: () => void;
  title: string;
}

/**
 * TableOfContents - A dedicated "Vishay Suchi" page that looks like a classic book.
 */
export const TableOfContents = ({ chapters, volumes = [], onSelectChapter, onBack, title }: TableOfContentsProps) => {
  const volumesWithChapters = volumes.length > 0 
    ? volumes.sort((a, b) => a.volume_number - b.volume_number).map(v => ({
        ...v,
        chapters: chapters.filter(c => c.volume_id === v.id)
      })).filter(v => v.chapters.length > 0 || v.status === 'ongoing')
    : [{ title: 'Chapter List', chapters }];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen max-w-2xl mx-auto px-8 py-20 font-serif"
    >
      {/* Header */}
      <div className="mb-20 space-y-8 text-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mx-auto mb-12"
        >
          <ArrowLeft className="w-3 h-3" /> Close Cover
        </button>
        
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.8em] text-slate-400 font-bold">Contents</h2>
          <h1 className="text-4xl font-bold text-[var(--color-primary-text-dark)] tracking-tight">{title}</h1>
          <div className="w-12 h-px bg-slate-200 dark:bg-white/10 mx-auto mt-6" />
        </div>
      </div>

      {/* List grouped by Volumes */}
      <div className="space-y-16">
        {volumesWithChapters.map((vol, volIdx) => (
          <div key={volIdx} className="space-y-8">
            {volumes.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-bold whitespace-nowrap">Volume {volIdx + 1}</span>
                <div className="h-px w-full bg-slate-100 dark:bg-white/5" />
              </div>
            )}
            
            <div className="space-y-8 pl-4 border-l border-slate-100 dark:border-white/5">
              {vol.chapters.map((chapter, index) => (
                <motion.button
                  key={chapter.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelectChapter(chapter.id)}
                  className="w-full group flex items-baseline justify-between text-left border-b border-dotted border-slate-200 dark:border-white/10 pb-4 hover:border-slate-400 dark:hover:border-white/30 transition-colors"
                >
                  <div className="flex items-baseline gap-6">
                    <span className="text-[10px] tabular-nums font-bold text-slate-400 uppercase tracking-widest min-w-[30px]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="space-y-1">
                      <span className="text-lg md:text-xl text-[var(--color-primary-text-dark)] group-hover:text-black dark:group-hover:text-white transition-colors">
                        {chapter.name}
                      </span>
                      <div className="text-[9px] uppercase tracking-widest text-slate-400">
                        {new Date(chapter.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 group-hover:text-amber-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {/* Start Reading All */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: chapters.length * 0.1 + 0.2 }}
          className="pt-16 text-center"
        >
          <button
            onClick={() => onSelectChapter(null)}
            className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-xl"
          >
            Start From Beginning
          </button>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="mt-32 text-center opacity-20 pointer-events-none">
        <div className="text-2xl tracking-[0.5em] text-slate-400">***</div>
      </div>
    </motion.div>
  );
};
