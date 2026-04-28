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
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-white/5 bg-[var(--color-bg-dark)] pointer-events-auto pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-16 max-w-lg mx-auto px-2">
        {/* Menu Button */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)] transition-all hover:bg-white/5 shrink-0 focus:outline-none"
        >
          <MoreHorizontal className="w-5 h-5 drop-shadow-md" />
        </button>

        {/* Dynamic Tabs */}
        <div className="flex flex-1 justify-center items-center gap-2">
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => {
              const isActive = tab.active;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`group relative flex items-center justify-center transition-all duration-500 ease-out overflow-hidden focus:outline-none
                    ${isActive 
                      ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] px-4 py-2.5 rounded-full border border-[var(--color-accent-amber)]/10' 
                      : 'w-10 h-10 sm:w-12 sm:h-12 rounded-full text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)] hover:bg-white/5'
                    }
                  `}
                >
                  <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,158,94,0.5)]' : 'scale-100 group-hover:scale-105'}`} />
                  
                  {/* Expandable Label */}
                  <span 
                    className={`text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-500 ease-out italic
                      ${isActive ? 'ml-2 max-w-[120px] opacity-100' : 'max-w-0 opacity-0 ml-0'}
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
