'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

import { Plus, History } from 'lucide-react';
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
              <>
                <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'chat'
                        ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Whisper
                  </button>
                  <button
                    onClick={() => setActiveView('journal')}
                    className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                      activeView === 'journal'
                        ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                        : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                    }`}
                  >
                    Write
                  </button>
                </div>
                
                <button
                  onClick={handleNewChat}
                  className="pointer-events-auto w-9 h-9 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-[var(--color-accent-amber)] hover:border-[var(--color-accent-amber)]/30 transition-all shadow-lg active:scale-90"
                  title="New Reflection"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="pointer-events-auto w-9 h-9 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-amber-400 hover:border-amber-400/30 transition-all shadow-lg active:scale-90"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                </button>
              </>
            )}

            {isHomeChronicles && (
              <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto">
                <button
                  onClick={() => setActiveView('story')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeView === 'story'
                      ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Journey
                </button>
                <button
                  onClick={() => setActiveView('reflect')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeView === 'reflect'
                      ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Insights
                </button>
              </div>
            )}

            {isLibrary && (
              <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto">
                <button
                  onClick={() => setActiveLibraryTab('feed')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeLibraryTab === 'feed'
                      ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Global Feed
                </button>
                <button
                  onClick={() => setActiveLibraryTab('echoes')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeLibraryTab === 'echoes'
                      ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                      : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                  }`}
                >
                  Soul Signals
                </button>
              </div>
            )}

            {pathname === '/profile' && (
               <div className="flex bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto">
                 <button
                   onClick={() => setActiveProfileTab('identity')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'identity'
                       ? 'bg-white/10 text-[var(--color-primary-text-dark)]'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Identity
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('mirror')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'mirror'
                       ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Mirror
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('vault')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${
                    activeProfileTab === 'vault'
                       ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                       : 'text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)]'
                   }`}
                 >
                   Vault
                 </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


