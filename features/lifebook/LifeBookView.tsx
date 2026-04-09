'use client';

import React, { useEffect, useState } from 'react';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { authService } from '@/lib/services/auth-service';
import { BookOpen, Calendar, Sparkles, ChevronRight, RefreshCw, Book as BookIcon, LayoutGrid, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { BookRenderer } from './BookRenderer';
import { ImmersiveReader } from './ImmersiveReader';

export const LifeBookView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'book'>('grid');
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);

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
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-gray-900 dark:text-gray-100">
            {selectedChapter.name}
          </h2>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(selectedChapter.start_date), 'MMMM yyyy')} 
              {selectedChapter.end_date ? ` - ${format(new Date(selectedChapter.end_date), 'MMMM yyyy')}` : ' - Present'}
            </span>
            {selectedChapter.dominant_emotion && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {selectedChapter.dominant_emotion}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              The Narrative
            </h3>
            <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none font-serif leading-relaxed text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1A1A1A] p-10 rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
              {selectedChapter.authored_content ? (
                selectedChapter.authored_content.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
                  <p key={idx} className={idx === 0 ? "first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-indigo-600 dark:first-letter:text-indigo-400" : ""}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="italic text-gray-400">This chapter is still being written...</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-[#2E2E2E]">
              {selectedChapter.events && selectedChapter.events.length > 0 ? (
                selectedChapter.events.map((event, idx) => (
                  <div key={event.id} className="relative pl-10">
                    <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 border-4 border-white dark:border-[#0A0A0A]" />
                    <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                        {format(new Date(event.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {event.summary}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                          event.emotion === 'positive' ? 'bg-green-50 text-green-600 border border-green-100' :
                          event.emotion === 'negative' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-gray-50 text-gray-500 border border-gray-100'
                        }`}>
                          {event.emotion}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                          {event.intensity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic pl-10">No events recorded in this chapter yet.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'book' && !selectedChapter) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">The Narrative</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-full bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 hover:text-indigo-600 transition-colors"
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#2E2E2E] text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
        <BookRenderer chapters={chapters} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImmersiveReader 
        chapters={chapters} 
        isOpen={isImmersiveOpen} 
        onClose={() => setIsImmersiveOpen(false)} 
      />

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Chapters</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImmersiveOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Immersive Reader
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'book' : 'grid')}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            {viewMode === 'grid' ? <BookIcon className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            {viewMode === 'grid' ? 'Read Mode' : 'Grid Mode'}
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#2E2E2E] text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
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
                {chapter.name}
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
