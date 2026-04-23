'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Heart, BookOpen, User, Droplets, Leaf, Send, Sparkles, Handshake, Anchor, BookMarked, ChevronDown, ChevronUp, MoreHorizontal, Bookmark } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LibraryStory {
  id: string;
  title: string;
  story_content: string;
  pen_name: string;
  pen_name_tag: string;
  dominant_emotion: string;
  likes_count: number;
  created_at: string;
  inspired_by_story_id?: string | null;
  inspiration_author?: string;
  echoes?: { paragraph_index: number, count: number }[];
}

export default function GlobalLibraryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMood, setActiveMood] = useState<string>('all');
  const [planeSheetOpen, setPlaneSheetOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<LibraryStory | null>(null);
  const [planeMessage, setPlaneMessage] = useState('');
  const [sendingPlane, setSendingPlane] = useState(false);
  const [showSuccessMoment, setShowSuccessMoment] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', subtitle: '', type: 'save' as 'save' | 'publish' | 'connect' });
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [activeParaMenu, setActiveParaMenu] = useState<{ storyId: string, pIdx: number } | null>(null);

  // Track optimistically ahsas paragraphs: { [storyId]: Set<number> }
  const [localAhsas, setLocalAhsas] = useState<Record<string, Set<number>>>({});

  const moods = ['all', 'hope', 'tear', 'resonance', 'reflective', 'courage', 'calm'];

  const filteredStories = activeMood === 'all' 
    ? stories 
    : stories.filter(s => s.dominant_emotion === activeMood);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/library/feed');
        const data = await res.json();
        if (data.stories) {
          setStories(data.stories);
        }
      } catch (error) {
        console.error("Failed to fetch library feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const handleSendPlane = async () => {
    if (!selectedStory || !planeMessage.trim() || sendingPlane) return;
    setSendingPlane(true);
    try {
      const res = await fetch('/api/library/plane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: selectedStory.id, message: planeMessage })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.status === 'burned') {
          toast.error("Hand-woven paper plane ignited.", { description: data.message });
        } else {
          toast.error("Warning", { description: data.error || 'Failed to send plane' });
        }
      } else {
        setSuccessData({
          title: "Paper Plane Delivered",
          subtitle: "Your soul-signal has crossed the midnight bridge.",
          type: "connect"
        });
        setShowSuccessMoment(true);
        setPlaneSheetOpen(false);
        setPlaneMessage('');
      }
    } catch (e) {
      toast.error("Warning", { description: 'A storm destroyed your plane before it reached them.' });
    } finally {
      setSendingPlane(false);
    }
  };

  const handleReaction = async (storyId: string, reactionType: string) => {
    try {
      const res = await fetch('/api/library/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, reactionType })
      });
      
      if (res.ok) {
         setSuccessData({
           title: "Luminous Line Cast",
           subtitle: "Your resonance has created a bridge of light.",
           type: "save"
         });
         setShowSuccessMoment(true);
         // Optimistically update
         setStories(prev => prev.map(s => {
            if (s.id === storyId) return { ...s, likes_count: (s.likes_count || 0) + 1 };
            return s;
         }));
      }
    } catch (e) {
      // silent fail
    }
  };

  const handleAhsas = async (storyId: string, paragraphIndex: number) => {
    // Show contextual menu first (Pattern 4)
    setActiveParaMenu({ storyId, pIdx: paragraphIndex });
  };

  const confirmAhsas = async (storyId: string, paragraphIndex: number) => {
    setActiveParaMenu(null);
    try {
      const res = await fetch('/api/library/ahsas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, paragraphIndex })
      });
      
      if (res.ok) {
         setSuccessData({
           title: "Luminous Line Cast",
           subtitle: "This resonance is now a light in the archive.",
           type: "save"
         });
         setShowSuccessMoment(true);
         
         setLocalAhsas(prev => {
            const current = prev[storyId] || new Set();
            return {
               ...prev,
               [storyId]: new Set([...current, paragraphIndex])
            };
         });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropAnchor = async (storyId: string, paragraphIndex: number) => {
    setActiveParaMenu(null);
    try {
        await fetch('/api/library/anchor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId, paragraphIndex })
        });
        toast.success("Anchor Dropped", { description: "Your rest point is saved." });
    } catch (e) {
        toast.error("Warning", { description: "Failed to drop anchor." });
    }
  };

  const handleHoldTreasury = async (storyId: string) => {
    try {
        const res = await fetch('/api/library/treasury', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId })
        });
        const data = await res.json();
        if (data.action === 'added') {
          toast.success("Held Close", { description: "Story added to your Treasury." });
        } else {
          toast.info("Released", { description: "Story removed from your Treasury." });
        }
    } catch (e) {
        toast.error("Warning", { description: "Failed to update treasury." });
    }
  };

  const toggleExpand = (storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const handleThreadReflection = (story: LibraryStory) => {
     router.push(`/home?inspire=${story.id}&author=${encodeURIComponent(story.pen_name)}`);
  };

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <Header />
      
      <SuccessMoment 
        isOpen={showSuccessMoment}
        onClose={() => setShowSuccessMoment(false)}
        title={successData.title}
        subtitle={successData.subtitle}
        type={successData.type}
      />

      {/* Pattern 2 & 5: Bottom Sheet for Paper Planes */}
      <BottomSheet 
        isOpen={planeSheetOpen && !!selectedStory}
        onClose={() => setPlaneSheetOpen(false)}
        title="Cast a Paper Plane"
        subtitle={`To ${selectedStory?.pen_name}: Messages meant to heal, support, or resonate will survive the journey.`}
      >
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 font-serif text-amber-800 dark:text-amber-200/80 text-xs leading-relaxed text-center italic">
            &quot;Your signal crosses the midnight bridge as a wisp of hope.&quot;
          </div>
          
          <textarea 
            value={planeMessage}
            onChange={(e) => setPlaneMessage(e.target.value)}
            placeholder="I read your story and I wanted you to know..."
            className="w-full h-40 p-4 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-indigo-500/30 transition-all resize-none font-serif text-sm"
          />

          <button 
             disabled={sendingPlane || !planeMessage.trim()}
             onClick={handleSendPlane}
             className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
             {sendingPlane ? "Crossing Bridge..." : "Throw Plane"} <Send className="w-4 h-4" />
          </button>
        </div>
      </BottomSheet>
      
      {/* Mood Navigator */}
      <div className="sticky top-20 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md pt-10 pb-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 justify-center">
            {moods.map((mood) => (
                <button
                    key={mood}
                    onClick={() => setActiveMood(mood)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                        activeMood === mood 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                >
                    {mood}
                </button>
            ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-32">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif italic text-slate-900 dark:text-white">The Global Library</h1>
          <p className="text-slate-500 dark:text-slate-400 font-serif italic max-w-lg mx-auto">
            A living archive of souls. Click a story to expand its world.
          </p>
        </header>

        {loading ? (
           <div className="flex justify-center mt-20">
              <LoadingSpace message="Consulting the ancient scrolls..." />
           </div>
        ) : filteredStories.length === 0 ? (
           <div className="text-center mt-20">
             <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
             <p className="font-serif italic text-slate-500">The whispers are silent in this mood. Try another?</p>
           </div>
        ) : (
          <div className="space-y-8">
            {filteredStories.map((story, i) => {
              const isExpanded = expandedStories.has(story.id);
              return (
                <motion.article
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  // Pattern 3: Expandable Card
                  className={`bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-indigo-500/20 shadow-2xl' : 'hover:shadow-xl'}`}
                >
                  <div className="md:grid md:grid-cols-[160px_1fr] flex flex-col min-h-[160px]">
                    {/* Spine / Book Visual */}
                    <div className={`relative flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
                      story.dominant_emotion === 'hope' ? 'bg-emerald-500' :
                      story.dominant_emotion === 'tear' ? 'bg-blue-500' :
                      story.dominant_emotion === 'resonance' ? 'bg-indigo-500' :
                      story.dominant_emotion === 'reflective' ? 'bg-slate-500' :
                      story.dominant_emotion === 'courage' ? 'bg-rose-500' :
                      'bg-indigo-600'
                    }`} onClick={() => toggleExpand(story.id)}>
                       <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                       <BookMarked className="w-6 h-6 text-white/40 mb-3" />
                       <h3 className="font-serif font-bold text-white text-sm drop-shadow-md leading-tight">{story.pen_name}</h3>
                       <div className="text-[8px] font-mono text-white/50 bg-black/20 px-1.5 py-0.5 rounded mt-2 uppercase tracking-widest">#{story.pen_name_tag}</div>
                    </div>

                    {/* Quick Preview Content */}
                    <div className="p-6 flex flex-col">
                       <header className="flex items-start justify-between mb-4">
                          <div className="cursor-pointer flex-1" onClick={() => toggleExpand(story.id)}>
                            <h4 className="text-xl font-serif font-bold text-slate-900 dark:text-white leading-tight">{story.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                               <span className="text-[9px] uppercase tracking-widest text-slate-400">Gifted on {new Date(story.created_at).toLocaleDateString()}</span>
                               {story.inspiration_author && <span className="flex items-center gap-1 text-[9px] font-serif italic text-amber-500"><Sparkles className="w-2 h-2" /> Inspired</span>}
                            </div>
                          </div>
                          <button onClick={() => handleHoldTreasury(story.id)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                            <Anchor className="w-4 h-4" />
                          </button>
                       </header>

                       <AnimatePresence>
                         {isExpanded ? (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="overflow-hidden"
                           >
                             <div className="prose prose-slate dark:prose-invert font-serif text-sm leading-relaxed text-slate-600 dark:text-slate-300 py-4 border-t border-slate-50 dark:border-white/5 relative">
                                {story.story_content.split('\n').filter(p => p.trim()).map((p, pIdx) => {
                                   const isAhsasLocally = localAhsas[story.id]?.has(pIdx);
                                   const backendAhsasCount = story.echoes?.find(e => e.paragraph_index === pIdx)?.count || 0;
                                   const totalAhsas = isAhsasLocally ? backendAhsasCount + 1 : backendAhsasCount;
                                   const isAhsas = totalAhsas > 0;
                                   const isMenuOpen = activeParaMenu?.storyId === story.id && activeParaMenu?.pIdx === pIdx;
                                   
                                   return (
                                      <div key={pIdx} className="mb-4 relative group/para">
                                         <p 
                                           onClick={() => handleAhsas(story.id, pIdx)}
                                           className={`relative -mx-2 px-2 py-1 rounded-xl transition-all cursor-pointer ${isAhsas ? 'text-indigo-900 dark:text-indigo-200 font-medium' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
                                         >
                                            {isAhsas && <div className="absolute -left-1 top-1 bottom-1 w-0.5 bg-indigo-500/40 blur-[1px]" />}
                                            {p}
                                            {totalAhsas > 0 && <span className="inline-flex items-center gap-1 ml-2 text-[8px] text-indigo-400 font-mono opacity-60"><div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" /> {totalAhsas}</span>}
                                         </p>

                                         {/* Pattern 4: Contextual Menu for Paragraphs */}
                                         <AnimatePresence>
                                            {isMenuOpen && (
                                              <motion.div 
                                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                                                className="absolute bottom-full mb-2 left-0 z-10 flex gap-1 p-1 bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-xl shadow-2xl"
                                              >
                                                <button onClick={() => confirmAhsas(story.id, pIdx)} className="px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                                   <Sparkles className="w-3 h-3" /> Resonate
                                                </button>
                                                <button onClick={() => handleDropAnchor(story.id, pIdx)} className="px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase text-amber-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                                   <Anchor className="w-3 h-3" /> Anchor
                                                </button>
                                                <button onClick={() => setActiveParaMenu(null)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">
                                                   <X className="w-3 h-3" />
                                                </button>
                                              </motion.div>
                                            )}
                                         </AnimatePresence>
                                      </div>
                                   );
                                })}
                             </div>

                             {/* Expanded Interaction Bar */}
                             <div className="pt-4 mt-2 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                <div className="flex gap-2">
                                  <button onClick={() => handleReaction(story.id, 'hope')} className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg hover:scale-110 transition-transform"><Leaf className="w-4 h-4" /></button>
                                  <button onClick={() => handleReaction(story.id, 'tear')} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform"><Droplets className="w-4 h-4" /></button>
                                  <button onClick={() => handleReaction(story.id, 'resonance')} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:scale-110 transition-transform"><Handshake className="w-4 h-4" /></button>
                                </div>
                                <div className="flex gap-2">
                                   <button onClick={() => handleThreadReflection(story)} className="px-3 py-2 bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 rounded-xl text-[9px] font-bold uppercase flex items-center gap-2 hover:bg-amber-500/10 transition-all"><BookOpen className="w-3 h-3" /> Spin Thread</button>
                                   <button onClick={() => { setSelectedStory(story); setPlaneSheetOpen(true); }} className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[9px] font-bold uppercase flex items-center gap-2 shadow-lg"><Send className="w-3 h-3" /> Send Plane</button>
                                </div>
                             </div>
                           </motion.div>
                         ) : (
                           <div className="mt-2 group/card cursor-pointer" onClick={() => toggleExpand(story.id)}>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-serif italic">
                                &quot;{story.story_content.substring(0, 140)}...&quot;
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-indigo-500 group-hover:gap-3 transition-all">
                                Peek into this soul <ChevronDown className="w-3 h-3" />
                              </div>
                           </div>
                         )}
                       </AnimatePresence>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
