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
                  {/* The Soul Box (Book UI) */}
                  <div className="md:grid md:grid-cols-[180px_1fr] flex flex-col gap-6">
              {/* Book Spine/Cover Section */}
              <div className={`relative h-[240px] md:h-full rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4 text-center group-hover:scale-[1.02] transition-transform ${
                story.dominant_emotion === 'hope' ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                story.dominant_emotion === 'tear' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' :
                story.dominant_emotion === 'resonance' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' :
                story.dominant_emotion === 'reflective' ? 'bg-gradient-to-br from-slate-400 to-zinc-600' :
                story.dominant_emotion === 'courage' ? 'bg-gradient-to-br from-rose-400 to-orange-600' :
                'bg-gradient-to-br from-indigo-400 to-purple-600'
              }`}>
                {/* Book Texture Overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                
                <div className="absolute left-1 top-0 bottom-0 w-2 bg-black/10 shadow-inner" /> {/* Spine line */}

                <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto border border-white/30">
                    <BookMarked className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-serif font-bold text-white text-lg tracking-tight leading-none drop-shadow-md">
                    {story.pen_name}
                  </h3>
                  <div className="text-[10px] font-mono text-white/70 bg-black/10 px-1.5 py-0.5 rounded backdrop-blur-sm inline-block">
                    #{story.pen_name_tag}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/50">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Volume {Math.floor(Math.random() * 5) + 1}</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-2 h-2" />
                    <span className="text-[8px] font-bold">#{story.dominant_emotion}</span>
                  </div>
                </div>
              </div>

              {/* Story Content Section */}
              <div className="flex flex-col">
                <header className="flex items-start justify-between mb-6">
                  <div>
                    <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
                      {story.title}
                    </h4>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 block">
                      Gifted on {new Date(story.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <button onClick={() => handleHoldTreasury(story.id)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" title="Hold story close in Treasury">
                    <Anchor className="w-5 h-5" />
                  </button>
                </header>

                <div className="prose prose-slate dark:prose-invert font-serif leading-relaxed text-slate-600 dark:text-slate-300 relative">
                  {story.story_content.split('\n').filter(p => p.trim()).map((p, pIdx) => {
                     const isAhsasLocally = localAhsas[story.id]?.has(pIdx);
                     const backendAhsasCount = story.echoes?.find(e => e.paragraph_index === pIdx)?.count || 0;
                     const totalAhsas = isAhsasLocally ? backendAhsasCount + 1 : backendAhsasCount;
                     const isAhsas = totalAhsas > 0;
                     
                     return (
                       <div key={pIdx} className="mb-4 group/para relative -mx-2 px-2 py-1 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <p className={`text-sm ${isAhsas ? 'text-indigo-900 dark:text-indigo-200 drop-shadow-[0_0_10px_rgba(99,102,241,0.1)]' : ''}`}>
                             {p}
                          </p>
                       </div>
                     );
                  })}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-[#111] to-transparent pointer-events-none" />
                </div>

                {/* Interaction Bar */}
                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleReaction(story.id, 'hope')} className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg hover:scale-110 transition-transform"><Leaf className="w-4 h-4" /></button>
                     <button onClick={() => handleReaction(story.id, 'tear')} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform"><Droplets className="w-4 h-4" /></button>
                     <button onClick={() => handleReaction(story.id, 'resonance')} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:scale-110 transition-transform"><Handshake className="w-4 h-4" /></button>
                     
                     {story.likes_count > 0 && (
                       <div className="flex items-center gap-1 ml-2 text-slate-400">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold">{story.likes_count}</span>
                       </div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleThreadReflection(story)} 
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => { setSelectedStory(story); setPlaneModalOpen(true); }}
                       className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/plane"
                    >
                       <Send className="w-3 h-3 group-hover/plane:-translate-y-1 group-hover/plane:translate-x-1 transition-all" />
                       Send Plane
                    </button>
                  </div>
                </div>
              </div>
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
