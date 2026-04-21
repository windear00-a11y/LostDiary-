'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { coreService, Chapter, Volume } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useAuth } from '@/components/auth/auth-provider';
import { BookRenderer } from './BookRenderer';
import { StoryReader } from './StoryReader';
// import { InsightsView } from './InsightsView';
import { PipelineController } from '@/ai-core/pipeline-controller';
import { analyzeEntries } from '@/ai-core/pattern-detector';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { LifeBookCover } from './LifeBookCover';
import { TableOfContents } from './TableOfContents';

const SkeletonLoader = () => (
  <div className="max-w-[700px] mx-auto pt-40 px-6">
    <LoadingSpace message="Assembling your narrative..." />
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
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [openingText, setOpeningText] = useState<string | null>(null);
  const [coverData, setCoverData] = useState<{ title: string; summary: string; aura: string } | null>(null);
  const [viewState, setViewState] = useState<'cover' | 'toc' | 'reader'>('cover');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveView } = useUIStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await authService.getUser();
        if (user) {
          const [chaptersData, volumesData, messagesData] = await Promise.all([
            coreService.fetchChapters(user.id),
            coreService.fetchVolumes(user.id),
            coreService.fetchMessages(user.id)
          ]);
          
          setChapters(chaptersData);
          setVolumes(volumesData);

          // Generate dynamic opening
          if (chaptersData.length > 0) {
            const pipeline = new PipelineController(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
            const patterns = analyzeEntries(messagesData.map(m => m.content || ""));
            const allEvents = chaptersData.flatMap(c => c.events || []);
            
            const [opening, cover] = await Promise.all([
              pipeline.generateOpening(allEvents, patterns),
              pipeline.generateBookCoverData(chaptersData)
            ]);
            
            setOpeningText(opening);
            setCoverData(cover);
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

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Soul';

  // View: Cover
  if (chapters.length > 0 && viewState === 'cover' && coverData) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="cover"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
          >
            <LifeBookCover 
              data={coverData} 
              userName={userDisplayName} 
              onOpen={() => setViewState('toc')} 
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // View: Table of Contents (Vishay Suchi)
  if (chapters.length > 0 && viewState === 'toc' && coverData) {
    return (
      <TableOfContents 
        chapters={chapters} 
        volumes={volumes}
        title={coverData.title}
        onSelectChapter={(id) => {
          setSelectedChapterId(id);
          setViewState('reader');
        }}
        onBack={() => setViewState('cover')}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center">
        <div className="space-y-6 max-w-sm">
          <p className="text-rose-500 font-serif italic">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:underline"
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-transparent min-h-screen"
    >
      <div className="max-w-[800px] mx-auto pt-16 pb-48 px-10">
        <div className="mb-12">
          <button 
            onClick={() => setViewState('toc')}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-3 h-3" /> Vishay Suchi
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className="space-y-20">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-8 opacity-30"
              >
                <BookOpen className="w-8 h-8 text-gray-300" />
              </motion.div>
              <h2 className="text-4xl font-serif italic text-gray-400 dark:text-gray-600 tracking-tight">
                Your story is waiting to be written...
              </h2>
              <p className="text-gray-300 dark:text-gray-600 max-w-sm mx-auto leading-relaxed font-serif italic">
                जैसे-जैसे आप यादें साझा करेंगे, आपकी कहानी के पन्ने यहाँ खुद-ब-खुद जुड़ते जाएंगे।
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <GhostBook />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Dynamic Opening/Foreword */}
            {openingText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 mb-32"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-px h-16 bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                  <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-bold">The Foreword</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif italic text-slate-900 dark:text-white leading-tight max-w-2xl mx-auto">
                  &ldquo;{openingText}&rdquo;
                </h1>
                <div className="w-16 h-px bg-slate-200 dark:bg-white/10 mx-auto" />
              </motion.div>
            )}
            
            <StoryReader 
              chapters={chapters} 
              volumes={volumes}
              onBack={() => setActiveView('chat')} 
              initialChapterId={selectedChapterId}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
