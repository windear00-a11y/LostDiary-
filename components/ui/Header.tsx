'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Book, MessageSquare, PenLine, X, Sparkles, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeView, setActiveView, isInputFocused } = useUIStore();

  const navItems = [
    { id: 'chat', label: 'Input', icon: MessageSquare },
    { id: 'journal', label: 'Output', icon: PenLine },
    { id: 'story', label: 'Legacy', icon: Book },
  ];

  return (
    <>
      {/* Top Bar: Minimal Menu Toggle - Always accessible */}
      <div className="fixed top-6 left-6 z-50 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDrawerOpen(true)}
          className="w-12 h-12 rounded-full bg-neutral-900/30 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-neutral-800/40"
        >
          <Menu className="w-5 h-5 text-white/60" />
        </motion.button>
      </div>

      <div className="fixed top-6 right-6 z-50 pointer-events-auto flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setActiveView('chat');
            window.location.href = '/home'; // Navigate to root chat
          }}
          className="w-12 h-12 rounded-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-white/10 group"
          title="New Conversation"
        >
          <Plus className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
        </motion.button>
      </div>

      {/* Top Center Navigation Pill */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isInputFocused ? 0.9 : 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 ${isInputFocused ? 'opacity-40 blur-sm' : 'opacity-100'}`}
      >
        <nav className="flex items-center gap-1 p-1 bg-neutral-900/30 backdrop-blur-3xl border border-white/5 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className="relative px-3 py-2 flex items-center gap-1.5 rounded-full transition-all duration-500 overflow-hidden group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-white"
                    transition={{ type: 'spring', damping: 20, stiffness: 180 }}
                  />
                )}
                
                <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors duration-500 ${isActive ? 'text-black' : 'text-white/40 group-hover:text-white/80'}`} />
                
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="text-[9px] uppercase tracking-[0.2em] font-bold whitespace-nowrap overflow-hidden relative z-10 text-black pr-1"
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

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

