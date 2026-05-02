'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Chapter } from '@/lib/services/core-service';

interface NarrativeMapProps {
  chapters: Chapter[];
  onChapterSelect: (id: string) => void;
}

export function NarrativeMap({ chapters, onChapterSelect }: NarrativeMapProps) {
  const containerRef = useRef(null);

  // Simple spatial layout for demonstration
  const [dimensions, setDimensions] = React.useState({ width: 1000, height: 1000 });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#FDfcf8] z-[90] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {chapters.map((chapter, index) => {
          const angle = (index / (chapters.length || 1)) * Math.PI * 2;
          const radius = Math.min(dimensions.width, dimensions.height) / 3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.button
              key={chapter.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, x, y }}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              onClick={() => onChapterSelect(chapter.id)}
              className="absolute p-6 bg-white border border-amber-100 rounded-full shadow-lg flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Ch. {index + 1}</span>
              <span className="font-serif text-sm text-slate-800">{(chapter.name || 'Untitled').substring(0, 15)}...</span>
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-10 left-10 text-slate-400 text-xs font-sans uppercase tracking-[0.2em]">
        Explore the Narrative
      </div>
    </div>
  );
};
