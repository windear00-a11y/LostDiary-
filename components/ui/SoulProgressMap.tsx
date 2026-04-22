'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

const ZONES = [
  { id: 'chat', path: '/home', label: 'Input' },
  { id: 'reflect', path: '/home', label: 'Reflect' },
  { id: 'journal', path: '/home', label: 'Output' },
  { id: 'library', path: '/library', label: 'Publish' },
  { id: 'profile', path: '/profile', label: 'Engage' },
  { id: 'bridge', path: '/profile', label: 'Connect' },
];

export const SoulProgressMap = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, setActiveView } = useUIStore();
  
  // Find current zone index based on either pathname or activeView
  const activeIndex = ZONES.findIndex(z => {
    if (pathname === '/home') {
      return z.id === activeView;
    }
    return pathname === z.path || pathname.startsWith(z.path + '/');
  });

  if (activeIndex === -1) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 rounded-full bg-neutral-950/40 backdrop-blur-3xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
      <div className="flex items-center gap-1.5 md:gap-4">
        {ZONES.map((zone, i) => {
          const isCurrent = i === activeIndex;
          const isPast = i < activeIndex;

          return (
            <React.Fragment key={zone.id + i}>
              <button 
                onClick={() => {
                  if (zone.path === '/home') {
                    setActiveView(zone.id as any);
                    if (pathname !== '/home') router.push('/home');
                  } else {
                    router.push(zone.path);
                  }
                }}
                className="flex flex-col items-center gap-1.5 group/zone relative"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: isCurrent ? 1.5 : 1,
                      backgroundColor: isCurrent ? '#fbbf24' : isPast ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                      isCurrent ? 'shadow-[0_0_12px_rgba(251,191,36,0.8)]' : ''
                    }`}
                  />
                  {isCurrent && (
                    <motion.div 
                      layoutId="active-glow"
                      className="absolute inset-0 bg-amber-400 blur-md -z-10"
                    />
                  )}
                </div>

                <AnimatePresence>
                  {(isCurrent || true) && (
                    <motion.span 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ 
                        opacity: isCurrent ? 1 : 0.3, 
                        y: 0,
                        scale: isCurrent ? 1 : 0.9
                      }}
                      className={`text-[8px] md:text-[9px] uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                        isCurrent ? 'text-amber-400 font-bold' : 'text-white/40 group-hover/zone:text-white/60'
                      }`}
                    >
                      {zone.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              
              {i < ZONES.length - 1 && (
                <div className={`w-3 md:w-6 h-px mb-4 transition-colors duration-1000 ${isPast ? 'bg-amber-400/30 font-bold' : 'bg-white/5'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
