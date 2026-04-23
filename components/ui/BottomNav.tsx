'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, User, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveView } = useUIStore();

  // Don't show on immersive rooms, onboarding, or landing page
  if (pathname === '/' || pathname?.startsWith('/bridge') || pathname?.startsWith('/onboarding')) return null;

  const tabs = [
    { id: 'sanctuary', label: 'Sanctuary', icon: Sparkles, path: '/home', active: pathname === '/home' },
    { id: 'library', label: 'Library', icon: BookOpen, path: '/library', active: pathname === '/library' },
    { id: 'profile', label: 'Soul', icon: User, path: '/profile', active: pathname === '/profile' },
  ];

  const handleTabClick = (tab: any) => {
    if (tab.id === 'sanctuary') {
      setActiveView('chat');
    }
    router.push(tab.path);
  };

  return (
    <div className="fixed bottom-6 inset-x-0 z-[100] flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.5 }}
        className="pointer-events-auto flex items-center gap-1 p-1.5 bg-neutral-900/80 backdrop-blur-2xl border border-white/5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {tabs.map((tab) => {
          const isActive = tab.active;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="relative flex items-center gap-2 px-6 py-3 rounded-full transition-all group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-nav"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <tab.icon className={`w-5 h-5 transition-all duration-300 ${
                isActive ? 'text-indigo-400 scale-110' : 'text-neutral-500 group-hover:text-neutral-300'
              }`} />
              
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xs font-serif font-bold text-white tracking-wide overflow-hidden whitespace-nowrap"
                  >
                    <span className="ml-2">{tab.label}</span>
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full blur-[2px]" />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
