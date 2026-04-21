'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, ScrollText, Heart, List, X, Globe, Check, ShieldCheck, Info, BookOpen, Send, Fingerprint, Anchor, BookMarked, ChevronRight, PenTool } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chapter, Volume } from '@/lib/services/core-service';
import { libraryService, SealingResult } from '@/lib/services/library-service';

interface StoryReaderProps {
  chapters: Chapter[];
  volumes?: Volume[];
  onBack: () => void;
  initialChapterId?: string | null;
}

export const StoryReader = ({ chapters, volumes = [], onBack, initialChapterId }: StoryReaderProps) => {
  const router = useRouter();
  const [readingStage, setReadingStage] = useState<'cover' | 'index' | 'reading'>('cover');
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [lastBookmark, setLastBookmark] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [sealingId, setSealingId] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<{ chapter: Chapter; result: SealingResult } | null>(null);
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

  // Progress tracking
  React.useEffect(() => {
    const savedProgress = localStorage.getItem('manuscript_progress');
    const savedBookmark = localStorage.getItem('manuscript_bookmark');
    if (savedProgress) setReadChapters(new Set(JSON.parse(savedProgress)));
    if (savedBookmark) setLastBookmark(savedBookmark);
  }, []);

  React.useEffect(() => {
    if (readChapters.size > 0) {
      localStorage.setItem('manuscript_progress', JSON.stringify(Array.from(readChapters)));
    }
  }, [readChapters]);

  const handleSetBookmark = (id: string) => {
    setLastBookmark(id);
    localStorage.setItem('manuscript_bookmark', id);
    showToast("⚓ Bookmark dropped at this memory.");
  };

  const handleMarkAsRead = (id: string) => {
    setReadChapters(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const scrollToChapter = (id: string) => {
    setReadingStage('reading');
    handleMarkAsRead(id);
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsTOCOpen(false);
      }, 100);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePublish = async (chapterId: string, sealedData?: { sealedTitle: string; sealedContent: string }) => {
    try {
      if (!sealedData) {
        // Trigger Sealing Preview first
        setSealingId(chapterId);
        const result = await libraryService.getSealedPreview(chapterId);
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
          setSealPreview({ chapter, result });
        }
        setSealingId(null);
        return;
      }

      setPublishingId(chapterId);
      const data = await libraryService.publishStory(chapterId, sealedData);
      
      setPublishedIds(curr => {
        const next = new Set(curr);
        next.add(chapterId);
        return next;
      });
      setSealPreview(null);
      showToast("✨ Beautiful. Your chapter has been anonymously gifted to the Global Library.");

    } catch (error: any) {
      if (error.message?.includes('Pen Name')) {
         showToast("⚠️ Mirror Error: You must set a Pen Name in your Profile before sharing.");
         setTimeout(() => router.push('/profile'), 2000);
      } else {
         showToast(`Error: ${error.message}`);
      }
    } finally {
      setPublishingId(null);
      setSealingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#0A0A0A] relative overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
      <AnimatePresence mode="wait">
        {readingStage === 'cover' ? (
          <motion.div
            key="front-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[120] bg-[#FDFCF8] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Narrative Aura Glows for Cover */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full" />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-2xl space-y-12 relative z-10"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center">
                   <BookOpen className="w-6 h-6 text-indigo-500" />
                </div>
                <span className="text-[10px] uppercase tracking-[1em] text-indigo-500 font-bold ml-[1em]">An Autobiography</span>
              </div>

              <h1 className="text-5xl md:text-8xl font-serif font-medium text-slate-900 dark:text-white leading-tight tracking-tight">
                {volumes?.[0]?.title || "The Unwritten Chronicles"}
              </h1>

              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-px bg-slate-200 dark:bg-white/10" />
                 <p className="font-serif italic text-xl text-slate-400">by a Soul in Transit</p>
              </div>

              <button
                onClick={() => setReadingStage('index')}
                className="mt-12 group relative px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]"
              >
                <span className="relative z-10 font-bold text-xs uppercase tracking-[0.3em] ml-[0.3em]">Begin Reading</span>
              </button>
              
              <div className="pt-20 opacity-20">
                 <ScrollText className="w-8 h-8 mx-auto animate-bounce" />
              </div>
            </motion.div>
          </motion.div>
        ) : readingStage === 'index' ? (
          <motion.div
            key="contents-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[110] bg-[#FDFCF8] dark:bg-[#0A0A0A] overflow-y-auto px-6 py-24 md:py-32"
          >
            <div className="max-w-3xl mx-auto">
              {/* Progress Header */}
              <div className="mb-16 flex flex-col items-center">
                 <div className="w-full max-w-xs h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(readChapters.size / chapters.length) * 100}%` }}
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                 </div>
                 <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                   Sojourner&apos;s Progress: {Math.round((readChapters.size / (chapters.length || 1)) * 100)}%
                 </p>
              </div>

              <div className="text-center mb-20">
                <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold ml-[0.5em] mb-4 block">Index</span>
                <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white">Contents of the Soul</h2>
                <div className="w-16 h-px bg-indigo-500 mx-auto mt-8" />
              </div>

              <div className="space-y-16">
                {(volumes.length > 0 ? volumes : [{ id: 'default', title: 'Life Chapters', description: 'Your journey so far' }]).map((vol, vIdx) => {
                  const volChapters = chapters.filter(c => c.volume_id === vol.id || (!c.volume_id && vol.id === 'default'));
                  return (
                    <div key={vol.id} className="space-y-8">
                       <div className="flex items-center gap-4">
                          <span className="text-2xl font-serif italic text-indigo-500/50">V.{vIdx + 1}</span>
                          <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider">{vol.title}</h3>
                       </div>
                       
                       <div className="grid gap-4 ml-6 pl-6 relative">
                          {/* Visual Thread Line */}
                          <div className="absolute left-0 top-2 bottom-6 w-px bg-slate-100 dark:bg-white/5" />
                          
                          {volChapters.map((chap, cIdx) => {
                            const isRead = readChapters.has(chap.id);
                            const isBookmarked = lastBookmark === chap.id;
                            return (
                              <button
                                key={chap.id}
                                onClick={() => scrollToChapter(chap.id)}
                                className="group flex items-start justify-between text-left py-3 hover:translate-x-2 transition-all relative"
                              >
                                 {/* Progress indicator on the line */}
                                 <div className={`absolute -left-[25px] top-[26px] w-2 h-2 rounded-full border-2 border-[#FDFCF8] dark:border-[#0A0A0A] z-10 transition-colors ${isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-indigo-500'}`} />
                                 
                                 <div className="space-y-1">
                                   <div className="flex items-center gap-3">
                                     <span className={`text-[10px] font-mono tracking-tighter ${isRead ? 'text-slate-300' : 'text-slate-400'}`}>0{cIdx + 1}</span>
                                     <h4 className={`font-serif text-lg transition-colors ${isRead ? 'text-slate-400 dark:text-zinc-500 italic' : 'text-slate-800 dark:text-slate-200'} group-hover:text-indigo-500`}>
                                       {chap.title}
                                     </h4>
                                     {isRead && <Sparkles className="w-3 h-3 text-indigo-400/50" />}
                                     {isBookmarked && (
                                       <motion.div 
                                         animate={{ x: [0, 2, 0] }}
                                         transition={{ repeat: Infinity, duration: 2 }}
                                         className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full text-[8px] font-bold uppercase tracking-wider"
                                       >
                                         <Anchor className="w-2.5 h-2.5" /> Present Reading
                                       </motion.div>
                                     )}
                                   </div>
                                   <p className={`text-[11px] font-serif italic line-clamp-1 max-w-md transition-colors ${isRead ? 'text-slate-300 dark:text-zinc-700' : 'text-slate-400 dark:text-zinc-500'}`}>
                                     {chap.content.substring(0, 100)}...
                                   </p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <ChevronRight className={`w-4 h-4 transition-colors ${isRead ? 'text-slate-200 dark:text-white/5' : 'text-slate-300 group-hover:text-indigo-500'}`} />
                                 </div>
                              </button>
                            );
                          })}
                          {volChapters.length === 0 && (
                            <p className="text-sm font-serif italic text-slate-400">The ink has not reached these pages yet...</p>
                          )}
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-32 flex flex-col items-center gap-6">
                 {lastBookmark && (
                   <button 
                    onClick={() => scrollToChapter(lastBookmark)}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                   >
                     <Anchor className="w-3.5 h-3.5" /> Resume From Bookmark
                   </button>
                 )}
                 <button 
                  onClick={() => setReadingStage('reading')}
                  className="px-8 py-4 border border-slate-200 dark:border-white/10 rounded-full font-serif italic text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                 >
                   Begin from the Start
                 </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Narrative Aura Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-500/5 blur-[100px] rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

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

              <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-whatsapp pr-2">
                {volumes.length > 0 ? (
                  volumes.sort((a, b) => a.volume_number - b.volume_number).map((volume) => {
                    const volChapters = chapters.filter(c => c.volume_id === volume.id);
                    return (
                      <div key={volume.id} className="space-y-4">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-500/60 font-bold border-b border-indigo-500/10 pb-2">
                          Vol. {volume.volume_number} — {volume.title}
                        </div>
                        <div className="space-y-3 pl-2">
                          {volChapters.map((chapter, idx) => (
                            <button
                              key={chapter.id}
                              onClick={() => scrollToChapter(chapter.id)}
                              className="w-full text-left group"
                            >
                              <div className="text-[11px] font-serif text-slate-500 dark:text-zinc-400 group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {idx + 1}. {chapter.title}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  chapters.map((chapter, idx) => (
                    <button
                      key={chapter.id}
                      onClick={() => scrollToChapter(chapter.id)}
                      className="w-full text-left group"
                    >
                      <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Entry {idx + 1}</div>
                      <div className="text-sm font-serif text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2 leading-relaxed">
                        {chapter.title}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Story Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8 md:py-20">
        <div className="mb-16 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-500 transition-all"
          >
            <div className="w-8 h-px bg-slate-200 group-hover:bg-indigo-500 group-hover:w-12 transition-all" />
            Reflection Room
          </button>
          
          <div className="flex items-center gap-2 opacity-30 select-none">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-serif italic tracking-wide">The Book of Your Soul</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="space-y-40"
        >
          {volumes.length > 0 ? (
            volumes.sort((a, b) => a.volume_number - b.volume_number).map((volume, volIdx) => {
              const volumeChapters = chapters.filter(c => c.volume_id === volume.id);
              const isOngoing = volume.status === 'ongoing';

              if (volumeChapters.length === 0 && !isOngoing) return null;

              return (
                <div key={volume.id} className="space-y-32">
                  {/* Volume Heading */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center space-y-10 py-24 relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5">
                       <span className="text-[180px] font-serif font-bold select-none">{volume.volume_number}</span>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <div className="w-px h-20 bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent" />
                      <span className="text-[11px] uppercase tracking-[1em] text-indigo-500 font-bold ml-[1em]">Volume {volume.volume_number}</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-serif font-medium text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                      {volume.title}
                    </h2>

                    {volume.prologue && (
                      <p className="text-lg md:text-xl italic text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-serif leading-relaxed px-4">
                        &ldquo;{volume.prologue}&rdquo;
                      </p>
                    )}
                    
                    <div className="flex items-center justify-center gap-4 text-slate-200 dark:text-white/10">
                      <div className="w-8 h-px bg-current" />
                      <div className="w-1.5 h-1.5 border border-current rounded-full" />
                      <div className="w-8 h-px bg-current" />
                    </div>
                  </motion.div>

                  {/* Chapters in this Volume */}
                  {volumeChapters.map((chapter, index) => (
                    <motion.article 
                      key={chapter.id || index} 
                      id={`chapter-${chapter.id}`}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="space-y-12 scroll-mt-32 relative group/chapter"
                    >
                      {/* Chapter Actions */}
                      <div className="absolute top-0 right-4 flex flex-col gap-2 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                         <button 
                            onClick={() => handleSetBookmark(chapter.id)}
                            className={`p-3 rounded-full transition-all ${lastBookmark === chapter.id ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                            title="Drop Anchor here"
                         >
                            <Anchor className="w-5 h-5" />
                         </button>
                      </div>

                      {/* Chapter Title */}
                      <header className="space-y-6 pt-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold ml-[0.5em]">
                            Chapter {index + 1}
                          </span>
                          <div className="h-px w-6 bg-slate-200 dark:bg-white/10" />
                          <span className="text-[10px] font-serif italic text-slate-400">
                            {new Date(chapter.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-slate-900 dark:text-white leading-[1.2] px-4 max-w-xl mx-auto">
                          {chapter.title}
                        </h3>
                      </header>

                      {/* Chapter Content */}
                      <div className="prose prose-slate dark:prose-invert prose-xl font-serif leading-[2] text-slate-800 dark:text-zinc-300 mx-auto px-4 selection:bg-indigo-500/20 selection:text-indigo-900">
                        {chapter.content.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-10 indent-8 first:indent-0 text-justify tracking-tight">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Publish Action - Integrated more into the flow */}
                      <div className="pt-12 flex justify-center pb-20 border-b border-slate-100 dark:border-white/5 mx-12">
                         <button 
                            onClick={() => handlePublish(chapter.id)}
                            disabled={publishingId === chapter.id || sealingId === chapter.id || publishedIds.has(chapter.id)}
                            className="group relative px-8 py-4 bg-transparent border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl overflow-hidden transition-all hover:border-indigo-500/30 hover:text-indigo-500 disabled:opacity-30"
                         >
                            <div className="flex items-center gap-3 font-serif text-xs font-bold uppercase tracking-widest relative z-10 transition-transform">
                               {publishedIds.has(chapter.id) ? (
                                 <>
                                   <Check className="w-4 h-4 text-emerald-500" />
                                   <span className="italic">Gifted to Library</span>
                                 </>
                               ) : (publishingId === chapter.id || sealingId === chapter.id) ? (
                                 <>
                                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                   <span>{sealingId === chapter.id ? 'Sealing...' : 'Publishing...'}</span>
                                 </>
                               ) : (
                                 <>
                                   <Globe className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                   <span>Publish this Chapter</span>
                                 </>
                               )}
                            </div>
                         </button>
                      </div>
                    </motion.article>
                  ))}

                  {volume.status === 'completed' && volume.epilogue && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="mt-40 p-12 md:p-20 bg-white dark:bg-zinc-900/40 rounded-[3rem] border border-slate-200/60 dark:border-white/5 relative overflow-hidden text-center space-y-10 shadow-2xl shadow-indigo-500/5 mx-4"
                    >
                      {/* Golden Wax Seal */}
                      <div className="absolute top-12 right-12 w-20 h-20 opacity-40 select-none">
                         <div className="w-full h-full bg-amber-600/20 rounded-full flex items-center justify-center border-2 border-amber-600/40 rotate-12">
                            <span className="text-[10px] font-bold text-amber-600/60 uppercase tracking-tighter">Volume {volume.volume_number} Sealed</span>
                         </div>
                      </div>

                      <div className="flex flex-col items-center gap-6">
                        <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl">
                          <Sparkles className="w-8 h-8 text-indigo-500" />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.5em] text-indigo-500 font-bold ml-[0.5em]">The Mirror&apos;s Epilogue</span>
                      </div>

                      <p className="text-2xl md:text-3xl font-serif italic text-slate-800 dark:text-zinc-200 leading-[1.6] max-w-2xl mx-auto tracking-tight">
                        &ldquo;{volume.epilogue}&rdquo;
                      </p>

                      <div className="pt-12 flex flex-col items-center gap-6">
                        <div className="w-20 h-px bg-indigo-200 dark:bg-indigo-500/20" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">This chapter of your existence is complete.</span>
                      </div>
                    </motion.div>
                  )}

                  {volume.status === 'ongoing' && (
                    <div className="text-center py-32 space-y-8">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-3 h-3 bg-indigo-500 rounded-full mx-auto" 
                      />
                      <p className="text-sm font-serif italic text-slate-400 dark:text-zinc-500 tracking-[0.2em] uppercase">
                        Your life is writing the next page...
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="space-y-32">
              <div className="text-center py-20">
                <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold">Unbound Chapters</span>
                <div className="h-px w-12 bg-slate-100 dark:bg-white/5 mx-auto mt-4" />
              </div>
              {chapters.map((chapter, index) => (
                <motion.article 
                  key={chapter.id || index} 
                  id={`chapter-${chapter.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-12 scroll-mt-32"
                >
                  <header className="space-y-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">Entry {index + 1}</span>
                       <div className="h-px w-4 bg-slate-100 dark:bg-white/5" />
                    </div>
                    <h3 className="text-4xl font-serif font-medium tracking-tight text-slate-900 dark:text-white leading-[1.2] max-w-xl mx-auto italic transition-all group-hover:text-indigo-500">
                      {chapter.title}
                    </h3>
                  </header>
                  <div className="prose prose-slate dark:prose-invert prose-xl font-serif leading-[2] text-slate-800 dark:text-zinc-300 mx-auto px-4">
                    {chapter.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-10 indent-8 first:indent-0 text-justify tracking-tight">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Privacy Sealing Modal */}
      <AnimatePresence>
        {sealPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSealPreview(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#111] rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold dark:text-white">Privacy Sealing Complete</h3>
                    <p className="text-xs text-gray-500">I have generalized your real-world details to protect your anonymity.</p>
                  </div>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 scrollbar-whatsapp">
                  <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Original Context</div>
                    <h4 className="font-serif font-bold text-gray-900 dark:text-white mb-2">{sealPreview.chapter.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-3 italic opacity-50">{sealPreview.chapter.content}</p>
                  </div>

                  <div className="p-6 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-2xl border border-indigo-500/20">
                    <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-2">Sealed for the Public</div>
                    <h4 className="font-serif font-bold text-gray-900 dark:text-white mb-2">{sealPreview.result.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
                      {sealPreview.result.content}
                    </p>
                  </div>

                  {sealPreview.result.alterations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                       {sealPreview.result.alterations.map((alt, i) => (
                         <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-md text-[10px] text-gray-500 flex items-center gap-1">
                           <Info className="w-3 h-3" /> {alt}
                         </span>
                       ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setSealPreview(null)}
                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePublish(sealPreview.chapter.id, { 
                      sealedTitle: sealPreview.result.title, 
                      sealedContent: sealPreview.result.content 
                    })}
                    disabled={publishingId === sealPreview.chapter.id}
                    className="py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {publishingId ? 'Publishing...' : 'Confirm & Gift'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
