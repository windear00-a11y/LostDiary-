'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Book, MessageSquare, PenLine, X, Sparkles, Plus, BookOpen, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const router = useRouter();
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
            if (window.location.pathname !== '/home') router.push('/home');
          }}
          className="w-10 h-10 rounded-full bg-neutral-900/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-white/10 group"
          title="New Conversation"
        >
          <Plus className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </motion.button>
      </div>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

