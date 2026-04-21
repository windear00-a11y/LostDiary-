'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, ScrollText, Heart, List, X, Globe, Check, ShieldCheck, Info } from 'lucide-react';
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
  const [isTOCOpen, setIsTOCOpen] = useState(false);
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
          className="space-y-32"
        >
          {volumes.length > 0 ? (
            volumes.sort((a, b) => a.volume_number - b.volume_number).map((volume, volIdx) => {
              const volumeChapters = chapters.filter(c => c.volume_id === volume.id);
              if (volumeChapters.length === 0 && volume.status !== 'ongoing') return null;

              return (
                <div key={volume.id} className="space-y-24">
                  {/* Volume Heading */}
                  <div className="text-center space-y-8 pt-20 border-t-2 border-slate-100 dark:border-white/5">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-px h-16 bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent" />
                      <span className="text-[10px] uppercase tracking-[0.8em] text-indigo-500 font-bold">Volume {volume.volume_number}</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                      {volume.title}
                    </h2>
                    {volume.prologue && (
                      <p className="text-sm md:text-md italic text-slate-400 dark:text-slate-500 max-w-xl mx-auto font-serif leading-relaxed">
                        &ldquo;{volume.prologue}&rdquo;
                      </p>
                    )}
                    <div className="w-12 h-px bg-slate-200 dark:bg-white/10 mx-auto" />
                  </div>

                  {/* Volume Epigraph */}
                  {volume.epigraph && (
                    <div className="text-center py-12">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6">- Epigraph -</p>
                      <p className="text-lg md:text-xl font-serif italic text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                         {volume.epigraph}
                      </p>
                    </div>
                  )}

                  {/* Chapters in this Volume */}
                  {volumeChapters.map((chapter, index) => (
                    <article 
                      key={chapter.id || index} 
                      id={`chapter-${chapter.id}`}
                      className="space-y-8 scroll-mt-32"
                    >
                      {/* Chapter Title */}
                      <header className="space-y-4 pt-12 border-t border-slate-100 dark:border-white/5 opacity-80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">
                            Chapter {index + 1}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                            {new Date(chapter.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                          {chapter.title}
                        </h3>
                      </header>

                      {/* Chapter Content */}
                      <div className="prose prose-slate dark:prose-invert prose-lg md:prose-xl font-serif leading-[1.8] text-slate-800 dark:text-slate-300 drop-shadow-sm">
                        {chapter.content.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-8 indent-8 first:indent-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Publish Action */}
                      <div className="mt-8 flex justify-center">
                         <button 
                            onClick={() => handlePublish(chapter.id)}
                            disabled={publishingId === chapter.id || sealingId === chapter.id || publishedIds.has(chapter.id)}
                            className="group relative px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl"
                         >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="flex items-center gap-2 font-serif relative z-10 transition-transform">
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
                                   <Globe className="w-4 h-4" />
                                   <span>Publish to Global Library</span>
                                 </>
                               )}
                            </div>
                         </button>
                      </div>
                    </article>
                  ))}

                  {volume.status === 'completed' && volume.epilogue && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="mt-32 p-10 md:p-16 bg-indigo-50/50 dark:bg-indigo-500/[0.03] rounded-[3rem] border border-indigo-100/50 dark:border-indigo-500/10 relative overflow-hidden text-center space-y-8"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-white dark:bg-indigo-500/10 rounded-2xl shadow-sm">
                          <Sparkles className="w-6 h-6 text-indigo-500" />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-indigo-500 font-bold">The Mirror&apos;s Epilogue</span>
                      </div>

                      <p className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed max-w-2xl mx-auto">
                        &ldquo;{volume.epilogue}&rdquo;
                      </p>

                      <div className="pt-8 flex flex-col items-center gap-4">
                        <div className="w-12 h-px bg-indigo-200 dark:bg-indigo-500/20" />
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">A chapter closed. A soul expanded.</span>
                      </div>
                    </motion.div>
                  )}

                  {volume.status === 'ongoing' && (
                    <div className="text-center py-20 space-y-6">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mx-auto animate-pulse" />
                      <p className="text-sm font-serif italic text-gray-400 capitalize tracking-widest">
                        The ink is still wet. Your life is writing the next page...
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            chapters.map((chapter, index) => (
              <article 
                key={chapter.id || index} 
                id={`chapter-${chapter.id}`}
                className="space-y-8 scroll-mt-32"
              >
                <header className="space-y-4 pt-12 border-t border-slate-100 dark:border-white/5 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">
                      Chapter {index + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                      {new Date(chapter.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    {chapter.title}
                  </h3>
                </header>
                <div className="prose prose-slate dark:prose-invert prose-lg md:prose-xl font-serif leading-[1.8] text-slate-800 dark:text-slate-300 drop-shadow-sm">
                  {chapter.content.split('\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="mb-8 indent-8 first:indent-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                   <button 
                      onClick={() => handlePublish(chapter.id)}
                      disabled={publishingId === chapter.id || sealingId === chapter.id || publishedIds.has(chapter.id)}
                      className="group relative px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl"
                   >
                      <div className="flex items-center gap-2 font-serif relative z-10 transition-transform">
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
                             <Globe className="w-4 h-4" />
                             <span>Publish to Global Library</span>
                           </>
                         )}
                      </div>
                   </button>
                </div>
              </article>
            ))
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
