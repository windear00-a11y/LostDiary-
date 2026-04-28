'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, ScrollText, Heart, List, X, Globe, Check, ShieldCheck, Info, BookOpen, Send, Fingerprint, Anchor, BookMarked, ChevronRight, PenTool, MoreHorizontal, ChevronDown, Headphones, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chapter, Volume } from '@/lib/services/core-service';
import { libraryService, SealingResult } from '@/lib/services/library-service';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithFallback } from '@/lib/genai-utils';
import { NarrativeMap } from '@/components/ui/NarrativeMap';
import { useChapterEngagement } from './hooks/use-chapter-engagement';

const moodBgColors: Record<string, string> = {
  Joyful: '#FFFBEB', 
  Tense: '#FFF1F2',  
  Melancholic: '#EEF2FF', 
  Serene: '#ECFDF5', 
  Default: '#FDFCF8'
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

interface StoryReaderProps {
  chapters: Chapter[];
  volumes?: Volume[];
  onBack: () => void;
  initialChapterId?: string | null;
  coverData?: { title: string; summary: string; aura: string } | null;
  userName?: string;
  isLibraryView?: boolean;
}

export const StoryReader = ({ chapters, volumes = [], onBack, initialChapterId, coverData, userName = 'anonymous', isLibraryView = false }: StoryReaderProps) => {
  const router = useRouter();
  const [readingStage, setReadingStage] = useState<'cover' | 'index' | 'reading' | 'map'>('cover');
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapterId || null);
  const { activeGhosts, lastResonance, sendResonance } = useChapterEngagement(currentChapterId, userName);
  const [mood, setMood] = useState<string>('Default');
  const [moodCache, setMoodCache] = useState<Record<string, string>>({});
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [lastBookmark, setLastBookmark] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [sealingId, setSealingId] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<{ chapter: Chapter; result: SealingResult } | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resonatingParagraphs, setResonatingParagraphs] = useState<Set<number>>(new Set());
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const synthesisRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  const handleToggleAudiobook = () => {
     if (!window.speechSynthesis) {
        showToast("Audiobook playback is not supported on this device.");
        return;
     }

     if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        showToast("Audiobook paused.");
     } else {
        const fullTextContext = chapters.map(c => `${c.name}. ${c.narrative}`).join('. ');
        const utterance = new SpeechSynthesisUtterance(fullTextContext);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        // Find best voice
        const voices = window.speechSynthesis.getVoices();
        const whisperVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha") || v.lang === "en-US") || voices[0];
        if (whisperVoice) utterance.voice = whisperVoice;
        
        utterance.onend = () => setIsPlayingAudio(false);
        
        window.speechSynthesis.cancel(); // kill active
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
        showToast("Whispering the soul of this book...");
     }
  };

  // Load saved cover image if exists
  React.useEffect(() => {
    const saved = localStorage.getItem(`cover_image_${initialChapterId || 'default'}`);
    if (saved) setCoverImageUrl(saved);
  }, [initialChapterId]);

  const generateAuraCover = async () => {
     if (!coverData?.summary) {
        showToast("The manuscript needs more depth before an aura can be revealed.");
        return;
     }

     setIsGeneratingCover(true);
     try {
       // Using gemini text to define prompt, then generating image
       const summaryContext = coverData.summary.substring(0, 500);
       const aura = coverData.aura || "mystical and serene";
       const prompt = `Abstract, ethereal, minimalist book cover art representing: ${summaryContext}. The overall vibe and aura is: ${aura}. Use subtle gradients, sacred geometry, or expressive brush strokes. No text. Highly artistic, muted color palette, masterpiece.`;
       
       const response = await ai.models.generateContent({
         model: 'gemini-3.1-flash-image-preview',
         contents: {
           parts: [
             { text: prompt },
           ],
         },
         config: {
           imageConfig: {
                 aspectRatio: "3:4",
                 imageSize: "1K"
             }
         },
       });

       let newImageUrl = null;
       for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
           newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
           break;
         }
       }

       if (newImageUrl) {
          setCoverImageUrl(newImageUrl);
          localStorage.setItem(`cover_image_${initialChapterId || 'default'}`, newImageUrl);
          showToast("✨ The Soul of the Book has revealed itself.");
       } else {
          showToast("Failed to manifest the Aura.");
       }

     } catch (e: any) {
       console.error(e);
       showToast(`Manifestation Error: ${e.message}`);
     } finally {
       setIsGeneratingCover(false);
     }
  };

  // Listen to remote resonance events and animate them
  React.useEffect(() => {
     if (lastResonance?.type === 'sparkle' && currentChapterId) {
        setResonatingParagraphs(prev => {
           const next = new Set(prev);
           next.add(lastResonance.data.paraIndex);
           
           // Clear it after a few seconds
           setTimeout(() => {
              setResonatingParagraphs(cur => {
                 const c = new Set(cur);
                 c.delete(lastResonance.data.paraIndex);
                 return c;
              });
           }, 3000);
           
           return next;
        });
     }
  }, [lastResonance, currentChapterId]);

  const handleMarkAsRead = React.useCallback((id: string) => {
    setReadChapters(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const scrollToChapter = React.useCallback((id: string) => {
    setReadingStage('reading');
    handleMarkAsRead(id);
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsTOCOpen(false);
      }, 100);
    }
  }, [handleMarkAsRead]);

  // Scroll to initial chapter if provided
  React.useEffect(() => {
    if (initialChapterId) {
      const timer = setTimeout(() => {
        scrollToChapter(initialChapterId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialChapterId, scrollToChapter]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const analyzeMood = useCallback(async (content: string) => {
    if (moodCache[content.substring(0, 50)]) {
      setMood(moodCache[content.substring(0, 50)]);
      return;
    }
    
    try {
      const response = await generateContentWithFallback({
        model: "gemini-1.5-pro",
        contents: `Analyze the mood of this story paragraph: "${content.substring(0, 200)}..." Return only one word: Joyful, Tense, Melancholic, or Serene.`,
      });
      const detectedMood = response.text?.trim() as string;
      if (moodBgColors[detectedMood]) {
        setMood(detectedMood);
        setMoodCache(prev => ({ ...prev, [content.substring(0, 50)]: detectedMood }));
      }
    } catch (error) {
      console.error("Mood analysis error", error);
    }
  }, [moodCache]);

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

  // Track reading intersection to record what they read to activate Ghosts/Resonance context
  React.useEffect(() => {
    if (readingStage !== 'reading') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            const chapId = entry.target.id.replace('chapter-', '');
            setCurrentChapterId(chapId);
            handleMarkAsRead(chapId);
            
            // Mood Analysis Trigger
            const chapterContent = chapters.find(c => c.id === chapId)?.narrative;
            if (chapterContent) {
               analyzeMood(chapterContent);
            }
        }
      });
    }, { threshold: 0.2 });

    chapters.forEach(chap => {
      const el = document.getElementById(`chapter-${chap.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [readingStage, chapters, handleMarkAsRead, analyzeMood]);

  return (
    <div 
     className="min-h-screen relative overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900 transition-colors duration-1000"
     style={{ backgroundColor: moodBgColors[mood] || moodBgColors.Default }}
    >
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
              {/* Back Button for Cover Stage */}
              <button 
                onClick={onBack}
                className="absolute -top-32 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-500 transition-all opacity-60 hover:opacity-100"
              >
                <ArrowLeft className="w-3 h-3" />
                Exit Sanctuary
              </button>

              <div className="flex flex-col items-center gap-6">
                {coverImageUrl ? (
                   <div className="w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl relative mb-4 ring-1 ring-white/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="Story Aura Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                   </div>
                ) : (
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center relative group">
                     {isGeneratingCover ? (
                         <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                     ) : (
                         <>
                           <BookOpen className="w-6 h-6 text-indigo-500 transition-transform group-hover:scale-110" />
                           <button 
                             onClick={generateAuraCover}
                             className="absolute -right-32 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap shadow-xl"
                             title="Generate Aura Art via Gemini"
                           >
                              Reveal Aura
                           </button>
                         </>
                     )}
                  </div>
                )}
                <span className="text-[10px] uppercase tracking-[1em] text-indigo-500 font-bold ml-[1em]">An Autobiography</span>
              </div>

              <h1 className="text-5xl md:text-8xl font-serif font-medium text-slate-900 dark:text-white leading-tight tracking-tight px-4">
                {coverData?.title || volumes?.[0]?.title || "The Unwritten Chronicles"}
              </h1>

              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-px bg-slate-200 dark:bg-white/10" />
                 <p className="font-serif italic text-xl text-slate-400">by {userName || "a Soul in Transit"}</p>
              </div>

              {coverData?.summary && (
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-serif italic leading-relaxed max-w-xl mx-auto px-6">
                  &ldquo;{coverData.summary}&rdquo;
                </p>
              )}

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
              {/* Back Button for Index Stage */}
              <button 
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-500 transition-all group"
              >
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Return to Library
              </button>

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
                {volumes.length > 0 ? (
                  volumes.sort((a, b) => a.volume_number - b.volume_number).map((vol, vIdx) => (
                    <div key={vol.id} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-serif italic text-indigo-500/50">V.{vIdx + 1}</span>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider">{vol.title}</h3>
                      </div>
                      
                      <div className="grid gap-4 ml-6 pl-6 relative">
                        <div className="absolute left-0 top-2 bottom-6 w-px bg-slate-100 dark:bg-white/5" />
                        
                        {chapters.filter(c => c.volume_id === vol.id || (!c.volume_id && vol.id === 'default')).map((chap, cIdx) => (
                          <button
                            key={chap.id}
                            onClick={() => scrollToChapter(chap.id)}
                            className="group flex items-start justify-between text-left py-3 hover:translate-x-2 transition-all relative"
                          >
                             <div className={`absolute -left-[25px] top-[26px] w-2 h-2 rounded-full border-2 border-[#FDFCF8] dark:border-[#0A0A0A] z-10 transition-colors ${readChapters.has(chap.id) ? 'bg-slate-300 dark:bg-slate-600' : 'bg-indigo-500'}`} />
                             <div className="space-y-1">
                               <div className="flex items-center gap-3">
                                 <span className={`text-[10px] font-mono tracking-tighter ${readChapters.has(chap.id) ? 'text-slate-300' : 'text-slate-400'}`}>0{cIdx + 1}</span>
                                 <h4 className={`font-serif text-lg transition-colors ${readChapters.has(chap.id) ? 'text-slate-400 dark:text-zinc-500 italic' : 'text-slate-800 dark:text-slate-200'} group-hover:text-indigo-500`}>
                                   {chap.name}
                                 </h4>
                                 {readChapters.has(chap.id) && <Sparkles className="w-3 h-3 text-indigo-400/50" />}
                               </div>
                             </div>
                             <ChevronRight className={`w-4 h-4 transition-colors ${readChapters.has(chap.id) ? 'text-slate-200 dark:text-white/5' : 'text-slate-300 group-hover:text-indigo-500'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-64">
                     <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-dashed border-slate-200 dark:border-white/10">
                        <BookMarked className="w-10 h-10 text-slate-300" />
                     </div>
                     <h3 className="text-2xl font-serif text-slate-400 italic">This manuscript is still awaiting its first breath...</h3>
                     <button onClick={onBack} className="mt-12 text-[10px] uppercase tracking-[0.4em] text-indigo-500 font-bold hover:underline">Return to Sanctuary</button>
                  </div>
                )}
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
                                {idx + 1}. {chapter.name}
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
                        {chapter.name}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Interactive Story Content - The "Full Film" Experience */}
      <motion.main 
        initial={false}
        animate={{ 
          opacity: readingStage === 'reading' ? 1 : 0,
          pointerEvents: readingStage === 'reading' ? 'auto' : 'none',
          y: readingStage === 'reading' ? 0 : 40
        }}
        className="fixed inset-0 z-[80] overflow-y-auto scrollbar-hide selection:bg-indigo-500/30 font-serif"
      >
        {readingStage === 'map' && (
          <NarrativeMap chapters={chapters} onChapterSelect={(id) => scrollToChapter(id)} />
        )}
        
        {/* The Concrete Foundation for the Book */}
        <div className="min-h-full w-full book-page-container relative">
          
          {/* Paper Texture Overlay */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

          {/* The Spine Shadow (Centerfold effect) */}
          <div className="fixed left-1/2 top-0 bottom-0 w-24 -translate-x-1/2 pointer-events-none spine-shadow z-[90] hidden md:block" />

          <div className="max-w-3xl mx-auto relative px-6 py-8 md:py-20">
            {/* Top Navigation Bar */}
            <div className="mb-20 flex items-center justify-between sticky top-0 z-[100] py-4 px-2">
              <button 
                onClick={() => setReadingStage('index')}
                className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-500 transition-all font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                The Book Index
              </button>
              
              <button
                onClick={() => setReadingStage(readingStage === 'map' ? 'reading' : 'map')}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 hover:text-indigo-600 transition-all font-sans"
              >
                <Globe className="w-3.5 h-3.5" />
                {readingStage === 'map' ? 'Read' : 'Explore'}
              </button>
              
              <div className="flex items-center gap-4 font-sans">
                {/* Audiobook Feature */}
                <button
                   onClick={handleToggleAudiobook}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                       isPlayingAudio 
                       ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                       : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-500 hover:border-indigo-500/50'
                   }`}
                   title="Whispering Audiobook"
                >
                   {isPlayingAudio ? (
                       <Square className="w-3.5 h-3.5" />
                   ) : (
                       <Headphones className="w-3.5 h-3.5" />
                   )}
                   <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline-block">Listen</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/5 rounded-full border border-indigo-500/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest">Atmosphere: {coverData?.aura || "Resonance"}</span>
                </div>
                <button 
                  onClick={onBack}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Close Tome
                </button>
              </div>
            </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="space-y-64 pb-64"
          >
            {volumes.length > 0 ? (
              volumes.sort((a,b) => a.volume_number - b.volume_number).map((volume) => (
                <div key={volume.id} className="space-y-48">
                  <h2 className="text-4xl text-center font-serif">{volume.title}</h2>
                  {chapters.filter(c => c.volume_id === volume.id).map((chapter, index) => (
                    <article id={`chapter-${chapter.id}`} key={chapter.id} className="space-y-12 relative group/chapter border-b border-indigo-500/5 pb-32">
                      <h3 className="text-3xl font-serif text-center">{chapter.name}</h3>
                      <div className="space-y-8 relative">
                        
                        {/* Ghost Layer Sidebar */}
                        <div className="absolute -left-12 top-0 bottom-0 w-8 pointer-events-none hidden md:flex flex-col items-center gap-4 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                          {activeGhosts > 0 && currentChapterId === chapter.id && (
                             <div className="p-2 bg-indigo-50/50 rounded-full border border-indigo-100/50 flex flex-col items-center gap-1 shadow-sm backdrop-blur-sm" title={`${activeGhosts} souls resonance in this chapter`}>
                                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                                <span className="text-[9px] font-bold text-indigo-500">{activeGhosts}</span>
                             </div>
                          )}
                        </div>

                        {chapter.narrative.split('\n').filter((p: string)=>p.trim()).map((para: string, pIdx: number) => (
                          <p 
                            key={pIdx} 
                            className={`text-xl font-serif leading-relaxed cursor-pointer transition-colors duration-500 ${resonatingParagraphs.has(pIdx) ? 'bg-indigo-500/20 rounded-md ring-4 ring-indigo-500/10' : 'hover:text-indigo-600'}`}
                            onClick={() => {
                              sendResonance('sparkle', { paraIndex: pIdx });
                              // Optimistically add to resonance set locally
                              setResonatingParagraphs(prev => {
                                const next = new Set(prev);
                                next.add(pIdx);
                                setTimeout(() => {
                                  setResonatingParagraphs(cur => {
                                     const c = new Set(cur);
                                     c.delete(pIdx);
                                     return c;
                                  });
                                }, 3000);
                                return next;
                              })
                            }}
                          >
                            {para}
                          </p>
                        ))}
                      </div>

                      {/* Chapter End Actions */}
                      <div className="pt-24 pb-12 flex flex-col items-center gap-8 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                         <div className="w-8 h-px bg-slate-200" />
                         <div className="flex gap-4">
                           <button 
                            onClick={() => handleSetBookmark(chapter.id)}
                            className="px-6 py-2 rounded-full border border-slate-200 text-xs font-sans uppercase tracking-widest text-slate-500 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
                           >
                              Bookmark Memory
                           </button>
                           
                           {/* Only show publish option if viewing own private library */}
                           {!isLibraryView && !publishedIds.has(chapter.id) && (
                             <button 
                              onClick={() => handlePublish(chapter.id)}
                              disabled={sealingId === chapter.id}
                              className="px-6 py-2 rounded-full bg-slate-900 text-white text-xs font-sans uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
                             >
                                {sealingId === chapter.id ? (
                                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                   <ShieldCheck className="w-3.5 h-3.5" />
                                )}
                                Share to Real World
                             </button>
                           )}
                           
                           {publishedIds.has(chapter.id) && (
                             <div className="px-6 py-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-sans uppercase tracking-widest border border-emerald-100 flex items-center gap-2 cursor-default">
                               <Check className="w-3.5 h-3.5" />
                               Gifted to Library
                             </div>
                           )}
                         </div>
                      </div>

                    </article>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-64">
                 <h3 className="text-2xl font-serif text-slate-400 italic">This manuscript is still awaiting its first breath...</h3>
              </div>
            )}
          </motion.div>
        </div>
        </div>
      </motion.main>
      <AnimatePresence>
        {sealPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-slate-900 dark:text-white">Privacy Seal Protocol</h3>
                    <p className="text-xs font-sans text-slate-500 dark:text-zinc-400">Review the AI&apos;s redactions to protect your identity.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSealPreview(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 font-serif">
                {/* Alterations Report */}
                {sealPreview.result.alterations.length > 0 ? (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-500/10">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Alterations Made
                    </h4>
                    <ul className="space-y-2">
                      {sealPreview.result.alterations.map((alt, idx) => (
                        <li key={idx} className="text-sm font-sans flex items-start gap-2 text-slate-700 dark:text-zinc-300">
                          <span className="text-indigo-500 mt-0.5">•</span>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                     <p className="text-sm font-sans text-emerald-700 dark:text-emerald-400">No sensitive information detected. The raw memory is safe.</p>
                  </div>
                )}

                {/* Sealed Manuscript Preview */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-zinc-800 pb-2">
                    Sealed Output Preview
                  </h4>
                  <h2 className="text-2xl text-slate-900 dark:text-white">{sealPreview.result.title}</h2>
                  <div className="space-y-4 text-slate-700 dark:text-zinc-300 leading-relaxed text-sm">
                    {sealPreview.result.content.split('\n').filter(p=>p.trim()).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-indigo-500/10 bg-slate-50 dark:bg-zinc-900 flex justify-end gap-3 font-sans">
                <button 
                  onClick={() => setSealPreview(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  disabled={publishingId === sealPreview.chapter.id}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handlePublish(sealPreview.chapter.id, {
                     sealedTitle: sealPreview.result.title,
                     sealedContent: sealPreview.result.content
                  })}
                  disabled={publishingId === sealPreview.chapter.id}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishingId === sealPreview.chapter.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                       <Send className="w-4 h-4" />
                       Confirm & Publish
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
