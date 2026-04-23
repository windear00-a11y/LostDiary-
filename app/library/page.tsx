'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Heart, BookOpen, User, Droplets, Leaf, Send, Sparkles, Handshake, Anchor, BookMarked, ChevronDown, ChevronUp, MoreHorizontal, Bookmark, ArrowRight } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EngagementSoulCard } from '@/components/library/EngagementSoulCard';
import { StoryReader } from '@/features/story/StoryReader';
import { coreService, Chapter, Volume } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';

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
  const { user: authUser } = useAuth();
  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User's own story data
  const [userChapters, setUserChapters] = useState<Chapter[]>([]);
  const [userVolumes, setUserVolumes] = useState<Volume[]>([]);
  const [isReadingSelf, setIsReadingSelf] = useState(false);

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
  const [readingStory, setReadingStory] = useState<LibraryStory | null>(null);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'feed' | 'echoes'>('feed');

  // Bridges State
  const [inboxPlanes, setInboxPlanes] = useState<any[]>([]);
  const [activeBridges, setActiveBridges] = useState<any[]>([]);
  const [expandedPlanes, setExpandedPlanes] = useState<Set<string>>(new Set());
  const [bridgeConfirmSheet, setBridgeConfirmSheet] = useState<{ open: boolean, plane: any | null }>({ open: false, plane: null });

  const moods = ['all', 'hope', 'tear', 'resonance', 'reflective', 'courage', 'calm'];

  const filteredStories = activeMood === 'all' 
    ? stories 
    : stories.filter(s => s.dominant_emotion === activeMood);

  const fetchBridges = async () => {
    if (!authUser) return;
    try {
      const [planesRes, bridgesRes] = await Promise.all([
         fetch('/api/profile/planes'),
         fetch('/api/bridge/list')
      ]);
      if (planesRes.ok) {
        const planesData = await planesRes.json();
        setInboxPlanes(planesData.planes || []);
      }
      if (bridgesRes.ok) {
        const bridgesData = await bridgesRes.json();
        setActiveBridges(bridgesData.bridges || []);
      }
    } catch (e) {
      console.error("Bridge fetch failed:", e);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [feedRes, chaptersData, volumesData] = await Promise.all([
          fetch('/api/library/feed').then(r => r.json()),
          authUser ? coreService.fetchChapters(authUser.id) : Promise.resolve([]),
          authUser ? coreService.fetchVolumes(authUser.id) : Promise.resolve([])
        ]);

        if (feedRes.stories) setStories(feedRes.stories);
        setUserChapters(chaptersData);
        setUserVolumes(volumesData);
        
        if (authUser) fetchBridges();

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [authUser]);

  const handleAcceptPlane = async (plane: any) => {
    setBridgeConfirmSheet({ open: true, plane });
  };

  const confirmBridge = async () => {
    const plane = bridgeConfirmSheet.plane;
    if (!plane) return;
    try {
      const res = await fetch('/api/profile/planes/accept', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ planeId: plane.id }) 
      });
      const data = await res.json();
      if (data.success) {
        setInboxPlanes(curr => curr.filter(p => p.id !== plane.id));
        setBridgeConfirmSheet({ open: false, plane: null });
        toast.success("Bridge Manifested");
        fetchBridges(); // Refresh list
      }
    } catch (e) {
      toast.error("Failed to build bridge.");
    }
  };

  const togglePlane = (id: string) => {
    setExpandedPlanes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isReadingSelf && authUser) {
    return (
      <StoryReader
        chapters={userChapters}
        volumes={userVolumes}
        isLibraryView={false} // User's own book - allow publishing/sealing
        onBack={() => setIsReadingSelf(false)}
        userName={authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0]}
        coverData={{
          title: userVolumes?.[0]?.title || "My Life Book",
          summary: "This is your private sanctuary. You can choose to anonymously gift chapters to the Global Library.",
          aura: "indigo"
        }}
      />
    );
  }

  if (readingStory) {
    // Convert LibraryStory to Chapter format for StoryReader
    const chapter = {
      id: readingStory.id,
      title: readingStory.title,
      content: readingStory.story_content,
      created_at: readingStory.created_at,
    };

    return (
      <StoryReader
        chapters={[chapter as any]}
        isLibraryView={true}
        onBack={() => setReadingStory(null)}
        userName={readingStory.pen_name}
        coverData={{
          title: readingStory.title,
          summary: readingStory.story_content.substring(0, 150) + '...',
          aura: readingStory.dominant_emotion
        }}
      />
    );
  }

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

      {/* Bridge Confirmation Sheet */}
      <BottomSheet
        isOpen={bridgeConfirmSheet.open}
        onClose={() => setBridgeConfirmSheet({ open: false, plane: null })}
        title="Build a Soul Bridge?"
        subtitle={`Connecting with ${bridgeConfirmSheet.plane?.sender?.pen_name}. This will establish a persistent and private link between your sanctuaries.`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-serif italic leading-relaxed">
            &quot;A bridge is more than a path; it is a shared space of trust. Conversations here are protected by the sanctuary's silence.&quot;
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 opacity-60">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                   <p className="text-[10px] font-bold uppercase text-slate-500">Connection Mode</p>
                   <p className="text-sm font-medium">Standard Protected (Fully Anonymous)</p>
                </div>
             </div>
          </div>

          <button 
             onClick={confirmBridge}
             className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
             Confirm and Open Bridge <Handshake className="w-4 h-4" />
          </button>
        </div>
      </BottomSheet>
      
      {/* Mood Navigator & Tab Switcher */}
      <div className="sticky top-20 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md pt-10 pb-4 mb-4 border-b border-gray-100 dark:border-white/5">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-6 mb-6">
           <button 
             onClick={() => setActiveLibraryTab('feed')}
             className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeLibraryTab === 'feed' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <Globe className="w-3.5 h-3.5" /> Global Feed {activeLibraryTab === 'feed' && <motion.div layoutId="libTab" className="w-6 h-0.5 bg-indigo-600 absolute -bottom-2 round-full" />}
           </button>
           <button 
             onClick={() => setActiveLibraryTab('echoes')}
             className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeLibraryTab === 'echoes' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <MessageSquare className="w-3.5 h-3.5" /> Soul Signals 
             {inboxPlanes.length > 0 && <span className="absolute -top-1 -right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
             {activeLibraryTab === 'echoes' && <motion.div layoutId="libTab" className="w-6 h-0.5 bg-indigo-600 absolute -bottom-2 round-full" />}
           </button>
        </div>

        {activeLibraryTab === 'feed' && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 justify-center">
              {moods.map((mood) => (
                  <button
                      key={mood}
                      onClick={() => setActiveMood(mood)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                          activeMood === mood 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                  >
                      {mood}
                  </button>
              ))}
          </div>
        )}
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-10">
        <AnimatePresence mode="wait">
          {activeLibraryTab === 'feed' ? (
            <motion.div
              key="lib-feed"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              {/* Engagement Dashboard */}
              <div className="mb-12">
                <EngagementSoulCard />
              </div>

              <header className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif italic text-slate-900 dark:text-white">The Global Library</h1>
                <p className="text-slate-500 dark:text-slate-400 font-serif italic max-w-lg mx-auto">
                  A living archive of souls. Click a story for an immersive reading experience.
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
                <div className="space-y-12">
                  {/* User's Own Book Card */}
                  {userChapters.length > 0 && (
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-50/50 dark:bg-indigo-500/5 border-2 border-indigo-500/20 rounded-[32px] overflow-hidden shadow-2xl relative group mb-12"
                    >
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                      <div className="md:grid md:grid-cols-[200px_1fr] flex flex-col min-h-[220px]">
                        <div 
                          onClick={() => setIsReadingSelf(true)}
                          className="relative flex flex-col items-center justify-center p-6 text-center cursor-pointer group/spine bg-indigo-600 shadow-inner"
                        >
                          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                          <div className="absolute left-1 top-0 bottom-0 w-2 bg-black/10 blur-[1px]" />
                          
                          <BookMarked className="w-10 h-10 text-white mb-4 group-hover/spine:scale-110 group-hover/spine:rotate-6 transition-all" />
                          <h3 className="font-serif font-bold text-white text-base drop-shadow-md leading-tight">My Life Book</h3>
                          <div className="text-[9px] font-mono text-white/50 bg-black/20 px-2 py-1 rounded mt-3 uppercase tracking-widest">Private Archive</div>
                          
                          <div className="mt-6 flex flex-col items-center gap-1 opacity-60 group-hover/spine:opacity-100 transition-opacity">
                             <span className="text-[8px] font-bold text-white/80 uppercase tracking-tighter">Enter Sanctuary</span>
                             <ChevronRight className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        <div className="p-8 flex flex-col justify-center relative z-10">
                          <div className="flex items-start justify-between mb-4">
                             <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">Your Narrative Sanctuary</h4>
                                 <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic">
                                {userChapters.length} Chapters written.
                              </p>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">
                                    Private
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">Visible only to you</span>
                             </div>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-300 text-sm font-serif leading-relaxed line-clamp-2 italic mb-6">
                             &quot;This is where your story rests alongside the world&apos;s echoes. You hold the key to keep it private or share it with the stars.&quot;
                          </p>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setIsReadingSelf(true)}
                              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/20 transition-all"
                            >
                              Step Into Your World <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  )}

                  {filteredStories.map((story, i) => {
                    const isExpanded = expandedStories.has(story.id);
                    return (
                      <motion.article
                        key={story.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-indigo-500/20 shadow-2xl' : 'hover:shadow-xl'}`}
                      >
                        {/* Feed Card Content remains same */}
                        <div className="md:grid md:grid-cols-[160px_1fr] flex flex-col min-h-[160px]">
                          <div className={`relative flex flex-col items-center justify-center p-4 text-center cursor-pointer group ${
                            story.dominant_emotion === 'hope' ? 'bg-emerald-500' :
                            story.dominant_emotion === 'tear' ? 'bg-blue-500' :
                            story.dominant_emotion === 'resonance' ? 'bg-indigo-500' :
                            story.dominant_emotion === 'reflective' ? 'bg-slate-500' :
                            story.dominant_emotion === 'courage' ? 'bg-rose-500' :
                            'bg-indigo-600'
                          }`} onClick={() => setReadingStory(story)}>
                             <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                             <BookMarked className="w-6 h-6 text-white/40 mb-3 group-hover:scale-110 transition-transform" />
                             <h3 className="font-serif font-bold text-white text-sm drop-shadow-md leading-tight">{story.pen_name}</h3>
                             <div className="text-[8px] font-mono text-white/50 bg-black/20 px-1.5 py-0.5 rounded mt-2 uppercase tracking-widest">#{story.pen_name_tag}</div>
                          </div>

                          <div className="p-6 flex flex-col">
                             <header className="flex items-start justify-between mb-2">
                                <div className="cursor-pointer flex-1" onClick={() => setReadingStory(story)}>
                                  <h4 className="text-xl font-serif font-bold text-slate-900 dark:text-white leading-tight">{story.title}</h4>
                                  <div className="flex items-center gap-3 mt-1.5">
                                     <span className="text-[9px] uppercase tracking-widest text-slate-400">Gifted on {new Date(story.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <button onClick={() => handleHoldTreasury(story.id)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                                  <Anchor className="w-4 h-4" />
                                </button>
                             </header>
                             <div className="mt-2 group/card cursor-pointer" onClick={() => setReadingStory(story)}>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-serif italic">
                                  &quot;{story.story_content.substring(0, 140)}...&quot;
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-indigo-500 group-hover:gap-3 transition-all">
                                  Read Immersive Experience <Sparkles className="w-2 h-2" />
                                </div>
                             </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="lib-echoes"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-12 pb-20"
            >
               <header className="text-center mb-16">
                  <h2 className="text-3xl font-serif italic text-slate-900 dark:text-white">Soul Signals</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic mt-2">Your connections and echoes from the library.</p>
               </header>

               {/* Bridges & Planes Sections */}
               <div className="space-y-16">
                  {/* Paper Planes (Inbox) */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                       <Send className="w-4 h-4 text-indigo-500" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Received Planes</h3>
                    </div>
                    
                    {inboxPlanes.length === 0 ? (
                       <div className="p-10 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-[32px] text-center">
                          <p className="text-xs text-slate-500 font-serif italic">Your window is open, waiting for a signal.</p>
                       </div>
                    ) : (
                       <div className="grid gap-4">
                          {inboxPlanes.map(plane => {
                             const isExpanded = expandedPlanes.has(plane.id);
                             return (
                               <div key={plane.id} className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-[24px] overflow-hidden transition-all">
                                  <div onClick={() => togglePlane(plane.id)} className="p-5 cursor-pointer flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                           <User className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                           <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{plane.sender?.pen_name}</p>
                                           <p className="text-[9px] text-slate-400 font-mono">#{plane.sender?.pen_name_tag}</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <span className="text-[9px] text-slate-400 font-mono">{new Date(plane.created_at).toLocaleDateString()}</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                                     </div>
                                  </div>
                                  <AnimatePresence>
                                     {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-5 pb-5">
                                           <p className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl text-xs font-serif italic text-slate-600 dark:text-slate-400 mb-4 line-relaxed">
                                              &quot;{plane.content}&quot;
                                           </p>
                                           <button 
                                             onClick={() => handleAcceptPlane(plane)}
                                             className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                           >
                                              Accept Connection <Handshake className="w-3.5 h-3.5" />
                                           </button>
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                               </div>
                             );
                          })}
                       </div>
                    )}
                  </div>

                  {/* Active Soul Bridges */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                       <Handshake className="w-4 h-4 text-indigo-500" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Active Bridges</h3>
                    </div>
                    
                    {activeBridges.length === 0 ? (
                       <div className="p-10 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-[32px] text-center">
                          <p className="text-xs text-slate-500 font-serif italic">No active bridges yet. Your echoes are still traveling.</p>
                       </div>
                    ) : (
                       <div className="grid gap-4">
                          {activeBridges.map(bridge => (
                            <div 
                              key={bridge.id} 
                              onClick={() => router.push(`/bridge/${bridge.id}`)}
                              className="p-5 bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-2x flex items-center justify-between group cursor-pointer hover:border-indigo-500/20"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                     <User className="w-5 h-5 text-indigo-400" />
                                  </div>
                                  <div>
                                     <p className="font-serif font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-400 transition-colors">{bridge.other.pen_name}</p>
                                     <div className="flex gap-2">
                                        <span className="text-[9px] uppercase font-bold text-indigo-500 bg-indigo-500/5 px-1 py-0.5 rounded">{bridge.mode}</span>
                                        <span className="text-[9px] text-slate-400">{new Date(bridge.updated_at).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all" />
                            </div>
                          ))}
                       </div>
                    )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
