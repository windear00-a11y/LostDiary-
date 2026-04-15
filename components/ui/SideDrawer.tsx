'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Settings, Book, LogOut, Heart, Search, 
  Sparkles, BookOpen, PenLine, History, ChevronRight,
  Plus, MessageSquare, Wand2, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { chatService, ChatSession } from '@/lib/services/chat-service';
import { ALLOWED_CHAPTERS } from '@/lib/utils/chapters';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      chapterService.fetchChapters(user.id).then(setChapters);
      chatService.fetchSessions(user.id).then(setSessions);
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
          const newTitle = await chatService.generateSessionTitle(user.id, session.id);
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

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[300px] bg-[#fdfcfb] dark:bg-[#0d0d0d] z-[70] shadow-2xl flex flex-col border-r border-gray-100 dark:border-white/5"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Book className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif italic text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">WinDear</span>
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
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      router.push(action.path);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:scale-[1.02] transition-all shadow-sm"
                  >
                    <div className={`w-10 h-10 ${action.bg} rounded-full flex items-center justify-center`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Chat History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold">चैट हिस्ट्री</h3>
                    <button 
                      onClick={handleGenerateTitles}
                      disabled={isGeneratingTitles}
                      className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors group relative"
                      title="Generate titles for all chats"
                    >
                      {isGeneratingTitles ? (
                        <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      )}
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      router.push('/home');
                      onClose();
                    }}
                    className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> नई चैट
                  </button>
                </div>
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        router.push(`/home?session=${session.id}`);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-left group"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 font-serif italic">
                        {session.title}
                      </span>
                    </button>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-[10px] text-slate-500 italic px-2">अभी कोई चैट हिस्ट्री नहीं है...</p>
                  )}
                </div>
              </div>

              {/* Chapters Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold">अध्याय (Chapters)</h3>
                  <button className="text-[10px] font-bold text-indigo-500 hover:underline">सभी देखें</button>
                </div>
                <div className="space-y-1">
                  {ALLOWED_CHAPTERS.map((chapterName) => {
                    const hasData = chapters.some(c => c.name === chapterName);
                    return (
                      <button
                        key={chapterName}
                        onClick={() => {
                          router.push('/story');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                          <span className={`text-sm font-serif italic ${hasData ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                            {chapterName}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold px-2">हालिया यादें (Recent)</h3>
                <div className="space-y-1">
                  {chapters.slice(0, 3).map((chapter) => (
                    <button
                      key={chapter.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-left group"
                    >
                      <History className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 font-serif italic">
                        {chapter.summary || `${chapter.name} की कहानी...`}
                      </span>
                    </button>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-[10px] text-slate-500 italic px-2">अभी कोई यादें नहीं हैं...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => {
                  router.push('/home');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                नई याद लिखें (New Entry)
              </button>

              <div className="flex items-center gap-2 p-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 relative">
                  {user?.email ? (
                    <Image 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="avatar" 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Premium Member</p>
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-rose-500"
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
