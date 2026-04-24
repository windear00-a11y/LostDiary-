'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, MessageSquare, Feather } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const router = useRouter();
  const { isInputFocused, activeView, setActiveView, isDrawerOpen, setIsDrawerOpen } = useUIStore();

  const [displayMode, setDisplayMode] = useState<'idle' | 'switching'>('idle');

  const handleToggleView = () => {
    setDisplayMode('switching');
    setTimeout(() => {
      setActiveView(activeView === 'chat' ? 'journal' : 'chat');
      setDisplayMode('idle');
    }, 1500);
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
            {(activeView === 'chat' || activeView === 'journal') ? (
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleView}
                disabled={displayMode === 'switching'}
                className={`flex items-center gap-3 px-6 py-2 rounded-full border shadow-xl backdrop-blur-3xl pointer-events-auto transition-all duration-300 group ${
                  displayMode === 'switching'
                    ? 'bg-amber-900/30 border-amber-500/30 text-amber-300'
                    : (activeView === 'chat'
                        ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40'
                        : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300 hover:bg-indigo-800/40')
                }`}
                title={activeView === 'chat' ? 'Switch to Deep Weave' : 'Switch to Whispers'}
              >
                {displayMode === 'switching' ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    {activeView === 'chat' ? <Feather className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Switching to {activeView === 'chat' ? 'Deep Weave' : 'Whispers'}
                    </span>
                  </motion.div>
                ) : activeView === 'chat' ? (
                  <>
                    <Feather className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Deep Weave</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Whispers</span>
                  </>
                )}
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


