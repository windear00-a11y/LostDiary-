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
  const { isInputFocused, activeView, setActiveView, activeProfileTab, setActiveProfileTab, setIsHistoryOpen } = useUIStore();

  const isHomeSanctuary = pathname === '/home' && ['chat'].includes(activeView);
  const isHomeChronicles = pathname === '/home' && ['timeline'].includes(activeView);

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
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={handleNewChat}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-[var(--color-accent-amber)] hover:border-[var(--color-accent-amber)]/30 transition-all shadow-lg active:scale-95 group"
                    title="New Reflection"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  </button>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-amber-400 hover:border-amber-400/30 transition-all shadow-lg active:scale-95"
                    title="Reflection History"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {isHomeChronicles && (
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[var(--color-secondary-text-dark)] hover:text-amber-400 hover:border-amber-400/30 transition-all shadow-lg active:scale-95"
                    title="Chronicles History"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
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


