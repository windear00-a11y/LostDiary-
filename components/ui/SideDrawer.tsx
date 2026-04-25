'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Settings, Book, LogOut, Heart, Search, 
  Sparkles, BookOpen, PenLine, History, ChevronRight,
  Plus, MessageSquare, Wand2, Languages, Compass, Feather, Fingerprint
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';
import { coreService, Chapter, ChatSession, DiaryEntry } from '@/lib/services/core-service';
import { ALLOWED_CHAPTERS } from '@/lib/utils/chapters';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setActiveView, setSelectedJournalContent } = useUIStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'reflections'>('chats');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user) {
      coreService.fetchChapters(user.id).then(setChapters);
      coreService.fetchSessions(user.id).then(setSessions);
      coreService.fetchDiaryEntries(user.id).then(setDiaryEntries);
      coreService.getProfile(user.id).then(setProfile);
    }
  }, [isOpen, user]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Deep Ethereal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020202]/80 backdrop-blur-md z-[60]"
          >
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%', borderTopRightRadius: '100px', borderBottomRightRadius: '100px' }}
            animate={{ x: 0, borderTopRightRadius: '32px', borderBottomRightRadius: '32px' }}
            exit={{ x: '-100%', borderTopRightRadius: '100px', borderBottomRightRadius: '100px' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-[#050505] z-[70] shadow-[30px_0_60px_rgba(0,0,0,0.8)] flex flex-col border-r border-indigo-500/20 overflow-hidden"
          >
            {/* Background Texture in Drawer */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-screen pointer-events-none" />
            
            {/* Header */}
            <div className="pt-8 pb-6 px-6 flex items-start justify-between relative z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Compass className="w-6 h-6" />
                  <span className="font-serif italic text-2xl font-bold tracking-tight text-white drop-shadow-md">Windear</span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-indigo-500/50 ml-8">Archive & Soul</div>
              </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors ml-1 text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4 scrollbar-none relative z-10">
              {/* Identity & Insights Card - Mystical Bento */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                <div className="absolute bottom-0 right-0 p-4 opacity-[0.05] group-hover:opacity-20 transition-opacity duration-700">
                  <Fingerprint className="w-16 h-16 text-indigo-400" />
                </div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    <Heart className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">Soul Resonance</h4>
                </div>
                
                <p className="text-sm text-indigo-100/80 leading-relaxed font-serif italic mb-5 relative z-10">
                  {profile?.personality_summary || "The pages are forming. Your unique essence is still being transcribed into the stars..."}
                </p>
                
                <div className="flex flex-wrap gap-2 relative z-10">
                  {profile?.life_themes?.slice(0, 3)?.map((theme: string, i: number) => (
                    <span key={i} className="text-[8px] px-2.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 uppercase tracking-[0.1em] font-bold shadow-sm">{theme}</span>
                  ))}
                  {(!profile?.life_themes || profile.life_themes.length === 0) && (
                     <span className="text-[8px] px-2.5 py-1 rounded-full border border-slate-700 bg-white/5 text-slate-400 uppercase tracking-[0.1em] font-bold">Gathering Threads...</span>
                  )}
                </div>
              </motion.div>

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
                          router.push('/home');
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
                          <div className="pl-4 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            {session.processing_status === 'woven' && (
                              <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-400">Deep Thread</span>
                            )}
                            {session.processing_status === 'saved' && (
                              <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-indigo-400">Vital Echo</span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                      {sessions.length === 0 && (
                        <div className="py-12 text-center">
                          <Feather className="w-6 h-6 text-indigo-500/20 mx-auto mb-2" />
                          <span className="text-xs font-serif italic text-slate-500">No whispers yet</span>
                        </div>
                      )}
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

            {/* Bottom Profile Area */}
            <div className="p-6 border-t border-white/5 bg-[#030303] relative z-10 w-full mt-auto">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 group hover:border-indigo-400 transition-colors cursor-pointer relative overflow-hidden">
                     <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <User className="w-5 h-5 text-indigo-300 relative z-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col truncate">
                     <span className="text-xs font-bold text-white uppercase tracking-wider truncate drop-shadow-md">{user?.email?.split('@')[0] || 'Wanderer'}</span>
                     <span className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest">Soul Author</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="p-2.5 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Sever Connection"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
