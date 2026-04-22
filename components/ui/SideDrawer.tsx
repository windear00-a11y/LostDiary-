'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Settings, Book, LogOut, Heart, Search, 
  Sparkles, BookOpen, PenLine, History, ChevronRight,
  Plus, MessageSquare, Wand2, Languages
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

  const handleGenerateTitles = async () => {
    if (!user || isGeneratingTitles) return;
    setIsGeneratingTitles(true);
    try {
      const genericSessions = sessions.filter(s => 
        !s.title || 
        s.title === 'New Chat' || 
        s.title.startsWith('Chat ') || 
        s.title.includes(new Date().toLocaleDateString())
      );

      for (const session of genericSessions) {
        try {
          const newTitle = await coreService.generateSessionTitle(user.id, session.id);
          setSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: newTitle } : s));
        } catch (err) {
          console.error(`Failed to generate title for session ${session.id}:`, err);
        }
      }
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const quickActions = [
    { icon: BookOpen, label: 'लाइफबुक', path: '/story', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { icon: Sparkles, label: 'झलक', path: '/story?view=insights', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60]"
          />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[300px] bg-neutral-950 z-[70] shadow-2xl flex flex-col border-r border-white/5"
            >
              {/* Header */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Book className="w-5 h-5 text-white/70" />
                  </div>
                  <span className="font-serif italic text-xl font-bold tracking-tight text-slate-50">WinDear</span>
                </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors ml-1">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-4 py-4 scrollbar-whatsapp">
              {/* Identity & Insights Section (Bento Card Large) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-indigo-400/80 font-bold">Personality Insights</h4>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-serif italic mb-1">
                  {profile?.personality_summary || "WinDear is still listening and learning the patterns of your soul..."}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 opacity-60">
                  {profile?.life_themes?.slice(0, 3).map((theme: string, i: number) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 uppercase tracking-wider">{theme}</span>
                  ))}
                </div>
              </motion.div>

              {/* Primary Navigation Grid (Bento Small Cards) */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'chat', label: 'Input', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/5' },
                  { id: 'journal', label: 'Output', icon: PenLine, color: 'text-amber-400', bg: 'bg-amber-400/5' },
                  { id: 'story', label: 'Legacy', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                  { id: 'library', label: 'Publish', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/5', route: '/library' },
                  { id: 'profile', label: 'Engage', icon: User, color: 'text-rose-400', bg: 'bg-rose-400/5', route: '/profile' },
                  { id: 'bridge', label: 'Connect', icon: Heart, color: 'text-cyan-400', bg: 'bg-cyan-400/5', route: '/profile' },
                ].map((nav) => (
                  <motion.button
                    key={nav.id}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (nav.route) {
                        router.push(nav.route);
                      } else {
                        setActiveView(nav.id as any);
                        router.push('/home'); // Ensure we go home for views
                      }
                      onClose();
                    }}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-3xl ${nav.bg} border border-white/5 transition-all group`}
                  >
                    <nav.icon className={`w-5 h-5 ${nav.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">{nav.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* History / Activity Bento Section */}
              <div className="space-y-3 pt-2">
                <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                  <button 
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> CHATS
                  </button>
                  <button 
                    onClick={() => setActiveTab('reflections')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === 'reflections' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <History className="w-3.5 h-3.5" /> MOMENTS
                  </button>
                </div>

                <div className="space-y-2 bg-white/[0.02] border border-white/5 rounded-[2rem] p-3 min-h-[200px]">
                  {activeTab === 'chats' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">Recent Sessions</span>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            setActiveView('chat');
                            router.push('/home');
                            onClose();
                          }}
                          className="p-1 hover:bg-white/5 rounded-full transition-colors"
                        >
                          <Plus className="w-3 h-3 text-white/40" />
                        </motion.button>
                      </div>
                      <div className="space-y-1">
                        {sessions.slice(0, 5).map((session) => (
                          <motion.button
                            key={session.id}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setActiveView('chat');
                              router.push(`/home?session=${session.id}`);
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left group"
                          >
                            <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-indigo-500/50 transition-colors shrink-0" />
                            <span className="text-sm text-white/40 group-hover:text-white/90 line-clamp-1 flex-1 transition-colors">
                              {session.title || 'Untitled Session'}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {session.processing_status === 'woven' && (
                                <span className="text-[8px] font-sans uppercase tracking-[0.1em] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Deep Resonance
                                </span>
                              )}
                              {session.processing_status === 'saved' && (
                                <span className="text-[8px] font-sans uppercase tracking-[0.1em] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                  Vital Echo
                                </span>
                              )}
                              {session.processing_status === 'observed' && (
                                <span className="text-[8px] font-sans uppercase tracking-[0.1em] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                  Passing Reflection
                                </span>
                              )}
                              <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/30" />
                            </div>
                          </motion.button>
                        ))}
                        {sessions.length === 0 && (
                          <div className="py-10 text-center opacity-20">
                            <span className="text-xs italic">No chats yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">Memory Bank</span>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            setSelectedJournalContent(null);
                            setActiveView('journal');
                            onClose();
                          }}
                          className="p-1 hover:bg-white/5 rounded-full transition-colors"
                        >
                          <Plus className="w-3 h-3 text-white/40" />
                        </motion.button>
                      </div>
                      <div className="space-y-2">
                        {diaryEntries.length > 0 ? (
                          diaryEntries.slice(0, 5).map((entry) => (
                            <motion.button
                              key={entry.id}
                              whileHover={{ x: 4 }}
                              onClick={() => {
                                setSelectedJournalContent(entry.content);
                                setActiveView('journal');
                                onClose();
                              }}
                              className="w-full flex flex-col p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group gap-1.5 border border-transparent hover:border-white/5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                                    {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  {entry.processing_status === 'woven' && (
                                    <span className="text-[7px] uppercase tracking-tighter text-emerald-400/60 font-serif italic">
                                      Deep Resonance
                                    </span>
                                  )}
                                  {entry.processing_status === 'saved' && (
                                    <span className="text-[7px] uppercase tracking-tighter text-indigo-400/60 font-serif italic">
                                      Vital Echo
                                    </span>
                                  )}
                                  {entry.processing_status === 'observed' && (
                                    <span className="text-[7px] uppercase tracking-tighter text-white/20 font-serif italic">
                                      Reflection
                                    </span>
                                  )}
                                </div>
                                <PenLine className="w-3 h-3 text-white/10 group-hover:text-white/40 transition-colors" />
                              </div>
                              <p className="text-xs text-white/50 group-hover:text-white/80 line-clamp-2 leading-relaxed italic">
                                &ldquo;{entry.content || 'Empty reflection...'}&rdquo;
                              </p>
                            </motion.button>
                          ))
                        ) : (
                          <div className="py-10 text-center opacity-20">
                            <span className="text-xs italic">No memories yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 p-2 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.email?.split('@')[0] || 'User'}</p>
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Sign Out"
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
