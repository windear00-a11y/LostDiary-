'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, History, Book, PenLine, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { coreService, ChatSession, DiaryEntry } from '@/lib/services/core-service';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export const HistoryDrawer = () => {
  const { isHistoryOpen, setIsHistoryOpen, setActiveView, setSelectedJournalContent, setSelectedJournalEntryId, activeView } = useUIStore();
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isJournalMode = activeView === 'journal' || activeView === 'reflect';

  useEffect(() => {
    if (isHistoryOpen && user) {
      setIsLoading(true);
      if (isJournalMode) {
        coreService.fetchDiaryEntries(user.id)
          .then(setDiaryEntries)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        coreService.fetchSessions(user.id)
          .then(setSessions)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
    }
  }, [isHistoryOpen, user, isJournalMode]);

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
  const stripHtml = (html: string) => {
    if (!html) return '';
    // Strip tags and clean up common entities
    let text = html.replace(/<[^>]*>?/gm, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    return text.trim();
  };

  const renderStatus = (status?: string) => {
    switch(status) {
        case 'woven': 
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Book className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Book Chapter</span>
            </div>
          );
        case 'observed': 
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Life Event</span>
            </div>
          );
        case 'saved':
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Saved</span>
            </div>
          );
        case 'pending':
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Processing</span>
            </div>
          );
        case 'error':
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Shadow Blur</span>
            </div>
          );
        default: 
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-40">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Fragment</span>
            </div>
          );
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
            className="fixed top-24 bottom-24 inset-x-4 md:inset-x-auto md:left-[30%] md:right-[30%] z-[101] bg-[#111] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="space-y-1">
                <h2 className="text-xl font-serif italic text-amber-500">
                  {isJournalMode ? 'Reflections Archive' : 'Whispers Archive'}
                </h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  {isJournalMode ? 'Past Journal Entries' : 'Previous Conversations'}
                </p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none text-left">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full" 
                    />
                    <p className="text-[10px] text-white/30 font-serif italic tracking-widest uppercase">Consulting Archive...</p>
                  </div>
                ) : !isJournalMode ? (
                  sessions.length > 0 ? sessions.map(session => (
                    <button key={session.id} onClick={() => { setActiveView('chat'); router.push(`/home?session=${session.id}`); setIsHistoryOpen(false); }} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-amber-100 font-serif italic text-sm mb-1 truncate">{session.title || 'Untitled Whisper'}</p>
                            <p className="text-[10px] text-white/40">{timeAgo(session.created_at)}</p>
                        </div>
                        {renderStatus(session.processing_status)}
                    </button>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                       <MessageSquare className="w-8 h-8 text-white/5 mb-2" />
                       <p className="text-white/30 text-xs font-serif italic">Purani baatchit yahan maujood nahi...</p>
                       <p className="text-[10px] text-white/10 uppercase tracking-widest">No whispers found in this realm</p>
                    </div>
                  )
                ) : (
                  diaryEntries.length > 0 ? diaryEntries.map(entry => (
                    <button key={entry.id} onClick={() => { setSelectedJournalContent(entry.content); setSelectedJournalEntryId(entry.id); setActiveView('journal'); setIsHistoryOpen(false); }} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-emerald-100 font-serif italic line-clamp-2 text-sm mb-1">{stripHtml(entry.content).replace(/^# .*\n\n/, '')}</p>
                            <p className="text-[10px] text-white/40">{timeAgo(entry.created_at)}</p>
                        </div>
                        {renderStatus(entry.processing_status)}
                    </button>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                       <PenLine className="w-8 h-8 text-white/5 mb-2" />
                       <p className="text-white/30 text-xs font-serif italic">Abhi tak koi ehsaas sanware nahi gaye...</p>
                       <p className="text-[10px] text-white/10 uppercase tracking-widest">Your reflections are silent</p>
                    </div>
                  )
                )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
