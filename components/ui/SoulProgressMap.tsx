'use client';
import React from 'react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

const ZONES = [
  { path: '/home', label: 'Input' },
  { path: '/home?mode=reflect', label: 'Reflect' },
  { path: '/diary', label: 'Output' },
  { path: '/library', label: 'Publish' },
  { path: '/profile', label: 'Engage' },
  { path: '/bridge', label: 'Connect' },
];

export const SoulProgressMap = () => {
  const pathname = usePathname();
  
  // Find current zone index
  const activeIndex = ZONES.findIndex(z => pathname === z.path || pathname.startsWith(z.path + '/'));

  if (activeIndex === -1) return null;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-2 rounded-full bg-neutral-900/40 backdrop-blur-3xl border border-white/5 opacity-50 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3">
        {ZONES.map((zone, i) => (
          <React.Fragment key={zone.path}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                  i === activeIndex 
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-150' 
                    : i < activeIndex ? 'bg-amber-400/40' : 'bg-white/10'
                }`}
              />
              <span className={`text-[7px] uppercase tracking-widest transition-colors duration-500 ${
                i === activeIndex ? 'text-amber-400 font-bold' : 'text-white/20'
              }`}>
                {zone.label}
              </span>
            </div>
            {i < ZONES.length - 1 && (
              <div className={`w-4 h-px mb-3 ${i < activeIndex ? 'bg-amber-400/20' : 'bg-white/5'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
