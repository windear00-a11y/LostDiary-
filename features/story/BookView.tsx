'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { coreService, Chapter } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { BookRenderer } from './BookRenderer';
import { StoryReader } from './StoryReader';
// import { InsightsView } from './InsightsView';
import { PipelineController } from '@/ai-core/pipeline-controller';
import { analyzeEntries } from '@/ai-core/pattern-detector';

const SkeletonLoader = () => (
  <div className="max-w-[700px] mx-auto pt-20 px-6 space-y-8 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
    </div>
  </div>
);

const GhostBook = () => (
  <div className="max-w-[650px] mx-auto font-serif opacity-40 select-none pointer-events-none">
    <div className="text-center mb-16 space-y-4">
      <div className="text-[10px] uppercase tracking-[0.5em] text-gray-300">Chapter I</div>
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-48 mx-auto blur-[2px]" />
      <div className="w-8 h-px bg-gray-100 dark:bg-gray-800 mx-auto mt-6" />
    </div>
    
    <div className="space-y-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full blur-[3px]" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full blur-[2px]" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6 blur-[4px]" />
        </div>
      ))}
    </div>

    <div className="mt-32 text-center">
      <div className="text-2xl tracking-[1em] text-gray-200">***</div>
    </div>
  </div>
);

export const BookView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [openingText, setOpeningText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'narrative' | 'insights'>('narrative');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await authService.getUser();
        if (user) {
          const [chaptersData, messagesData] = await Promise.all([
            coreService.fetchChapters(user.id),
            coreService.fetchMessages(user.id)
          ]);
          
          setChapters(chaptersData);

          // Generate dynamic opening
          if (chaptersData.length > 0) {
            const pipeline = new PipelineController(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
            const patterns = analyzeEntries(messagesData.map(m => m.content || ""));
            const allEvents = chaptersData.flatMap(c => c.events || []);
            
            const opening = await pipeline.generateOpening(allEvents, patterns);
            setOpeningText(opening);
          }
        }
      } catch (error) {
        console.error("Failed to load data", error);
        setError("Failed to load your LifeBook. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] flex flex-col items-center justify-center p-10 text-center">
        <div className="space-y-6 max-w-sm">
          <p className="text-rose-500 font-serif italic">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try Refreshing
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="bg-[#fdfcfb] dark:bg-[#0d0d0d] min-h-screen transition-colors duration-1000"
    >
      <div className="max-w-[800px] mx-auto pt-16 pb-48 px-10">
        {/* Subtle View Toggle */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex p-1 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5">
            <button
              onClick={() => setView('narrative')}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === 'narrative' 
                  ? 'bg-white dark:bg-[#2E2E2E] text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Narrative
            </button>
            {/* Reflections toggle disabled (Future feature) */}
            {/*
            <button
              onClick={() => setView('insights')}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === 'insights' 
                  ? 'bg-white dark:bg-[#2E2E2E] text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Reflections
            </button>
            */}
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className="space-y-20">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }}
                className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-8 opacity-30"
              >
                <BookOpen className="w-8 h-8 text-gray-300" />
              </motion.div>
              <h2 className="text-4xl font-serif italic text-gray-400 dark:text-gray-600 tracking-tight">
                Your story is waiting to be written...
              </h2>
              <p className="text-gray-300 dark:text-gray-700 max-w-sm mx-auto leading-relaxed font-serif italic">
                जैसे-जैसे आप यादें साझा करेंगे, आपकी कहानी के पन्ने यहाँ खुद-ब-खुद जुड़ते जाएंगे।
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <GhostBook />
            </motion.div>
          </div>
        ) : (
          <StoryReader chapters={chapters} onBack={() => window.history.back()} />
        )}
      </div>
    </motion.div>
  );
};
