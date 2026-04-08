'use client';

import React, { useEffect, useState } from 'react';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { authService } from '@/lib/services/auth-service';
import { BookOpen, Calendar, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const LifeBookView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const user = await authService.getUser();
      if (user) {
        const data = await chapterService.fetchChapters(user.id);
        setChapters(data);
      }
    } catch (error) {
      console.error("Failed to load chapters", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const user = await authService.getUser();
      if (!user) return;

      const res = await fetch('/api/chapters/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        await loadChapters();
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && chapters.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <p className="text-gray-900 dark:text-gray-100 font-bold text-xl">Your story is just beginning</p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Keep writing in your timeline. Chapters will automatically generate as your story unfolds.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Generating Chapters...' : 'Generate Past Chapters'}
        </button>
      </div>
    );
  }

  if (selectedChapter) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <button 
          onClick={() => setSelectedChapter(null)}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          ← Back to Chapters
        </button>

        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            {selectedChapter.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(selectedChapter.start_date), 'MMMM yyyy')} 
              {selectedChapter.end_date ? ` - ${format(new Date(selectedChapter.end_date), 'MMMM yyyy')}` : ' - Present'}
            </span>
            {selectedChapter.dominant_emotion && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {selectedChapter.dominant_emotion}
              </span>
            )}
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300">
          {selectedChapter.story_content ? (
            selectedChapter.story_content.split('\\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))
          ) : (
            <p className="italic text-gray-400">This chapter is still being written...</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#2E2E2E] text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Chapters'}
        </button>
      </div>
      
      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedChapter(chapter)}
            className="group cursor-pointer bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-2xl p-6 hover:shadow-md transition-all duration-200 flex items-center justify-between"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {chapter.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(chapter.start_date), 'MMM yyyy')}
                </span>
                {chapter.dominant_categories && chapter.dominant_categories.length > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#2E2E2E] rounded-full text-xs font-medium">
                    {chapter.dominant_categories[0]}
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2E2E2E] flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
