'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Book, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion } from 'motion/react';

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="fixed top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 z-50 flex items-center justify-between pointer-events-none">
        {/* Hamburger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-white/85 dark:bg-black/80 backdrop-blur-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 flex items-center justify-center transition-all pointer-events-auto"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </motion.button>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Navigation Toggle */}
          <Link href={pathname === '/story' ? '/home' : '/story'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-full bg-white/85 dark:bg-black/80 backdrop-blur-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 flex items-center justify-center transition-all group"
            >
              {pathname === '/story' ? (
                <MessageSquare className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              ) : (
                <Book className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              )}
            </motion.button>
          </Link>
        </div>
      </div>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

