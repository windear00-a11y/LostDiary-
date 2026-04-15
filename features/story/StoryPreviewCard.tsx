'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { useRouter } from 'next/navigation';

interface LifeBookPreviewProps {
  userId: string;
  refreshTrigger?: number;
}

export const StoryPreviewCard = ({ userId, refreshTrigger }: LifeBookPreviewProps) => {
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const chapters = await chapterService.fetchChapters(userId);
        if (chapters && chapters.length > 0) {
          setLatestChapter(chapters[0]);
        }
      } catch (error) {
        console.error("Error loading latest chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLatest();
  }, [userId, refreshTrigger]);

  if (loading) {
    return (
      <div className="w-full h-32 bg-gray-50 dark:bg-[#1A1A1A] rounded-[2rem] animate-pulse flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!latestChapter) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push('/story')}
      className="group relative overflow-hidden bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/20 transition-all duration-500 cursor-pointer mb-8"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <BookOpen className="w-20 h-20 text-indigo-600" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Your LifeBook is growing...
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-serif italic text-slate-900 dark:text-slate-100">
            {latestChapter.name}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-serif italic">
            {latestChapter.narrative || latestChapter.summary || "Your narrative is being woven from your latest entries..."}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-[#1A1A1A] bg-indigo-100 dark:bg-indigo-900/40" />
            ))}
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {latestChapter.events?.length || 0} moments captured
          </span>
        </div>
      </div>
    </motion.div>
  );
};
