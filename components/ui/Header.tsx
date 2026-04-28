'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const pathname = usePathname();
  const { isInputFocused, activeView, activeLibraryTab, setActiveLibraryTab, activeProfileTab, setActiveProfileTab } = useUIStore();

  const isLibrary = pathname === '/library';

  return (
    <>
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-0 z-[70] pointer-events-none flex justify-center items-center px-4 w-full"
          >
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


