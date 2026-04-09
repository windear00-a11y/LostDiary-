'use client';

import React from 'react';
import { Chapter } from '@/lib/services/chapter-service';

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
        <p className="text-gray-400 italic font-serif text-lg">Your story is waiting to be written...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto py-20 px-6 font-serif">
      {chapters.map((chapter, index) => (
        <article 
          key={chapter.id}
          className="mb-24"
        >
          {/* Chapter Heading */}
          <header className="mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {chapter.name}
            </h2>
          </header>

          {/* Narrative Content */}
          <div className="text-xl leading-relaxed text-gray-800 dark:text-gray-200">
            {chapter.authored_content ? (
              chapter.authored_content.split('\n').filter(p => p.trim()).map((paragraph, pIdx) => (
                <p 
                  key={pIdx} 
                  className="mb-8"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="italic text-gray-400">This chapter is still being synthesized...</p>
            )}
          </div>

          {/* Chapter Divider */}
          {index < chapters.length - 1 && (
            <div className="my-24 flex justify-center opacity-30">
              <div className="w-16 h-px bg-gray-300 dark:bg-gray-700" />
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
