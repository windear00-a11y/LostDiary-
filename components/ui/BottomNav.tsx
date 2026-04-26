'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Fingerprint, Sparkles, MoreHorizontal, MessageSquare, Feather } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, setActiveView, isInputFocused, setIsBottomSheetOpen } = useUIStore();

  // Don't show on immersive rooms, onboarding, or landing page
  if (pathname === '/' || pathname?.startsWith('/bridge') || pathname?.startsWith('/onboarding') || isInputFocused) return null;

  const tabs = [
    { id: 'chat', label: 'Whispers', icon: MessageSquare, path: '/home', active: pathname === '/home' && activeView === 'chat', action: () => setActiveView('chat') },
    { id: 'journal', label: 'Journal', icon: Feather, path: '/home', active: pathname === '/home' && activeView === 'journal', action: () => setActiveView('journal') },
    { id: 'library', label: 'Library', icon: Compass, path: '/library', active: pathname === '/library', action: null },
    { id: 'profile', label: 'Profile', icon: Fingerprint, path: '/profile', active: pathname === '/profile', action: null },
  ];

  const handleTabClick = (tab: any) => {
    if (tab.action) {
      tab.action();
    }
    if (pathname !== tab.path) {
      router.push(tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-white/5 bg-[#050505] pointer-events-auto pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-between items-center h-16 max-w-lg mx-auto px-2">
        {/* Menu Button */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full text-neutral-400 hover:text-white transition-all hover:bg-white/5 shrink-0"
        >
          <MoreHorizontal className="w-5 h-5 drop-shadow-md" />
        </button>

        {/* Dynamic Tabs */}
        <div className="flex flex-1 justify-center items-center gap-1">
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => {
              const isActive = tab.active;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`group relative flex items-center justify-center transition-all duration-500 ease-in-out overflow-hidden
                    ${isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 px-3 py-2.5 rounded-full' 
                      : 'w-10 h-10 sm:w-12 sm:h-12 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                    }
                  `}
                >
                  <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                  
                  {/* Expandable Label */}
                  <span 
                    className={`text-[11px] sm:text-[12px] font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out
                      ${isActive ? 'ml-1.5 sm:ml-2 max-w-[120px] opacity-100' : 'max-w-0 opacity-0 ml-0'}
                    `}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
