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

            <div className="flex-1 overflow-y-auto px-4 space-y-6 py-2">
              {/* Primary Navigation */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageSquare },
                  { id: 'journal', label: 'Journal', icon: PenLine },
                  { id: 'story', label: 'LifeBook', icon: BookOpen },
                ].map((nav) => (
                  <button
                    key={nav.id}
                    onClick={() => {
                      setActiveView(nav.id as any);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <nav.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-white/60">{nav.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Switcher */}
              <div className="flex p-1 bg-white/5 rounded-xl gap-1">
                <button 
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white/50'}`}
                >
                  <MessageSquare className="w-3 h-3" /> CONVERSATIONS
                </button>
                <button 
                  onClick={() => setActiveTab('reflections')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'reflections' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white/50'}`}
                >
                  <History className="w-3 h-3" /> REFLECTIONS
                </button>
              </div>

              {activeTab === 'chats' ? (
                /* Chat History Section */
                <div className="space-y-6">
                  {/* Persona Insights Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h4 className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mb-2 flex items-center gap-1.5">
                      <Heart className="w-2.5 h-2.5" /> Who You Are (Insights)
                    </h4>
                    <p className="text-xs text-slate-300 italic leading-relaxed font-serif">
                      {profile?.personality_summary || "WinDear is still listening and learning the patterns of your soul..."}
                    </p>
                  </motion.div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold">Recent</h3>
                    <button 
                      onClick={() => {
                        setActiveView('chat');
                        router.push('/home');
                        onClose();
                      }}
                      className="text-[10px] font-bold text-white/50 hover:text-white/90 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New Chat
                    </button>
                  </div>
                  <div className="space-y-1">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveView('chat');
                          router.push(`/home?session=${session.id}`);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-white/70 shrink-0" />
                        <span className="text-sm text-slate-400 group-hover:text-slate-200 line-clamp-1">
                          {session.title || 'Untitled Session'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
                /* Reflections/Journal History Section */
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Memories</h3>
                    <button 
                      onClick={() => {
                        setSelectedJournalContent(null);
                        setActiveView('journal');
                        onClose();
                      }}
                      className="text-[10px] font-bold text-white/50 hover:text-white/90 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New Entry
                    </button>
                  </div>
                  <div className="space-y-1">
                    {diaryEntries.length > 0 ? (
                      diaryEntries.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => {
                            setSelectedJournalContent(entry.content);
                            setActiveView('journal');
                            onClose();
                          }}
                          className="w-full flex flex-col p-3 rounded-xl hover:bg-white/5 transition-all text-left group gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <PenLine className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                              {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 group-hover:text-slate-200 line-clamp-2 leading-relaxed">
                            {entry.content || 'Empty reflection...'}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-600 font-medium">No moments saved yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
