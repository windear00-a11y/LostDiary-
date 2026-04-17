'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Settings, Book, LogOut, Heart, Search, 
  Sparkles, BookOpen, PenLine, History, ChevronRight,
  Plus, MessageSquare, Wand2
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';
import { coreService, Chapter, ChatSession } from '@/lib/services/core-service';
import { ALLOWED_CHAPTERS } from '@/lib/utils/chapters';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setActiveView } = useUIStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      coreService.fetchChapters(user.id).then(setChapters);
      coreService.fetchSessions(user.id).then(setSessions);
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
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <Search className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-8 py-2">
              {/* Chat History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold">History</h3>
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
                        <span className="text-xs text-slate-400 line-clamp-1">
                          {session.title || 'Untitled Session'}
                        </span>
                      </button>
                     ))}
                  </div>
              </div>
            </div>

            {/* Footer */}
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
