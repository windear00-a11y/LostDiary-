'use client';

import React, { useEffect, useState } from 'react';
import { Chapter } from '@/lib/services/chapter-service';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { X, ChevronUp, BookOpen } from 'lucide-react';
import { BookRenderer } from './BookRenderer';

interface ImmersiveReaderProps {
  chapters: Chapter[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ImmersiveReader - A full-screen, distraction-free reading environment.
 * Designed to feel like a physical book with digital fluidity.
 */
export const ImmersiveReader = ({ chapters, isOpen, onClose }: ImmersiveReaderProps) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [showControls, setShowControls] = useState(true);

  // Hide controls after a period of inactivity or on scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('scroll', handleMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('scroll', handleMove);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#fdfcfb] dark:bg-[#0d0d0d] overflow-y-auto scroll-smooth"
      >
        {/* Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left z-[110]"
          style={{ scaleX }}
        />

        {/* Subtle Page Texture Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-[101] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

        {/* Floating Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-0 right-0 px-6 flex justify-between items-center z-[120] max-w-5xl mx-auto w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">LifeBook</h1>
                  <p className="text-[10px] text-gray-500 font-serif italic">Your journey, authored.</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group"
              >
                <X className="w-5 h-5 text-gray-500 group-hover:text-indigo-500 transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to top button */}
        <AnimatePresence>
          {!showControls && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-lg z-[120] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronUp className="w-6 h-6 text-indigo-500" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="relative z-[105] pt-32 pb-40">
          <BookRenderer chapters={chapters} />
        </main>

        {/* Footer Reflection */}
        <footer className="relative z-[105] max-w-2xl mx-auto px-6 pb-32 text-center">
          <div className="h-px w-24 bg-gray-200 dark:bg-white/10 mx-auto mb-8" />
          <p className="font-serif italic text-gray-400 text-lg">
            The story continues with every breath you take.
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
