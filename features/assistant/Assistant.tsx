'use client';
import React, { memo } from 'react';
import { useAssistant } from './use-assistant';
import { AssistantInput } from './AssistantInput';
import { Sparkles } from 'lucide-react';

export const Assistant = memo(() => {
  const { response, isLoading, handleSend } = useAssistant();

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold">WinDear Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {response && (
          <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                {response.emotion}
              </span>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 italic">
              &quot;{response.short_reply}&quot;
            </p>
            <div className="pt-4 border-t border-gray-50 dark:border-[#2E2E2E] space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-gray-200">Insight: </span>
                {response.insight}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-gray-200">Suggestion: </span>
                {response.suggestion}
              </p>
            </div>
          </div>
        )}
      </div>

      <AssistantInput isLoading={isLoading} onSend={handleSend} />
    </div>
  );
});

Assistant.displayName = 'Assistant';
