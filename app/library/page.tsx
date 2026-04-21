'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Heart, BookOpen, User, Droplets, Leaf, Send, Sparkles, Handshake, Anchor, BookMarked } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useRouter } from 'next/navigation';

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
  const [planeModalOpen, setPlaneModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<LibraryStory | null>(null);
  const [planeMessage, setPlaneMessage] = useState('');
  const [sendingPlane, setSendingPlane] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: 'success'|'error'} | null>(null);
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

  const showToast = (title: string, desc: string, type: 'success' | 'error') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

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
          showToast('Plane Destroyed 🔥', data.message, 'error');
        } else {
          showToast('Warning', data.error || 'Failed to send plane', 'error');
        }
      } else {
        showToast('Plane Delivered ✈️', 'Your invisible thread has been cast to the author.', 'success');
        setPlaneModalOpen(false);
        setPlaneMessage('');
      }
    } catch (e) {
      showToast('Warning', 'A storm destroyed your plane before it reached them.', 'error');
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
         showToast('Energy Sent 🌿', `The author will feel your resonance.`, 'success');
         // Optimistically update
         setStories(prev => prev.map(s => {
            if (s.id === storyId) return { ...s, likes_count: (s.likes_count || 0) + 1 };
            return s;
         }));
      }
    } catch (e) {
      // silent fail or toast
    }
  };

  const handleAhsas = async (storyId: string, paragraphIndex: number) => {
     // ... (ahsas logic)
  };

  const handleDropAnchor = async (storyId: string, paragraphIndex: number) => {
    try {
        await fetch('/api/library/anchor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId, paragraphIndex })
        });
        showToast('Anchor Dropped ⚓', 'Your rest point is saved.', 'success');
    } catch (e) {
        showToast('Warning', 'Failed to drop anchor.', 'error');
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
        showToast(data.action === 'added' ? 'Held Close 📦' : 'Released from Treasury', data.action === 'added' ? 'Added to your Treasury.' : 'Removed from Treasury.', 'success');
    } catch (e) {
        showToast('Warning', 'Failed to update treasury.', 'error');
    }
  };

  const handleThreadReflection = (story: LibraryStory) => {
     // Navigate to chat/journal and pass the story context so it can be associated
     // In a real app we might pass this via URL param or context. 
     // For now we will use a simple query param and handle it in ChatInterface/JournalEditor
     router.push(`/home?inspire=${story.id}`);
  };

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <Header />
      
      {/* Mood Navigator */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md pt-6 pb-4 mb-8">
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

      <AnimatePresence>
        {toastMessage && (

          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-serif backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-900 border-rose-700 text-white' : 'bg-emerald-900 border-emerald-700 text-white'}`}
          >
             <div>
               <h4 className="font-bold text-sm">{toastMessage.title}</h4>
               <p className="text-xs opacity-80">{toastMessage.desc}</p>
             </div>
          </motion.div>
        )}

        {planeModalOpen && selectedStory && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setPlaneModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-[#111] rounded-[32px] p-8 w-full max-w-lg border border-slate-100 dark:border-white/5 shadow-2xl"
             >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Cast an Invisible Thread</h3>
                  <p className="text-sm font-serif italic text-slate-500 mt-2">
                    Send a paper plane to <strong>{selectedStory.pen_name}</strong>. If WinDear senses an empathetic and pure intention, it will be delivered safely.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 mb-6 font-serif text-amber-800 dark:text-amber-200/80 text-xs leading-relaxed text-center italic">
                  &quot;Only messages meant to heal, support, or resonate will survive the journey across the midnight bridge.&quot;
                </div>

                <textarea 
                  value={planeMessage}
                  onChange={(e) => setPlaneMessage(e.target.value)}
                  placeholder="I read your story and I wanted you to know..."
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-slate-300 dark:focus:border-white/20 transition-colors resize-none font-serif text-sm"
                />

                <div className="flex gap-3 mt-6">
                  <button 
                     disabled={sendingPlane}
                     onClick={() => setPlaneModalOpen(false)}
                     className="flex-1 px-4 py-3 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
                  >
                     Keep it
                  </button>
                  <button 
                     disabled={sendingPlane || !planeMessage.trim()}
                     onClick={handleSendPlane}
                     className="flex-1 px-4 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {sendingPlane ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                          Crossing...
                        </>
                     ) : (
                        <>Throw Plane <Send className="w-3 h-3" /></>
                     )}
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-6 pt-32">
        <div className="text-center mb-16 space-y-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 blur-[100px] pointer-events-none" />
          <h1 className="text-4xl md:text-5xl font-serif italic text-slate-900 dark:text-white">The Global Library</h1>
          <p className="text-slate-500 dark:text-slate-400 font-serif italic max-w-lg mx-auto">
            A beautiful archive of anonymous human experiences. Real stories, gifted by souls around the world.
          </p>
        </div>

        {loading ? (
           <div className="flex justify-center mt-20">
              <LoadingSpace message="Opening the ancient doors..." />
           </div>
        ) : filteredStories.length === 0 ? (
           <div className="text-center mt-20">
             <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
             <p className="font-serif italic text-slate-500">No stories found for this mood. Try another?</p>
           </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence>
              {filteredStories.map((story, i) => (
                <motion.article
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-3xl p-8 hover:shadow-2xl transition-all group"
                >
                  <header className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
                         <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        {story.inspired_by_story_id && (
                           <div className="flex items-center gap-1.5 mb-1.5 text-amber-500/80">
                              <Sparkles className="w-3 h-3" />
                              <span className="text-[9px] uppercase tracking-wider font-bold">Born from a whisper</span>
                           </div>
                        )}
                        <div className="flex items-baseline gap-2">
                           <h3 className="font-serif font-medium text-lg text-slate-900 dark:text-gray-200">{story.pen_name}</h3>
                           <span className="font-mono text-xs text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">#{story.pen_name_tag}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400">
                          {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleHoldTreasury(story.id)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" title="Hold story close in Treasury">
                       <BookMarked className="w-5 h-5" />
                    </button>
                  </header>

                  <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 pr-8">
                    {story.title}
                  </h4>

                  <div className="prose prose-slate dark:prose-invert font-serif leading-relaxed text-slate-600 dark:text-slate-300 relative">
                    {story.story_content.split('\n').filter(p => p.trim()).map((p, pIdx) => {
                       const isAhsasLocally = localAhsas[story.id]?.has(pIdx);
                       // We can also check backend ahsas count if returned by API.
                       const backendAhsasCount = story.echoes?.find(e => e.paragraph_index === pIdx)?.count || 0;
                       const totalAhsas = isAhsasLocally ? backendAhsasCount + 1 : backendAhsasCount;
                       
                       const isAhsas = totalAhsas > 0;
                       
                       return (
                         <div key={pIdx} className="mb-6 group/para relative -mx-4 px-4 py-2 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <p className={isAhsas ? 'text-indigo-900 dark:text-indigo-200 drop-shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all' : 'transition-all'}>
                               {p}
                            </p>
                            
                            {/* Ahsas Action */}
                            <button 
                               onClick={() => handleAhsas(story.id, pIdx)}
                               className={`absolute -right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isAhsasLocally ? 'opacity-100 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500' : 'opacity-0 group-hover/para:opacity-100 bg-white dark:bg-black border border-slate-100 dark:border-white/10 hover:scale-110 shadow-lg text-slate-400'}`}
                               title="Share an Ahsas"
                            >
                               <Sparkles className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       );
                    })}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#111] to-transparent pointer-events-none" />
                  </div>

                  {/* Interaction Bar: The Energy Jar & Paper Plane */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* The Energy Jar */}
                    <div className="flex items-center gap-2 flex-wrap">
                       <button onClick={() => handleReaction(story.id, 'hope')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:scale-105 transition-transform text-xs font-serif group/jar">
                          <Leaf className="w-3.5 h-3.5" />
                          <span>Gave Hope</span>
                       </button>
                       <button onClick={() => handleReaction(story.id, 'tear')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:scale-105 transition-transform text-xs font-serif group/jar">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>Shed a Tear</span>
                       </button>
                       <button onClick={() => handleReaction(story.id, 'resonance')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:scale-105 transition-transform text-xs font-serif group/jar">
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Felt this too</span>
                       </button>
                       <button onClick={() => handleThreadReflection(story)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 hover:scale-105 transition-transform text-xs font-serif group/jar ml-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Sparked a memory</span>
                       </button>

                       {story.likes_count > 0 && (
                         <div className="flex items-center gap-1 ml-2 text-slate-400">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-bold">{story.likes_count}</span>
                         </div>
                       )}
                    </div>
                    
                    {/* The Bridge / Paper Plane */}
                    <button 
                       onClick={() => { setSelectedStory(story); setPlaneModalOpen(true); }}
                       className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider group/plane w-full sm:w-auto"
                    >
                       <Send className="w-3.5 h-3.5 group-hover/plane:-translate-y-1 group-hover/plane:translate-x-1 transition-transform" />
                       Send a Plane
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
