'use client';

import React from 'react';
import { Chapter } from '@/lib/services/chapter-service';
import { motion } from 'motion/react';

interface BookRendererProps {
  chapters: Chapter[];
}

/**
 * BookRenderer - A clean, readable narrative engine for the LifeBook.
 * Focuses on typography, flow, and a distraction-free reading experience.
 */
export const BookRenderer = ({ chapters }: BookRendererProps) => {
  
  // STEP 2: Rendering Function
  const renderBook = (chapters: Chapter[]) => {
    if (!chapters || chapters.length === 0) {
      return (
        <div className="py-20 text-center">
          <p className="text-gray-400 italic font-serif text-lg">Your story is waiting to be written...</p>
        </div>
      );
    }

    return (
      <div className="space-y-24 max-w-2xl mx-auto py-12">
        {chapters.map((chapter, index) => (
          <motion.article 
            key={chapter.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="group relative"
          >
            {/* STEP 1: Structure - Chapter Title */}
            <header className="mb-12 text-center">
              <div className="inline-block mb-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-bold">
                  Chapter {index + 1}
                </span>
                <div className="h-px w-12 bg-indigo-500/20 mx-auto mt-2" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                {chapter.name}
              </h2>
            </header>

            {/* STEP 1: Structure - Narrative Content (Paragraph Form) */}
            <div className="prose prose-lg md:prose-xl dark:prose-invert mx-auto font-serif leading-relaxed text-gray-800 dark:text-gray-200 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
              {chapter.authored_content ? (
                chapter.authored_content.split('\n').filter(p => p.trim()).map((paragraph, pIdx) => (
                  <p 
                    key={pIdx} 
                    className="mb-8 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:mt-1 first-letter:text-indigo-600 dark:first-letter:text-indigo-400 first-letter:font-serif"
                    style={pIdx !== 0 ? { clear: 'both', textIndent: '0' } : {}}
                  >
                    {/* Only apply drop cap to the very first paragraph of the chapter */}
                    {pIdx === 0 ? paragraph : paragraph}
                  </p>
                ))
              ) : (
                <p className="italic text-gray-400 text-center">This chapter is still being synthesized from your memories...</p>
              )}
            </div>

            {/* Decorative separator */}
            {index < chapters.length - 1 && (
              <div className="mt-24 flex justify-center opacity-20">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
              </div>
            )}
          </motion.article>
        ))}
      </div>
    );
  };

  return (
    <div className="book-engine-container bg-[#fdfcfb] dark:bg-[#0d0d0d] min-h-screen transition-colors duration-700">
      {/* STEP 3: Ensure clean typography and spacing */}
      {/* STEP 4: Rules - No timestamps, no chat UI */}
      {renderBook(chapters)}
      
      <style jsx global>{`
        .book-engine-container {
          font-variant-ligatures: common-ligatures;
          text-rendering: optimizeLegibility;
        }
        
        @media (max-width: 640px) {
          .prose p:first-of-type::first-letter {
            font-size: 3.5rem;
            margin-top: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};
