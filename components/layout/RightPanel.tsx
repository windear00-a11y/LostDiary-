'use client';

import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';

export const RightPanel = () => {
  return (
    <div className="hidden xl:flex flex-col w-80 bg-white dark:bg-[#0A0A0A] border-l border-gray-100 dark:border-[#1A1A1A] h-full p-6">
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F9FAFB] uppercase tracking-wider">AI Insights</h3>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-sm">Daily Reflection</span>
          </div>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            You&apos;ve been consistent with your gratitude entries this week. Keep it up!
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-[#2E2E2E] space-y-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <BrainCircuit className="w-5 h-5" />
            <span className="font-bold text-sm">Mood Trend</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your mood has been trending positively over the last 3 days.
          </p>
        </div>
      </div>
    </div>
  );
};
