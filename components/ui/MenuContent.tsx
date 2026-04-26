'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Book, Sparkles, BookOpen, PenLine, History, 
  Plus, MessageSquare, Compass, Feather
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useUIStore } from '@/lib/store/use-ui-store';
import { coreService, ChatSession, DiaryEntry } from '@/lib/services/core-service';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MenuContentProps {
  onClose: () => void;
  isOpen: boolean;
}

export const MenuContent = ({ onClose, isOpen }: MenuContentProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { activeView, setActiveView, setSelectedJournalContent } = useUIStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'reflections'>('chats');

  useEffect(() => {
    if (isOpen && user) {
      coreService.fetchSessions(user.id).then(setSessions).catch(console.error);
      coreService.fetchDiaryEntries(user.id).then(setDiaryEntries).catch(console.error);
    }
  }, [isOpen, user]);

  return (
    <>
      {/* Header */}
      <div className="pt-8 pb-6 px-6 flex items-start justify-between relative z-10 w-full">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Compass className="w-6 h-6" />
            <span className="font-serif italic text-2xl font-bold tracking-tight text-white drop-shadow-md">Windear</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-indigo-500/50 ml-8">Archive & Soul</div>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4 scrollbar-none relative z-10">
        
        {/* 4 Feature Modes Quick Access */}
        <div className="grid grid-cols-4 gap-2 px-1 mb-2 border-b border-white/5 pb-6">
          <button onClick={() => { setActiveView('chat'); router.push('/home'); onClose(); }} className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeView === 'chat' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-transparent hover:border-white/10'}`}>
               <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 group-hover:text-slate-300">Whisper</span>
          </button>
          
          <button onClick={() => { setActiveView('journal'); router.push('/home'); onClose(); }} className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeView === 'journal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-transparent hover:border-white/10'}`}>
               <PenLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 group-hover:text-slate-300">Journal</span>
          </button>

          <button onClick={() => { setActiveView('story'); router.push('/home'); onClose(); }} className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeView === 'story' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-transparent hover:border-white/10'}`}>
               <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 group-hover:text-slate-300">Story</span>
          </button>

          <button onClick={() => { setActiveView('reflect'); router.push('/home'); onClose(); }} className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeView === 'reflect' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-transparent hover:border-white/10'}`}>
               <Compass className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 group-hover:text-slate-300">Reflect</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-[#0a0a0a] rounded-2xl gap-1 border border-white/5">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === 'chats' ? 'bg-indigo-600/20 text-indigo-300 shadow-sm border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MessageSquare className="w-3 h-3" /> WHISPERS
          </button>
          <button 
            onClick={() => setActiveTab('reflections')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === 'reflections' ? 'bg-indigo-600/20 text-indigo-300 shadow-sm border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <History className="w-3 h-3" /> MEMORIES
          </button>
        </div>

        {/* Lists */}
        <div className="space-y-2">
          {activeTab === 'chats' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-500 text-indigo-500/40">Active Threads</span>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setActiveView('chat');
                    router.push('/home?session=new');
                    onClose();
                  }}
                  className="p-1.5 hover:bg-indigo-500/10 rounded-full transition-colors text-indigo-400"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="space-y-1.5">
                {sessions.slice(0, 5).map((session) => (
                  <motion.button
                    key={session.id}
                    whileHover={{ x: 6, backgroundColor: "rgba(99,102,241,0.05)" }}
                    onClick={() => {
                      setActiveView('chat');
                      router.push(`/home?session=${session.id}`);
                      onClose();
                    }}
                    className="w-full flex flex-col gap-1 p-3.5 rounded-2xl transition-all text-left group border border-transparent hover:border-indigo-500/10"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 group-hover:bg-indigo-400 transition-colors shrink-0 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                       <span className="text-sm text-indigo-100/60 group-hover:text-indigo-100 font-serif italic line-clamp-1 flex-1 transition-colors">
                         {session.title || 'An untitled whisper...'}
                       </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-500 text-indigo-500/40">Sealed Thoughts</span>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedJournalContent(null);
                    setActiveView('journal');
                    onClose();
                  }}
                  className="p-1.5 hover:bg-emerald-500/10 rounded-full transition-colors text-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="space-y-2">
                {diaryEntries.length > 0 ? (
                  diaryEntries.slice(0, 5).map((entry) => (
                    <motion.button
                      key={entry.id}
                      whileHover={{ x: 6, backgroundColor: "rgba(16,185,129,0.05)" }}
                      onClick={() => {
                        setSelectedJournalContent(entry.content);
                        setActiveView('journal');
                        onClose();
                      }}
                      className="w-full flex flex-col p-4 rounded-2xl transition-all text-left group gap-2 border border-transparent hover:border-emerald-500/10 bg-white/[0.01]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-emerald-500/50 font-bold uppercase tracking-widest">
                            {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <PenLine className="w-3.5 h-3.5 text-emerald-500/20 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-emerald-100/80 line-clamp-2 leading-relaxed font-serif italic transition-colors">
                        &ldquo;{entry.content || 'Empty reflection...'}&rdquo;
                      </p>
                    </motion.button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Book className="w-6 h-6 text-emerald-500/20 mx-auto mb-2" />
                    <span className="text-xs font-serif italic text-slate-500">No memories sealed yet</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};
