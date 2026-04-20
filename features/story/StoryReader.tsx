'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, ScrollText, Heart, List, X, Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chapter } from '@/lib/services/core-service';

interface StoryReaderProps {
  chapters: Chapter[];
  onBack: () => void;
  initialChapterId?: string | null;
}

export const StoryReader = ({ chapters, onBack, initialChapterId }: StoryReaderProps) => {
  const router = useRouter();
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll to initial chapter if provided
  React.useEffect(() => {
    if (initialChapterId) {
      const timer = setTimeout(() => {
        scrollToChapter(initialChapterId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialChapterId]);

  const scrollToChapter = (id: string) => {
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsTOCOpen(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePublish = async (chapterId: string) => {
    try {
      setPublishingId(chapterId);
      const res = await fetch('/api/library/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error?.includes('Pen Name')) {
           showToast("⚠️ Mirror Error: You must set a Pen Name in your Profile before sharing.");
           // Optional: redirect to profile after 2 secs
           setTimeout(() => router.push('/profile'), 2000);
        } else {
           showToast(`Error: ${data.error}`);
        }
        return;
      }

      setPublishedIds(curr => {
        const next = new Set(curr);
        next.add(chapterId);
        return next;
      });
      showToast("✨ Beautiful. Your chapter has been anonymously gifted to the Global Library.");

    } catch (error) {
      showToast("An unexpected error occurred. Could not publish.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-serif backdrop-blur-xl"
          >
             {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOC Toggle Button */}
      <div className="fixed top-20 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsTOCOpen(true)}
          className="p-3 bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white rounded-full shadow-lg border border-slate-100 dark:border-white/5"
        >
          <List className="w-5 h-5" />
        </motion.button>
      </div>

      {/* TOC Drawer */}
      <AnimatePresence>
        {isTOCOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTOCOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[300px] bg-white dark:bg-[#0D0D0D] z-[70] shadow-2xl border-l border-slate-100 dark:border-white/5 p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold">Contents</h3>
                <button onClick={() => setIsTOCOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-whatsapp pr-2">
                {chapters.map((chapter, idx) => (
                  <button
                    key={chapter.id}
                    onClick={() => scrollToChapter(chapter.id)}
                    className="w-full text-left group"
                  >
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Chapter {idx + 1}</div>
                    <div className="text-sm font-serif text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2 leading-relaxed">
                      {chapter.title}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            <article 
              key={chapter.id || index} 
              id={`chapter-${chapter.id}`}
              className="space-y-8 scroll-mt-32"
            >
          {/* Chapter Title */}
          <header className="space-y-4 pt-12 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">
                Volume {index + 1}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                {new Date(chapter.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {chapter.title || `Chapter ${index + 1}`}
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
              <span className="text-[10px] italic font-serif text-slate-400">Recorded for Eternity</span>
            </div>
          </header>

          {/* Chapter Content */}
          <div className="prose prose-slate dark:prose-invert prose-lg md:prose-xl font-serif leading-[1.8] text-slate-800 dark:text-slate-300 drop-shadow-sm">
            {chapter.content.split('\n').map((paragraph, pIndex) => (
              <p key={pIndex} className="mb-8 indent-8 first:indent-0 first:text-slate-900 first:dark:text-white first:font-medium">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Narrator's Reflection */}
          <div className="mt-12 p-6 md:p-8 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-12 h-12" />
            </div>
            <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> WinDear&apos;s Observation
            </h4>
            <p className="text-sm md:text-md italic text-slate-600 dark:text-slate-400 leading-relaxed font-serif">
               &ldquo;{chapter.title?.includes('Conflict') ? "Even in the darkest moments, your resilience is the ink that writes your survival." : "This chapter of your life radiates a unique kind of growth—one that is felt more than it is seen."}&rdquo;
            </p>
          </div>

          {/* Publish Action */}
          <div className="mt-8 flex justify-center">
             <button 
                onClick={() => handlePublish(chapter.id)}
                disabled={publishingId === chapter.id || publishedIds.has(chapter.id)}
                className="group relative px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="flex items-center gap-2 font-serif relative z-10 transition-transform">
                   {publishedIds.has(chapter.id) ? (
                     <>
                       <Check className="w-4 h-4 text-emerald-500" />
                       <span className="italic">Gifted to Library</span>
                     </>
                   ) : publishingId === chapter.id ? (
                     <>
                       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                       <span>Publishing...</span>
                     </>
                   ) : (
                     <>
                       <Globe className="w-4 h-4" />
                       <span>Publish to Global Library</span>
                     </>
                   )}
                </div>
             </button>
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
