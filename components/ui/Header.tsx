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
    { id: 'chat', label: 'Input', icon: MessageSquare, path: '/home' },
    { id: 'reflect', label: 'Reflect', icon: Sparkles, path: '/home?mode=reflect' },
    { id: 'journal', label: 'Output', icon: PenLine, path: '/home' },
    { id: 'library', label: 'Publish', icon: BookOpen, path: '/library' },
    { id: 'profile', label: 'Engage', icon: User, path: '/profile' },
  ];

  return (
    <>
      {/* Top Bar: Minimal Menu Toggle - Always accessible */}
      <div className="fixed top-4 left-4 z-50 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-neutral-900/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-neutral-800/60"
        >
          <Menu className="w-4 h-4 text-white/50" />
        </motion.button>
      </div>

      <div className="fixed top-4 right-4 z-50 pointer-events-auto flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setActiveView('chat');
            router.push('/home'); // Use router instead of window.location
          }}
          className="w-10 h-10 rounded-full bg-neutral-900/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-white/10 group"
          title="New Conversation"
        >
          <Plus className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </motion.button>
      </div>

      {/* Top Center Navigation Pill - Slimmed down for organization */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isInputFocused ? 0.95 : 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 ${isInputFocused ? 'opacity-40 blur-sm' : 'opacity-100'}`}
      >
        <nav className="flex items-center gap-0.5 p-1 bg-neutral-950/40 backdrop-blur-3xl border border-white/5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path !== '/home' && !isActive) {
                    router.push(item.path);
                  } else {
                    setActiveView(item.id as any);
                    if (window.location.pathname !== '/home') router.push('/home');
                  }
                }}
                className={`relative px-3 py-2 flex items-center gap-1.5 rounded-full transition-all duration-300 overflow-hidden group ${isActive ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'hover:bg-white/5'}`}
              >
                <Icon className={`w-3 h-3 relative z-10 transition-colors duration-300 ${isActive ? 'text-black' : 'text-white/30 group-hover:text-white/60'}`} />
                
                {isActive && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    className="text-[8px] uppercase tracking-[0.15em] font-bold whitespace-nowrap overflow-hidden relative z-10 text-black px-0.5"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>
      </motion.div>


      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

