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
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/85 backdrop-blur-md shadow-sm border border-white/20 dark:border-white/5 flex items-center justify-center pointer-events-auto transition-all"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </motion.button>

        {/* Book Button */}
        <Link href="/story" className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/85 backdrop-blur-md shadow-sm border border-white/20 dark:border-white/5 flex items-center justify-center transition-all"
          >
            <BookOpen className="w-5 h-5 text-accent" />
          </motion.button>
        </Link>
      </div>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

