'use client';

import React, { useState, memo } from 'react';
import { Trash2, Calendar, X, Check, Sparkles, FileText, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

import Image from 'next/image';

export const EntryCard = memo(({
  entry,
  deleteEntry,
}: {
  entry: any;
  deleteEntry: (id: string) => Promise<void>;
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [viewMode, setViewMode] = useState<'authored' | 'raw'>('authored');

  const hasRawContent = !!entry.original_content;
  const displayContent = viewMode === 'raw' && hasRawContent ? entry.original_content : entry.content;

  return (
    <div className="space-y-4">
      {/* User Entry Bubble */}
      <div className="flex flex-col items-end space-y-1">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-[85%] relative group">
          
          {/* View Toggle */}
          {hasRawContent && (
            <div className="flex justify-end mb-2">
              <div className="flex items-center bg-indigo-700/50 rounded-full p-0.5">
                <button
                  onClick={() => setViewMode('authored')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    viewMode === 'authored' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-indigo-100 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  LifeBook
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    viewMode === 'raw' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-indigo-100 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Raw
                </button>
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            <p className="text-white whitespace-pre-wrap text-sm md:text-base">
              {displayContent}
            </p>
          </div>
          {entry.image_url && (
            <div className="mt-3 relative aspect-video rounded-xl overflow-hidden border border-white/10">
              <Image 
                src={entry.image_url} 
                alt="Entry attachment" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          {/* Delete Action */}
          <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
             {isConfirmingDelete ? (
              <div className="flex flex-col items-center gap-1 bg-white dark:bg-[#1A1A1A] p-1 rounded-lg border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <span className="text-[10px] text-gray-400 px-1">
          {format(new Date(entry.created_at), 'p')}
        </span>
      </div>

      {/* AI Response Bubble */}
      {entry.ai_response && (
        <div className="flex flex-col items-start space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-none p-5 shadow-sm border border-gray-100 dark:border-[#2E2E2E] max-w-[90%] space-y-3">
            <div className="flex items-center gap-2 text-indigo-500 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">WinDear Reflection</span>
            </div>
            
            <p className="text-sm md:text-base font-medium italic text-gray-800 dark:text-gray-200">
              &quot;{entry.ai_response.emotion_reflection}&quot;
            </p>
            
            <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-[#2E2E2E]">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {entry.ai_response.validation}
              </p>
              
              {entry.ai_response.insight && (
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    <span className="font-bold">Insight: </span>
                    {entry.ai_response.insight}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-1">
              {entry.ai_response.short_reply}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

EntryCard.displayName = 'EntryCard';
