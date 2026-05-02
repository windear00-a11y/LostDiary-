'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowLeft, X, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { coreService, Chapter, Volume } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useAuth } from '@/components/auth/AuthProvider';
import { StoryReader } from './StoryReader';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { LifeBookCover } from './LifeBookCover';
import { toast } from 'sonner';
import { reportIncident } from '@/lib/utils/telemetry';

const SkeletonLoader = () => (
  <div className="max-w-[700px] mx-auto pt-40 px-6">
    <LoadingSpace message="Assembling your narrative..." />
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { setActiveView } = useUIStore();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.getUser();
      if (user) {
        const [chaptersData, volumesData, profileData] = await Promise.all([
          coreService.fetchChapters(user.id),
          coreService.fetchVolumes(user.id),
          coreService.getProfile(user.id)
        ]);
        
        setChapters(chaptersData);
        setVolumes(volumesData);
        setProfile(profileData);

        // Use existing volume data for cover and opening instead of generating on the fly
        if (volumesData && volumesData.length > 0) {
          const currentVolume = volumesData[0];
          setOpeningText(currentVolume.prologue || "Your story unfolds...");
          setCoverData({
            title: currentVolume.title || "The Story So Far",
            summary: currentVolume.epigraph || "A journey through time, captured in memory.",
            aura: currentVolume.aura || "Midnight Indigo"
          });
        } else if (chaptersData.length > 0) {
          setOpeningText("Your story unfolds...");
          setCoverData({
            title: "Chapters of the Heart",
            summary: "A journey through time, captured in memory.",
            aura: "Midnight Indigo"
          });
        }
      }
    } catch (error) {
      console.error("Failed to load data", error);
      setError("Failed to load your LifeBook. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-sync once if the book is empty
  useEffect(() => {
    if (!loading && chapters.length === 0 && !isSyncing && !error && user) {
      handleSyncChapters();
    }
  }, [loading, chapters.length, isSyncing, error, user, handleSyncChapters]);

  const handleSyncChapters = React.useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setError(null);
    
    // We'll use a promise toast to show progress
    const syncPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch('/api/chapters/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || "Failed to sync chapters");
        }
        
        // Check if there was actually anything to sync
        if (data.message && (data.message.includes("already processed") || data.message.includes("No meaningful messages"))) {
           toast.info(data.message);
        }
        
        await loadData();
        resolve(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Something went wrong while weaving your story.");
        reject(e);
      }
    });

    toast.promise(syncPromise, {
      loading: 'Conversing with memories...',
      success: 'Your story has been expanded.',
      error: (err) => `Failed: ${err.message}`,
    });

    try {
      await syncPromise;
    } catch (e) {
      // Error handled by catch in syncPromise and toast.promise
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadData]);

  const handleReportIssue = async () => {
    if (!error) return;
    setIsReporting(true);
    try {
      const success = await reportIncident({
        message: error,
        category: 'error',
        metadata: {
          context: 'Chapter Sync Failure',
          chaptersCount: chapters.length
        }
      });
      if (success) {
        toast.success("Log sent to developers. We'll fix this.");
      } else {
        toast.error("Cloud connection failed.");
      }
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Soul';

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center">
        <div className="space-y-8 max-w-sm">
          <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <p className="text-rose-500 font-serif italic text-lg mb-2">{error}</p>
            <p className="text-white/30 text-xs leading-relaxed">
              We encountered a glitch while gathering your memories. You can try again or let the developers know.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setError(null); loadData(); }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-serif italic transition-all border border-white/5"
            >
              Try Again
            </button>
            <button 
              disabled={isReporting}
              onClick={handleReportIssue}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all disabled:opacity-50"
            >
              {isReporting ? "Sending log..." : "Report to Developer"} <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto pt-32 pb-48 px-10 relative">
        <button 
          onClick={() => setActiveView('chat')}
          className="absolute top-8 left-10 p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center space-y-12">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 glass-surface"
          >
            <BookOpen className="w-8 h-8 text-white/20" />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-serif italic text-white/40 tracking-tight">
              {isSyncing ? "Weaving your memories..." : "Your story is waiting to be written."}
            </h2>
            <p className="text-white/20 max-w-xs mx-auto leading-relaxed font-serif italic text-sm">
              {isSyncing 
                ? "WinDear is currently translating your thoughts into chapters." 
                : "Just share your thoughts in the sanctuary, and your book will write itself."}
            </p>
          </div>

          {!isSyncing && (
            <div className="flex flex-col gap-8 items-center pt-8">
              <button
                onClick={handleSyncChapters}
                className="text-[10px] uppercase tracking-[0.4em] text-white/30 hover:text-white/60 transition-colors border-b border-white/10 pb-1"
              >
                Manual Sync
              </button>

              {profile && (
                <button 
                  onClick={() => {
                    setViewState('reader');
                    setSelectedChapterId('mirror');
                  }}
                  className="flex items-center justify-center gap-2 text-white/10 hover:text-white/30 text-[10px] uppercase tracking-widest transition-colors mx-auto"
                >
                  Enter the Sanctuary Mirror
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'cover' && coverData) {
    return (
      <div className="max-w-[1200px] mx-auto py-20 px-6">
        <LifeBookCover 
          data={coverData} 
          userName={userDisplayName} 
          onOpen={() => setViewState('reader')} 
        />
        <div className="mt-12 flex justify-center">
           <button 
            onClick={() => setActiveView('chat')}
            className="group flex flex-col items-center gap-4 text-white/20 hover:text-white/40 transition-colors"
           >
             <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
               <X className="w-4 h-4" />
             </div>
             <span className="text-[9px] uppercase tracking-[0.4em] font-medium">Return to Sanctuary</span>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <button
            onClick={handleSyncChapters}
            disabled={isSyncing}
            className="p-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-full transition-colors disabled:opacity-50"
            title="Sync Latest Chapters"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <StoryReader 
        chapters={chapters} 
        volumes={volumes}
        onBack={() => setViewState('cover')} 
        initialChapterId={selectedChapterId}
        coverData={coverData}
        userName={userDisplayName}
        profile={profile}
        onProfileUpdate={setProfile}
        initialStage="index"
      />
    </div>
  );
};

