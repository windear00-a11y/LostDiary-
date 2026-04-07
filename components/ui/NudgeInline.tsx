'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface NudgeInlineProps {
  message: string;
  onClick: () => void;
}

export const NudgeInline: React.FC<NudgeInlineProps> = ({ message, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 flex items-center justify-between group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl text-indigo-500 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </button>
  );
};
