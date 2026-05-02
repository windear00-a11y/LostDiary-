'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

import { Plus, History, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isInputFocused, activeView, setActiveView, activeLibraryTab, setActiveLibraryTab, activeProfileTab, setActiveProfileTab, setIsHistoryOpen } = useUIStore();

  const isLibrary = pathname === '/library';
  const isHomeSanctuary = pathname === '/home' && ['chat', 'journal'].includes(activeView);
  const isHomeChronicles = pathname === '/home' && ['story', 'reflect'].includes(activeView);

  const handleNewChat = () => {
    router.push('/home?session=new');
  };

  return (
    <>
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-0 z-[70] pointer-events-none flex justify-center items-center px-4 w-full gap-2"
          >
            {isHomeSanctuary && (
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'chat'
                        ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Whisper
                  </button>
                  <button
                    onClick={() => setActiveView('journal')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'journal'
                        ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Soul
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={handleNewChat}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-[var(--color-accent-amber)] hover:border-[var(--color-accent-amber)]/30 transition-all shadow-lg active:scale-95 group"
                    title="New Sanctuary"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  </button>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-amber-400 hover:border-amber-400/30 transition-all shadow-lg active:scale-95"
                    title="Sanctuary History"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {isHomeChronicles && (
              <div className="flex items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setActiveView('chat')}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all hover:bg-white/10 active:scale-95"
                  title="Return to Sanctuary"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setActiveView('story')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'story'
                        ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Journey
                  </button>
                  <button
                    onClick={() => setActiveView('reflect')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'reflect'
                        ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Insights
                  </button>
                </div>
              </div>
            )}

            {isLibrary && (
              <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">
                <button
                  onClick={() => setActiveLibraryTab('feed')}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeLibraryTab === 'feed'
                      ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Flow
                </button>
                <button
                  onClick={() => setActiveLibraryTab('echoes')}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeLibraryTab === 'echoes'
                      ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Signals
                </button>
              </div>
            )}

            {pathname === '/profile' && (
               <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">
                 <button
                   onClick={() => setActiveProfileTab('identity')}
                   className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'identity'
                       ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Presence
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('mirror')}
                   className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'mirror'
                       ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Mirror
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('vault')}
                   className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'vault'
                       ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Trust
                 </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


