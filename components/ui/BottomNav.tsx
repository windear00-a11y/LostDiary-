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
        className="pointer-events-auto relative flex items-center gap-1 p-2 bg-[#050505]/90 backdrop-blur-2xl border border-indigo-500/20 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none opacity-50" />
        
        {tabs.map((tab) => {
          const isActive = tab.active;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="relative flex items-center justify-center gap-2 px-5 py-3 rounded-full transition-all group z-10 min-w-[70px]"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-nav"
                  className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                >
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/30 to-transparent opacity-50 rounded-full animate-pulse" />
                </motion.div>
              )}
              
              <tab.icon className={`w-5 h-5 relative z-10 transition-transform duration-500 group-hover:scale-110 ${
                isActive 
                  ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' 
                  : 'text-indigo-200/40 group-hover:text-indigo-300'
              }`} />
              
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)' }}
                    exit={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100 overflow-hidden whitespace-nowrap ml-2 relative z-10 pt-0.5"
                  >
                    <span>{tab.label}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
