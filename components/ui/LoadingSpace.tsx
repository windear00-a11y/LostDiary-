'use client';

import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpaceProps {
  message?: string;
  className?: string;
}

export const LoadingSpace = ({ 
  message = "Preparing your space...", 
  className = "" 
}: LoadingSpaceProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center gap-6 ${className}`}
    >
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Layered Breathing Orbs */}
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            className={`absolute inset-0 rounded-full border border-amber-500/${i * 5}`}
            animate={{
              scale: [1, 1 + i * 0.2, 1],
              opacity: [0.05, 0.2, 0.05],
              rotate: [0, i * 45, 0]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}

        {/* Central Core */}
        <div className="relative z-10 w-12 h-12 flex items-center justify-center">
            <motion.div 
              className="absolute inset-0 rounded-full bg-amber-500 blur-md opacity-20"
              animate={{
                scale: [1, 1.4, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(129,140,248,0.8)]"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
        </div>
        
        {/* Orbiting Particle */}
        <motion.div
            className="absolute inset-0 z-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-300 blur-[1px]" />
        </motion.div>
      </div>
      
      <div className="space-y-1 text-center">
          <p className="text-sm font-serif italic text-slate-800 dark:text-amber-200 tracking-wide">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
              {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    className="w-1 h-1 rounded-full bg-amber-500/20"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  />
              ))}
          </div>
      </div>
    </motion.div>
  );
};
