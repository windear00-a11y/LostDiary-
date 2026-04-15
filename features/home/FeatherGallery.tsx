'use client';

import React from 'react';
import { 
  Feather, 
  Pen, 
  PenLine, 
  Pencil, 
  PencilLine, 
  Highlighter, 
  Brush, 
  Eraser,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

const icons = [
  { name: 'Feather', icon: Feather },
  { name: 'Pen', icon: Pen },
  { name: 'PenLine', icon: PenLine },
  { name: 'Pencil', icon: Pencil },
  { name: 'PencilLine', icon: PencilLine },
  { name: 'Highlighter', icon: Highlighter },
  { name: 'Brush', icon: Brush },
  { name: 'Eraser', icon: Eraser },
];

export const FeatherGallery = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-[#1A1A1D] rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/5 w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold italic">Feather & Pen Options</h2>
            <p className="text-xs text-gray-400 font-serif italic">Choose an icon for your writing cursor</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto max-h-[60vh]">
          {icons.map((item) => (
            <div 
              key={item.name}
              className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-gray-50 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group cursor-pointer"
            >
              <div className="relative">
                <item.icon 
                  className="w-8 h-8 text-gray-700 dark:text-gray-200 group-hover:text-indigo-500 transition-colors" 
                  strokeWidth={1.5}
                  style={{ transform: 'rotate(-15deg)' }}
                />
                {/* Tip Glow Simulation */}
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-500 rounded-full blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.name}</span>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-50 dark:border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 text-center">
            We can also adjust thickness, rotation, and glow color for any of these.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
