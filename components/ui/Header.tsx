'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Book, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeView, setActiveView } = useUIStore();

  return (
    <>
      <div className="fixed top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 z-50 flex items-center justify-between pointer-events-none">
        {/* Menu Toggle */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 dark:border-white/5 flex items-center justify-center transition-all pointer-events-auto"
        >
          <Menu className="w-5 h-5 text-slate-500" />
        </motion.button>

        {/* Navigation Toggle */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView(activeView === 'chat' ? 'story' : 'chat')}
            className="w-10 h-10 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
          >
            {activeView === 'story' ? (
              <MessageSquare className="w-5 h-5 text-white" />
            ) : (
              <Book className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>
      </div>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

