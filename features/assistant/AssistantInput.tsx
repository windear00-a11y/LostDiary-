'use client';

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface AssistantInputProps {
  isLoading: boolean;
  onSend: (text: string) => Promise<void>;
}

export const AssistantInput = ({ isLoading, onSend }: AssistantInputProps) => {
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await onSend(text);
  };

  return (
    <div className="relative">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-4 pr-14 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px] text-gray-900 dark:text-gray-100"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </div>
  );
};
