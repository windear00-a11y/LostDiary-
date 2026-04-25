'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, MessageSquare, Feather, Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isInputFocused, activeView, setActiveView, isDrawerOpen, setIsDrawerOpen, activeLibraryTab, setActiveLibraryTab } = useUIStore();

  const [displayMode, setDisplayMode] = useState<'idle' | 'switching'>('idle');

  const isLibrary = pathname === '/library';

  const handleToggle = () => {
    setDisplayMode('switching');
    setTimeout(() => {
      if (isLibrary) {
        setActiveLibraryTab(activeLibraryTab === 'feed' ? 'echoes' : 'feed');
      } else {
        setActiveView(activeView === 'chat' ? 'journal' : 'chat');
      }
      setDisplayMode('idle');
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-0 z-[70] pointer-events-none flex justify-end items-center px-4"
          >
            {/* Right Toggle Button */}
            {(isLibrary || activeView === 'chat' || activeView === 'journal') ? (
              <motion.button
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                whileTap={displayMode === 'idle' ? { scale: 0.95 } : undefined}
                onClick={handleToggle}
                disabled={displayMode === 'switching'}
                className={`flex items-center gap-3 px-6 py-2 rounded-full border shadow-xl backdrop-blur-3xl pointer-events-auto transition-all duration-300 group ${
                  displayMode === 'switching'
                    ? 'bg-amber-900/30 border-amber-500/30 text-amber-300'
                    : isLibrary
                      ? (activeLibraryTab === 'feed'
                          ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300 hover:bg-indigo-800/40'
                          : 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40')
                      : (activeView === 'chat'
                          ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40'
                          : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300 hover:bg-indigo-800/40')
                }`}
                title={isLibrary ? (activeLibraryTab === 'feed' ? 'Switch to Soul Signals' : 'Switch to Feed') : (activeView === 'chat' ? 'Switch to Deep Weave' : 'Switch to Whispers')}
              >
                  <AnimatePresence mode="wait">
                    {displayMode === 'switching' ? (
                      <motion.div 
                        key="switching"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="flex items-center gap-2"
                      >
                        {isLibrary 
                          ? (activeLibraryTab === 'feed' ? <MessageSquare className="w-4 h-4" /> : <Globe className="w-4 h-4" />)
                          : (activeView === 'chat' ? <Feather className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />)
                        }
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Switching to {isLibrary 
                            ? (activeLibraryTab === 'feed' ? 'Soul Signals' : 'Global Feed')
                            : (activeView === 'chat' ? 'Deep Weave' : 'Whispers')}
                        </span>
                      </motion.div>
                    ) : isLibrary ? (
                      activeLibraryTab === 'feed' ? (
                        <motion.div key="feed" className="flex items-center gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                          <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Global Feed</span>
                        </motion.div>
                      ) : (
                        <motion.div key="echoes" className="flex items-center gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Soul Signals</span>
                        </motion.div>
                      )
                    ) : activeView === 'chat' ? (
                      <motion.div key="chat" className="flex items-center gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <Feather className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Deep Weave</span>
                      </motion.div>
                    ) : (
                      <motion.div key="journal" className="flex items-center gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Whispers</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.button>
            ) : (
              <div className="w-10 h-10 shrink-0" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};


