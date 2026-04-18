'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { coreService, Chapter } from '@/lib/services/core-service';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

interface LifeBookPreviewProps {
  userId: string;
  refreshTrigger?: number;
}

export const StoryPreviewCard = ({ userId, refreshTrigger }: LifeBookPreviewProps) => {
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setActiveView } = useUIStore();

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const chapters = await coreService.fetchChapters(userId);
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
      <div className="w-full h-32 bg-gray-50 dark:bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-1 bg-indigo-400 rounded-full"
          />
          <span className="text-[10px] text-slate-400 font-serif italic tracking-widest uppercase">Listening...</span>
        </div>
      </div>
    );
  }

  if (!latestChapter) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setActiveView('story')}
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
            {latestChapter.title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-serif italic">
            {latestChapter.content?.substring(0, 150) || "Your narrative is being woven from your latest entries..."}{latestChapter.content?.length > 150 ? "..." : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-[#1A1A1A] bg-indigo-100 dark:bg-indigo-900/40" />
            ))}
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Capture {new Date(latestChapter.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
