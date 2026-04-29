'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, History, Book, PenLine } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { coreService, ChatSession, DiaryEntry } from '@/lib/services/core-service';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export const HistoryDrawer = () => {
  const { isHistoryOpen, setIsHistoryOpen, setActiveView, setSelectedJournalContent, activeView } = useUIStore();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chats' | 'reflections'>(activeView === 'journal' ? 'reflections' : 'chats');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setActiveTab(activeView === 'journal' ? 'reflections' : 'chats');
  }, [isHistoryOpen, activeView]);

  useEffect(() => {
    if (isHistoryOpen && user) {
      coreService.fetchSessions(user.id).then(setSessions).catch(console.error);
      coreService.fetchDiaryEntries(user.id).then(setDiaryEntries).catch(console.error);
    }
  }, [isHistoryOpen, user]);

  const timeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const formatStatus = (status?: string) => {
    switch(status) {
        case 'woven': return 'Chapter';
        case 'observed': return 'Event';
        default: return 'Normal';
    }
  };

  return (
    <AnimatePresence>
      {isHistoryOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-12 bottom-12 inset-x-4 md:inset-x-auto md:left-[25%] md:right-[25%] z-[101] bg-[#111] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-serif italic text-amber-500">History</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex p-1 bg-black rounded-xl mb-6 border border-white/5 shrink-0">
                <button onClick={() => setActiveTab('chats')} className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'}`}>Whispers</button>
                <button onClick={() => setActiveTab('reflections')} className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'reflections' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'}`}>Memories</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {activeTab === 'chats' ? (
                  sessions.length > 0 ? sessions.map(session => (
                    <button key={session.id} onClick={() => { setActiveView('chat'); router.push(`/home?session=${session.id}`); setIsHistoryOpen(false); }} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-start">
                        <div>
                            <p className="text-amber-100 font-serif italic text-sm mb-1">{session.title || 'Untitled Whisper'}</p>
                            <p className="text-[10px] text-white/40">{timeAgo(session.created_at)}</p>
                        </div>
                        <span className="text-[10px] text-amber-500/60 font-bold uppercase">{formatStatus(session.processing_status)}</span>
                    </button>
                  )) : <p className="text-white/30 text-center py-10 text-xs font-serif italic">No recent whispers...</p>
                ) : (
                  diaryEntries.length > 0 ? diaryEntries.map(entry => (
                    <button key={entry.id} onClick={() => { setSelectedJournalContent(entry.content); setActiveView('journal'); setIsHistoryOpen(false); }} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-emerald-100 font-serif italic line-clamp-2 text-sm mb-1">{entry.content}</p>
                            <p className="text-[10px] text-white/40">{timeAgo(entry.created_at)}</p>
                        </div>
                        <span className="text-[10px] text-emerald-500/60 font-bold uppercase shrink-0">{formatStatus(entry.processing_status)}</span>
                    </button>
                  )) : <p className="text-white/30 text-center py-10 text-xs font-serif italic">No memories found...</p>
                )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
