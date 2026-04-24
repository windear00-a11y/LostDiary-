'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Fingerprint, Sparkles } from 'lucide-react';
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
    { id: 'library', label: 'Constellation', icon: Compass, path: '/library', active: pathname === '/library' },
    { id: 'profile', label: 'Mirror', icon: Fingerprint, path: '/profile', active: pathname === '/profile' },
  ];

  const handleTabClick = (tab: any) => {
    if (tab.id === 'sanctuary') {
      setActiveView('chat');
    }
    router.push(tab.path);
  };

  return (
    <div className="fixed bottom-6 inset-x-0 z-[100] flex justify-center pointer-events-none px-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.5 }}
        className="pointer-events-auto relative flex items-center p-1 bg-[#1a1a1e]/80 backdrop-blur-2xl rounded-full shadow-lg"
      >
        {tabs.map((tab) => {
          const isActive = tab.active;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`relative flex items-center justify-center px-6 py-2.5 rounded-full transition-all duration-300 z-10 ${
                isActive ? 'text-black' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-nav"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              <span className={`text-[13px] font-medium tracking-wide relative z-10 px-1`}>
                {isActive ? tab.label : tab.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
