'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Book as BookIcon, ChevronRight, User } from 'lucide-react';

interface LifeBookCoverProps {
  data: {
    title: string;
    summary: string;
    aura: string;
  };
  userName: string;
  onOpen: () => void;
}

export const LifeBookCover = ({ data, userName, onOpen }: LifeBookCoverProps) => {
  // Map aura to colors
  const auraColors: Record<string, string> = {
    'Midnight Indigo': 'from-indigo-950 via-slate-900 to-black',
    'Warm Amber': 'from-amber-950 via-stone-900 to-black',
    'Emerald Growth': 'from-emerald-950 via-teal-900 to-black',
    'Crimson Passion': 'from-rose-950 via-neutral-900 to-black',
    'default': 'from-slate-900 via-neutral-950 to-black'
  };

  const bgGradient = auraColors[data.aura] || auraColors['default'];

  return (
    <div className={`min-h-[80vh] w-full rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 md:p-16 bg-gradient-to-br ${bgGradient} border border-white/5`}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
      
      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity,
              delay: i * 0.5
            }}
            className="absolute bg-white rounded-full blur-xl"
            style={{ 
              width: Math.random() * 100 + 50, 
              height: Math.random() * 100 + 50,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center space-y-12 max-w-2xl"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 backdrop-blur-sm"
          >
            <BookIcon className="w-8 h-8 text-white/40" />
          </motion.div>
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.8em] text-white/40 font-bold block">
              A Personal Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-tight">
              {data.title}
            </h1>
            <div className="flex justify-center gap-4 mt-4">
              <span className="text-[8px] uppercase tracking-widest text-white/20 border border-white/10 px-2 py-0.5 rounded">First Edition</span>
              <span className="text-[8px] uppercase tracking-widest text-white/20 border border-white/10 px-2 py-0.5 rounded">Volume I</span>
            </div>
          </div>
          
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mt-8" />
        </div>

        <p className="text-lg md:text-xl text-white/50 font-serif italic leading-relaxed">
          &ldquo;{data.summary}&rdquo;
        </p>

        <div className="pt-12 space-y-8">
          <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-white/30" />
             </div>
             <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
               By {userName}
             </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpen}
            className="group relative px-10 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs overflow-hidden transition-all hover:bg-neutral-100"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open My LifeBook <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[9px] uppercase tracking-[0.5em] text-white/20 font-bold">
        Archived by WinDear AI
      </div>
    </div>
  );
};
