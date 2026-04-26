'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const pathname = usePathname();
  const { isInputFocused, activeView, activeLibraryTab, setActiveLibraryTab, activeProfileTab, setActiveProfileTab } = useUIStore();

  const isLibrary = pathname === '/library';
  const isHome = pathname === '/home';

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
              <div className="flex bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-lg pointer-events-auto">
                <button
                  onClick={() => setActiveLibraryTab('feed')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeLibraryTab === 'feed'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Global Feed
                </button>
                <button
                  onClick={() => setActiveLibraryTab('echoes')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeLibraryTab === 'echoes'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Soul Signals
                </button>
              </div>
            )}

            {isHome && (
               <div className="pointer-events-none px-6 py-2 rounded-full border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md shadow-sm">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#E0E0E0]">
                    {activeView === 'chat' ? 'Whispers' : activeView === 'journal' ? 'Journal' : activeView === 'story' ? 'Story Canvas' : 'Reflections'}
                 </span>
               </div>
            )}

            {pathname === '/profile' && (
               <div className="flex bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-lg pointer-events-auto">
                 <button
                   onClick={() => setActiveProfileTab('identity')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeProfileTab === 'identity'
                       ? 'bg-white/10 text-white'
                       : 'text-neutral-500 hover:text-neutral-300'
                   }`}
                 >
                   Identity
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('mirror')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeProfileTab === 'mirror'
                       ? 'bg-indigo-500/20 text-indigo-300'
                       : 'text-neutral-500 hover:text-neutral-300'
                   }`}
                 >
                   Mirror
                 </button>
                 <button
                   onClick={() => setActiveProfileTab('vault')}
                   className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeProfileTab === 'vault'
                       ? 'bg-white/10 text-white'
                       : 'text-neutral-500 hover:text-neutral-300'
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


