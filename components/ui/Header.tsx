'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Book, MessageSquare, PenLine, X, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeView, setActiveView, isInputFocused } = useUIStore();

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'journal', label: 'Journal', icon: PenLine },
    { id: 'story', label: 'Story', icon: Book },
  ];

  return (
    <>
      {/* Top Bar: Minimal Menu Toggle */}
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 z-50 pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDrawerOpen(true)}
              className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-white/10"
            >
              <Menu className="w-5 h-5 text-white/60" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fluid Bottom Dock */}
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <nav className="flex items-center gap-1.5 p-1.5 bg-neutral-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className="relative px-4 py-3 flex items-center gap-2 rounded-full transition-all duration-500 overflow-hidden group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg"
                        className="absolute inset-0 bg-white shadow-xl shadow-white/10"
                        transition={{ type: 'spring', damping: 20, stiffness: 180 }}
                      />
                    )}
                    
                    <Icon className={`w-4 h-4 relative z-10 transition-colors duration-500 ${isActive ? 'text-black' : 'text-white/40 group-hover:text-white/80'}`} />
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap overflow-hidden relative z-10 text-black pr-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

