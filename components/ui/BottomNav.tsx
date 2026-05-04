'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Fingerprint, Sparkles, MoreHorizontal, MessageSquare, Feather, BookOpen, Orbit } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, setActiveView, isInputFocused, setIsBottomSheetOpen, memorySyncTrigger } = useUIStore();
  const [animatingParticles, setAnimatingParticles] = useState<{ id: number; delay: number }[]>([]);
  const [isReceiving, setIsReceiving] = useState(false);
  const nextParticleId = useRef(0);

  useEffect(() => {
    if (memorySyncTrigger > 0) {
      // Create a few particles for the wave effect
      const newParticles = Array.from({ length: 5 }).map((_, i) => ({
        id: nextParticleId.current++,
        delay: i * 0.1,
      }));
      setAnimatingParticles((prev) => [...prev, ...newParticles]);

      // Highlight target tab after flow reaches it
      setTimeout(() => {
        setIsReceiving(true);
      }, 600);

      setTimeout(() => {
        setIsReceiving(false);
      }, 1500);

      // Cleanup particles after animation
      setTimeout(() => {
        setAnimatingParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 2000);
    }
  }, [memorySyncTrigger]);

  // Don't show on immersive rooms, onboarding, or landing page
  if (pathname === '/' || pathname?.startsWith('/onboarding') || isInputFocused) return null;

  const tabs = [
    { id: 'sanctuary', label: 'Capture', icon: MessageSquare, path: '/home', active: pathname === '/home' && ['chat'].includes(activeView), action: () => setActiveView('chat') },
    { id: 'chronicles', label: 'Timeline', icon: BookOpen, path: '/home', active: pathname === '/home' && ['timeline'].includes(activeView), action: () => setActiveView('timeline') },
    { id: 'mirror', label: 'Insights', icon: Fingerprint, path: '/profile', active: pathname === '/profile', action: null },
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
        <div className="flex flex-1 justify-center items-center gap-2 relative">
          
          {/* Memory Transfer Particles - Energy Flow */}
          <AnimatePresence>
            {animatingParticles.map((particle) => (
              <motion.div
                key={`flow-${particle.id}`}
                initial={{ opacity: 0, scale: 0, x: -60, y: -10 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  scale: [0.5, 1.2, 0.8, 0],
                  x: [-60, -20, 10, 40],
                  y: [-10, -50, -30, 0] 
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 0.9, 
                  delay: particle.delay,
                  ease: "easeInOut",
                  times: [0, 0.4, 0.7, 1]
                }}
                className="absolute z-50 text-[var(--color-accent-amber)] pointer-events-none drop-shadow-[0_0_15px_rgba(255,158,94,1)] flex items-center justify-center p-2"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffeedd] shadow-[0_0_20px_#ff9e5e] shrink-0" />
                <motion.div 
                   className="absolute right-3 w-12 h-[2px] bg-gradient-to-r from-transparent via-[#ff9e5e88] to-[#ffeedd] origin-right"
                   animate={{
                     rotate: [-45, 0, 45]
                   }}
                   transition={{ duration: 0.9, ease: "linear" }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {tabs.map((tab, idx) => {
               const isActive = tab.active;
               const isTarget = tab.id === 'chronicles' && isReceiving;
               const isSource = tab.id === 'sanctuary' && animatingParticles.length > 0;
               return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`group relative flex items-center justify-center transition-all duration-500 ease-out overflow-hidden focus:outline-none z-10
                    ${isActive 
                      ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] px-4 py-2.5 rounded-full border border-[var(--color-accent-amber)]/10' 
                      : 'w-10 h-10 sm:w-12 sm:h-12 rounded-full text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)] hover:bg-white/5'
                    }
                    ${isTarget ? 'bg-[var(--color-accent-amber)]/30 text-[var(--color-accent-amber)] scale-110 z-20' : ''}
                  `}
                >
                  {/* Source Portal Animation */}
                  {isSource && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotateX: 60 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5, 0], rotateZ: [0, 180] }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute inset-0 m-auto w-full h-full rounded-full border-2 border-[var(--color-accent-amber)] border-t-transparent shadow-[0_0_20px_var(--color-accent-amber)] pointer-events-none"
                    />
                  )}

                  {/* Destination Portal Animation */}
                  {isTarget && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotateX: 60 }}
                      animate={{ opacity: [0, 1, 0], scale: [2.5, 1, 0.5], rotateZ: [180, 0] }}
                      transition={{ duration: 0.8, ease: "easeIn" }}
                      className="absolute inset-0 m-auto w-full h-full rounded-full border-2 border-[var(--color-accent-amber)] border-b-transparent shadow-[0_0_30px_var(--color-accent-amber)_inset,0_0_20px_var(--color-accent-amber)] pointer-events-none"
                    />
                  )}

                  <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform relative z-10 ${isActive || isTarget ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,158,94,0.5)]' : 'scale-100 group-hover:scale-105'}`} />
                  
                  {/* Expandable Label */}
                  <span 
                    className={`text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-500 ease-out italic relative z-10
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
