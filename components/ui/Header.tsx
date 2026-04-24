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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isInputFocused, activeView, setActiveView } = useUIStore();

  const handleToggleView = () => {
    setActiveView(activeView === 'chat' ? 'journal' : 'chat');
  };

  return (
    <>
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-0 z-[70] pointer-events-none flex justify-between items-center px-4"
          >
            {/* Left Menu Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-10 h-10 rounded-full bg-[#0a0a0a]/80 backdrop-blur-3xl border border-indigo-500/20 flex items-center justify-center transition-all shadow-xl hover:bg-indigo-500/10 pointer-events-auto shrink-0"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Right Toggle Button */}
            {(activeView === 'chat' || activeView === 'journal') ? (
              <button
                onClick={handleToggleView}
                className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-full border shadow-xl backdrop-blur-3xl pointer-events-auto transition-all duration-300 group ${
                  activeView === 'chat'
                    ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40' // Hinting at the next state
                    : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300 hover:bg-indigo-800/40' // Hinting at the next state
                }`}
                title={activeView === 'chat' ? 'Switch to Deep Weave' : 'Switch to Whispers'}
              >
                {activeView === 'chat' ? (
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
              </button>
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


