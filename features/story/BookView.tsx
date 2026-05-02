'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowLeft, X, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { coreService, Chapter, Volume, UserProfile } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useAuth } from '@/components/auth/AuthProvider';
import { StoryReader } from './StoryReader';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { LifeBookCover } from './LifeBookCover';
import { toast } from 'sonner';
import { reportIncident } from '@/lib/utils/telemetry';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 1. Helper Components
function SkeletonLoader() {
  return (
    <div className="max-w-[700px] mx-auto pt-40 px-6">
      <LoadingSpace message="Assembling your narrative..." />
    </div>
  );
}

// 2. Interfaces
interface BookContentProps {
  user: any;
  chapters: Chapter[];
  volumes: Volume[];
  error: string | null;
  profile: UserProfile | null;
  isSyncing: boolean;
  isReporting: boolean;
  viewState: 'cover' | 'toc' | 'reader';
  coverData: any;
  selectedChapterId: string | null;
  setViewState: (s: 'cover' | 'toc' | 'reader') => void;
  setSelectedChapterId: (s: string | null) => void;
  handleSyncChapters: () => void;
  handleReportIssue: () => void;
  setError: (s: string | null) => void;
  loadData: (isInitial?: boolean) => void;
  setProfile: (p: UserProfile | null) => void;
}

// 3. Sub-components
function BookContent({
  user,
  chapters,
  volumes,
  error,
  profile,
  isSyncing,
  isReporting,
  viewState,
  coverData,
  selectedChapterId,
  setViewState,
  setSelectedChapterId,
  handleSyncChapters,
  handleReportIssue,
  setError,
  loadData,
  setProfile
}: BookContentProps) {
  const { setActiveView } = useUIStore();
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

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 h-[100dvh] bg-[#FDFCF8] dark:bg-[#0A0A0A] z-[60] flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100">
      <AnimatePresence mode="wait">
        {viewState === 'cover' && coverData ? (
          <motion.div 
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1200px] mx-auto py-20 px-6 flex-1 overflow-y-auto"
          >
            <LifeBookCover 
              data={coverData} 
              userName={userDisplayName} 
              onOpen={() => setViewState('reader')} 
            />
            <div className="mt-12 flex justify-center pb-12">
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
          </motion.div>
        ) : (
          <motion.div 
            key="reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 relative"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 4. Main Component
export function BookView() {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openingText, setOpeningText] = useState<string | null>(null);
  const [coverData, setCoverData] = useState<{ title: string; summary: string; aura: string } | null>(null);
  const [viewState, setViewState] = useState<'cover' | 'toc' | 'reader'>('cover');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const syncAttemptedRef = useRef(false);
  const { setActiveView } = useUIStore();

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const currentUser = await authService.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      console.log("BookView: Loading data for user", currentUser.id);
      const [chaptersData, volumesData, profileData] = await Promise.all([
        coreService.fetchChapters(currentUser.id),
        coreService.fetchVolumes(currentUser.id),
        coreService.getProfile(currentUser.id)
      ]);
      
      setChapters(chaptersData || []);
      setVolumes(volumesData || []);
      setProfile(profileData || null);

      if (volumesData && volumesData.length > 0) {
        const currentVolume = volumesData[0];
        setOpeningText(currentVolume.prologue || "Your story unfolds...");
        setCoverData({
          title: currentVolume.title || "The Story So Far",
          summary: currentVolume.epigraph || "A journey through time, captured in memory.",
          aura: currentVolume.aura || "Midnight Indigo"
        });
      } else if (chaptersData && chaptersData.length > 0) {
        setOpeningText("Your story unfolds...");
        setCoverData({
          title: "Chapters of the Heart",
          summary: "A journey through time, captured in memory.",
          aura: "Midnight Indigo"
        });
      }
    } catch (err: any) {
      console.error("BookView: Failed to load data", err);
      setError(`Failed to load your LifeBook: ${err.message || 'Check your connection'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncChapters = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setError(null);
    
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
      error: (err: any) => `Failed: ${err?.message || 'Sync failed'}`,
    });

    try {
      await syncPromise;
    } catch (e) {
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadData]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      loadData(true);
    }
  }, [loadData, isHydrated]);

  useEffect(() => {
    if (isHydrated && !loading && chapters.length === 0 && !isSyncing && !error && user && !syncAttemptedRef.current) {
      console.log("BookView: Auto-syncing chapters...");
      syncAttemptedRef.current = true;
      handleSyncChapters();
    }
  }, [isHydrated, loading, chapters.length, isSyncing, error, user, handleSyncChapters]);

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

  if (!isHydrated || (loading && chapters.length === 0)) {
    return <SkeletonLoader />;
  }

  return (
    <ErrorBoundary fallback={
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center bg-[#FDFCF8] dark:bg-[#0A0A0A]">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-6" />
        <h2 className="text-2xl font-serif italic text-slate-800 dark:text-zinc-100 mb-4">A shadow crossed the page...</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-8 italic">Even the most beautiful manuscripts have smudges. We&apos;ve logged the issue and are ready to try again.</p>
        <button 
          onClick={() => { window.location.reload(); }}
          className="px-8 py-4 bg-amber-500 text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          Refresh Sanctuary
        </button>
      </div>
    }>
      <BookContent 
        user={user}
        chapters={chapters}
        volumes={volumes}
        error={error}
        profile={profile}
        isSyncing={isSyncing}
        isReporting={isReporting}
        viewState={viewState}
        coverData={coverData}
        selectedChapterId={selectedChapterId}
        setViewState={setViewState}
        setSelectedChapterId={setSelectedChapterId}
        handleSyncChapters={handleSyncChapters}
        handleReportIssue={handleReportIssue}
        setError={setError}
        loadData={loadData}
        setProfile={setProfile}
      />
    </ErrorBoundary>
  );
}
