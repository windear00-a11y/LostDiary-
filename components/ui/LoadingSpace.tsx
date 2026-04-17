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
      <div className="relative flex items-center justify-center">
        <motion.div 
          className="w-1.5 h-1.5 rounded-full bg-indigo-500/40"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0
          }}
        />
        <motion.div 
          className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 ml-2"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
        <motion.div 
          className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 ml-2"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4
          }}
        />
      </div>
      
      <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </motion.div>
  );
};
