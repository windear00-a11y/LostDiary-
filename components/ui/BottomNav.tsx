'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Fingerprint, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveView, isInputFocused } = useUIStore();

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
      <div className="flex justify-around items-center h-16 max-w-sm mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = tab.active;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 h-full transition-all ${
                isActive ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
              <span className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
