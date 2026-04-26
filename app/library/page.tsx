'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Heart, BookOpen, User, Droplets, Leaf, Send, Sparkles, Handshake, Anchor, BookMarked, ChevronDown, ChevronUp, MoreHorizontal, Bookmark, ArrowRight, Clock, MessageSquare, Shield, PenTool, ChevronRight } from 'lucide-react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EngagementSoulCard } from '@/components/library/EngagementSoulCard';
import { AuthorHeartbeat } from '@/components/profile/AuthorHeartbeat';
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
  const { activeLibraryTab, setActiveLibraryTab } = useUIStore();
  const [displayMode, setDisplayMode] = useState<'idle' | 'switching'>('idle');

  // Bridges State
  const [inboxPlanes, setInboxPlanes] = useState<any[]>([]);
  const [activeBridges, setActiveBridges] = useState<any[]>([]);
  const [expandedPlanes, setExpandedPlanes] = useState<Set<string>>(new Set());
  const [bridgeConfirmSheet, setBridgeConfirmSheet] = useState<{ open: boolean, plane: any | null }>({ open: false, plane: null });

  // CONSTELLATION VIEW STATE
  const [isConstellationView, setIsConstellationView] = useState(false);

  const moods = ['all', 'hope', 'tear', 'resonance', 'reflective', 'courage', 'calm'];

  const filteredStories = activeMood === 'all' 
    ? stories 
    : stories.filter(s => s.dominant_emotion === activeMood);

  const fetchBridges = useCallback(async () => {
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
  }, [authUser]);

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
  }, [authUser, fetchBridges]);

  const handleAcceptPlane = async (plane: any) => {
    setBridgeConfirmSheet({ open: true, plane });
  };

  const handleRejectPlane = async (planeId: string) => {
     try {
         const res = await fetch('/api/profile/planes/reject', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ planeId })
         });
         if (res.ok) {
             setInboxPlanes(curr => curr.filter(p => p.id !== planeId));
             toast.info("Plane archived silently.");
         } else {
             throw new Error("Failed to archive");
         }
     } catch (e) {
         toast.error("Failed to archive plane.");
     }
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
        router.push(`/bridge/${data.bridgeId}`);
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
            &quot;A bridge is more than a path; it is a shared space of trust. Conversations here are protected by the sanctuary&apos;s silence.&quot;
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
      <div className="sticky top-20 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md pt-6 pb-4 mb-4 border-b border-gray-100 dark:border-white/5">
        
        {/* Top Integration: Tab Switcher & Constellation Toggle */}
        <div className="flex items-center justify-between px-6 mb-6">
            <div className="flex bg-slate-100 dark:bg-white/5 rounded-full p-1">
              <button
                onClick={() => { setActiveLibraryTab('feed'); setIsReadingSelf(false); }}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
                  !isReadingSelf && activeLibraryTab === 'feed' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setIsReadingSelf(true)}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
                  isReadingSelf ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                Sanctuary
              </button>
            </div>

            {!isReadingSelf && activeLibraryTab === 'feed' && (
              <button
                 onClick={() => setIsConstellationView(!isConstellationView)}
                 className={`p-2 rounded-full transition-all ${isConstellationView ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                 title="Toggle Constellation Map"
              >
                 <Sparkles className="w-4 h-4" />
              </button>
            )}
        </div>

        {/* Mood Filter - Expandable (Only visible on Global Library + List view) */}
        {!isReadingSelf && activeLibraryTab === 'feed' && !isConstellationView && (
            <div className="px-6 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    {moods.map((mood) => (
                        <button
                            key={mood}
                            onClick={() => setActiveMood(mood)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                                activeMood === mood 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-400'
                            }`}
                        >
                            {mood}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      <main className={`mx-auto ${isConstellationView ? 'max-w-none px-0 pt-0 border-t border-slate-100 dark:border-white/5 relative h-[60vh] overflow-hidden' : 'max-w-3xl px-6 pt-10'}`}>
        <AnimatePresence mode="wait">
          {activeLibraryTab === 'feed' ? (
            isConstellationView ? (
              <motion.div
                key="lib-constellation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center z-0 cursor-crosshair min-h-[500px]"
              >
                 <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black" />
                 
                 {filteredStories.map((story, idx) => {
                    // Generate random positions but consistent by using index logic, or Math.sin
                    const seed = story.id.length * (idx + 1);
                    const top = 15 + (Math.abs(Math.sin(seed * 1.3)) * 70);
                    const left = 10 + (Math.abs(Math.cos(seed * 2.7)) * 80);
                    
                    const glowColor = 
                        story.dominant_emotion === 'hope' ? 'shadow-[0_0_20px_#10B981]' :
                        story.dominant_emotion === 'tear' ? 'shadow-[0_0_20px_#3B82F6]' :
                        story.dominant_emotion === 'resonance' ? 'shadow-[0_0_30px_#6366F1]' :
                        story.dominant_emotion === 'reflective' ? 'shadow-[0_0_15px_#CBD5E1]' :
                        story.dominant_emotion === 'courage' ? 'shadow-[0_0_25px_#E11D48]' :
                        'shadow-[0_0_15px_#8B5CF6]';
                    
                    const starColor = 
                        story.dominant_emotion === 'hope' ? 'bg-emerald-400' :
                        story.dominant_emotion === 'tear' ? 'bg-blue-400' :
                        story.dominant_emotion === 'resonance' ? 'bg-indigo-400' :
                        story.dominant_emotion === 'reflective' ? 'bg-slate-300' :
                        story.dominant_emotion === 'courage' ? 'bg-rose-400' :
                        'bg-violet-400';

                    return (
                        <motion.div
                          key={`star-${story.id}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1, duration: 1 }}
                          className="absolute group z-10"
                          style={{ top: `${top}%`, left: `${left}%` }}
                        >
                            <button
                               onClick={() => setReadingStory(story)}
                               className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${starColor} ${glowColor} opacity-70 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500`}
                            />
                            {/* Tooltip line linking star to text */}
                            <div className="absolute top-1/2 left-1/2 w-[2px] h-[30px] bg-white/20 origin-top rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 pointer-events-none" />
                            
                            <div className="absolute top-[35px] left-[35px] w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300 pointer-events-none z-50 bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                <p className="text-[9px] uppercase tracking-widest text-white/50">{story.pen_name}</p>
                                <h4 className="font-serif text-white text-sm line-clamp-2">{story.title}</h4>
                            </div>
                        </motion.div>
                    );
                 })}
                 
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold pointer-events-none">
                     The Constellation of Souls
                 </div>
              </motion.div>
            ) : (
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
                  {/* User's Own Book Card - Enhanced Aesthetic */}
                  {userChapters.length > 0 && (
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-50/30 dark:bg-indigo-500/[0.03] border border-indigo-500/20 rounded-[40px] overflow-hidden shadow-2xl relative group mb-16"
                    >
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                      <div className="md:grid md:grid-cols-[220px_1fr] flex flex-col min-h-[300px]">
                        <div 
                          onClick={() => setIsReadingSelf(true)}
                          className="relative flex flex-col items-center justify-center p-8 text-center cursor-pointer group/spine bg-indigo-600 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.3)]"
                        >
                          {/* Book Texture & Spine Depth */}
                          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                          <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20" />
                          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                          
                          <div className="relative z-10 transition-transform duration-700 group-hover/spine:scale-105 group-hover/spine:-rotate-2">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-6 mx-auto">
                              <BookOpen className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-serif font-bold text-white text-xl drop-shadow-xl leading-tight px-2">The Archive of Your Soul</h3>
                            
                            {/* Gold Foil Tag */}
                            <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 rounded-lg shadow-lg rotate-1">
                               <Sparkles className="w-3 h-3 text-amber-900" />
                               <span className="text-[9px] font-bold text-amber-950 uppercase tracking-widest">Master Volume</span>
                            </div>
                          </div>
                          
                          <div className="mt-12 flex flex-col items-center gap-2 opacity-0 group-hover/spine:opacity-100 transition-all duration-500 translate-y-4 group-hover/spine:translate-y-0">
                             <span className="text-[9px] font-bold text-white/80 uppercase tracking-[0.3em]">Open Sanctuary</span>
                             <ChevronDown className="w-4 h-4 text-white animate-bounce" />
                          </div>
                        </div>

                        <div className="p-10 flex flex-col justify-center relative z-10 bg-white dark:bg-[#0c0c0c]">
                          <div className="flex items-start justify-between mb-6">
                             <div className="space-y-2">
                               <div className="flex items-center gap-3">
                                  <h4 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Your Narrative Sanctuary</h4>
                                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                               </div>
                               <p className="text-sm text-slate-400 dark:text-zinc-500 font-serif italic flex items-center gap-2">
                                 <PenTool className="w-3.5 h-3.5 opacity-50" /> {userChapters.length} Chapters Woven into Existence
                               </p>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                <div className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 px-4 py-1.5 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] border border-slate-200 dark:border-white/10">
                                    Private Access
                                </div>
                             </div>
                          </div>
                          
                          <p className="text-slate-600 dark:text-zinc-400 text-lg font-serif leading-relaxed line-clamp-3 italic mb-10 border-l-2 border-indigo-500/10 pl-6">
                             &quot;Every memory is a thread. This volume contains the raw essence of your journey—untouched by external eyes, yet ready to be shared as a gift to the world whenever you choose.&quot;
                          </p>

                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => setIsReadingSelf(true)}
                              className="group relative flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[20px] font-bold text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all overflow-hidden"
                            >
                              <span className="relative z-10">Step Into Your World</span>
                              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                            
                            <div className="h-10 w-px bg-slate-100 dark:bg-white/5" />
                            
                            <p className="text-[10px] text-slate-400 font-serif italic max-w-[120px] leading-tight">
                              Contains thoughts from today&apos;s reflection.
                            </p>
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
                        className={`group bg-white dark:bg-[#0d0d0d] border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden transition-all duration-700 cursor-pointer ${isExpanded ? 'ring-2 ring-indigo-500/20 shadow-2xl' : 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-indigo-500/5'}`}
                        onClick={() => setReadingStory(story)}
                      >
                        <div className="md:grid md:grid-cols-[180px_1fr] flex flex-col min-h-full">
                           <div className={`relative flex flex-col items-center justify-center p-6 text-center shadow-[inset_-5px_0_15px_rgba(0,0,0,0.1)] ${
                            story.dominant_emotion === 'hope' ? 'bg-emerald-600' :
                            story.dominant_emotion === 'tear' ? 'bg-blue-600' :
                            story.dominant_emotion === 'resonance' ? 'bg-indigo-600' :
                            story.dominant_emotion === 'reflective' ? 'bg-slate-700' :
                            story.dominant_emotion === 'courage' ? 'bg-rose-600' :
                            'bg-violet-600'
                          }`}>
                             <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }} />
                             <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10" />
                             
                             <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                                <BookOpen className="w-8 h-8 text-white/50 mb-4 mx-auto" />
                                <h3 className="font-serif font-bold text-white text-base leading-tight drop-shadow-md">{story.pen_name}</h3>
                                
                                <div className="mt-3 flex items-center justify-center gap-1.5 py-1 px-3 bg-black/20 rounded-full backdrop-blur-sm border border-white/5">
                                   <div className={`w-1.5 h-1.5 rounded-full ${
                                      story.dominant_emotion === 'hope' ? 'bg-emerald-400' :
                                      story.dominant_emotion === 'tear' ? 'bg-blue-400' :
                                      story.dominant_emotion === 'resonance' ? 'bg-indigo-400' :
                                      'bg-white/60'
                                   }`} />
                                   <span className="text-[8px] font-mono text-white/80 uppercase tracking-widest">{story.pen_name_tag}</span>
                                </div>
                             </div>
                           </div>

                           <div className="p-8 flex flex-col justify-between">
                              <div>
                                <header className="flex items-start justify-between mb-4">
                                   <div>
                                     <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-500 transition-colors">{story.title}</h4>
                                     <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                           <Clock className="w-3 h-3" /> {new Date(story.created_at).toLocaleDateString()}
                                        </div>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleHoldTreasury(story.id); }} 
                                     className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-indigo-500 transition-all"
                                   >
                                     <Bookmark className="w-4 h-4" />
                                   </button>
                                </header>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 font-serif leading-relaxed line-clamp-3 italic">
                                   &quot;{story.story_content.substring(0, 180)}...&quot;
                                </p>
                              </div>
                              
                              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                                 <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5">
                                       <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                                       <span className="text-[10px] font-bold font-mono text-slate-500">{story.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                       <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                       <span className="text-[10px] font-bold font-mono text-slate-500">{story.echoes?.length || 0}</span>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                    Touch the soul <Sparkles className="w-3 h-3" />
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
            )
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

               <div className="mb-16">
                  <AuthorHeartbeat />
               </div>

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
                                             className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mb-2"
                                           >
                                              Accept Connection <Handshake className="w-3.5 h-3.5" />
                                           </button>
                                           <button 
                                             onClick={() => handleRejectPlane(plane.id)}
                                             className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-center"
                                           >
                                              Reject & Archive
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
