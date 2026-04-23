'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { motion } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const Header = () => {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isInputFocused } = useUIStore();

  return (
    <>
      {/* Top Bar: Minimal Menu Toggle - Always accessible */}
      {!isInputFocused && (
        <div className="fixed top-4 left-4 z-50 pointer-events-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-neutral-900/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all shadow-xl hover:bg-neutral-800/60"
          >
            <Menu className="w-4 h-4 text-white/50" />
          </motion.button>
        </div>
      )}

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

