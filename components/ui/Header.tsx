'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, BookOpen } from 'lucide-react';
import { SideDrawer } from './SideDrawer';
import { motion } from 'motion/react';

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
        {/* Hamburger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDrawerOpen(true)}
          className="w-9 h-9 rounded-full bg-white/85 dark:bg-black/80 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 flex items-center justify-center pointer-events-auto transition-all"
        >
          <Menu className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
        </motion.button>

        {/* Book Button */}
        <Link href="/story" className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-full bg-white/85 dark:bg-black/80 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 flex items-center justify-center transition-all"
          >
            <BookOpen className="w-4.5 h-4.5 text-accent" />
          </motion.button>
        </Link>
      </div>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

