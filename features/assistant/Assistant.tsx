'use client';
import React, { memo } from 'react';
import { useAssistant } from './use-assistant';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export const Assistant = memo(() => {
  const { input, setInput, response, isLoading, handleSend } = useAssistant();

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

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-4 pr-14 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
});

Assistant.displayName = 'Assistant';
