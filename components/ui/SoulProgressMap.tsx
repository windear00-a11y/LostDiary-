'use client';
import React from 'react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

const ZONES = [
  { path: '/home', label: 'Reflection' },
  { path: '/diary', label: 'Writing' },
  { path: '/profile', label: 'Identity' },
  { path: '/library', label: 'Public' },
  { path: '/bridge', label: 'Connection' },
];

export const SoulProgressMap = () => {
  const pathname = usePathname();
  
  // Find current zone index
  const activeIndex = ZONES.findIndex(z => pathname.includes(z.path));

  if (activeIndex === -1) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
      {ZONES.map((zone, i) => (
        <motion.div
          key={zone.path}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            i === activeIndex 
              ? 'bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.6)] scale-125' 
              : 'bg-white/20'
          }`}
          title={zone.label}
        />
      ))}
    </div>
  );
};
