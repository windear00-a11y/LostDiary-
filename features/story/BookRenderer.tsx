'use client';

import React from 'react';
import { Chapter } from '@/lib/services/core-service';

interface BookRendererProps {
  chapters: Chapter[];
}

/**
 * BookRenderer - A clean, readable narrative engine for the LifeBook.
 * Focuses on typography, flow, and a distraction-free reading experience.
 */
export const BookRenderer = ({ chapters }: BookRendererProps) => {
  
  if (!chapters || chapters.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 italic font-serif text-xl">Your story is waiting to be written...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[650px] mx-auto font-serif selection:bg-indigo-100/30">
      {chapters.map((chapter, index) => (
        <article 
          key={chapter.id}
          className="mb-32"
        >
          {/* Chapter Heading */}
          <header className="mb-16 text-center">
            <div className="text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-4">Chapter {index + 1}</div>
            <h2 className="text-4xl font-serif font-medium text-gray-900 dark:text-gray-100 tracking-tight">
              {chapter.title}
            </h2>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />
            </div>
          </header>

          {/* Narrative Content */}
          <div className="text-xl md:text-2xl leading-[1.8] text-gray-800 dark:text-gray-200 space-y-10 text-justify hyphens-auto">
            {chapter.content ? (
              chapter.content.split('\n').filter(p => p.trim()).map((paragraph: any, pIdx: any) => (
                <p 
                  key={pIdx} 
                  className="first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:leading-none"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="italic text-gray-400 text-center">This chapter is still being synthesized...</p>
            )}
          </div>

          {/* Chapter Divider */}
          {index < chapters.length - 1 && (
            <div className="my-32 flex justify-center opacity-20">
              <div className="text-2xl tracking-[1em] text-gray-400">***</div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
