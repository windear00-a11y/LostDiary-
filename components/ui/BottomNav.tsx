'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Fingerprint, Sparkles, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveView, isInputFocused, setIsDrawerOpen } = useUIStore();

  // Don't show on immersive rooms, onboarding, or landing page
  if (pathname === '/' || pathname?.startsWith('/bridge') || pathname?.startsWith('/onboarding') || isInputFocused) return null;

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
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-white/5 bg-[#050505] pointer-events-auto pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-between items-center h-16 max-w-sm mx-auto px-4">
        {/* Menu Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full text-neutral-400 hover:text-white transition-all hover:bg-white/5"
        >
          <Menu className="w-5 h-5 drop-shadow-md" />
        </button>

        {/* Dynamic Tabs */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => {
              const isActive = tab.active;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`group relative flex items-center justify-center transition-all duration-300 ease-out overflow-hidden
                    ${isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 px-4 py-2.5 rounded-full' 
                      : 'w-12 h-12 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                    }
                  `}
                >
                  <tab.icon className={`w-5 h-5 shrink-0 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                  
                  {/* Expandable Label */}
                  <span 
                    className={`text-[12px] sm:text-[13px] font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ease-out 
                      ${isActive ? 'ml-2 max-w-[120px] opacity-100' : 'max-w-0 opacity-0 ml-0'}
                    `}
                  >
                    {tab.label}
                  </span>
                  
                  {/* Active Indicator (Optional but looks nice) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-full border border-indigo-500/20"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
