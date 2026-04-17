'use client';

import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';

export const ChatInput = ({ onSendMessage, disabled }: { 
  onSendMessage: (msg: any) => Promise<void>,
  disabled?: boolean
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || disabled) return;
    
    const messageContent = text;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await onSendMessage({ type: 'text', content: messageContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-lg">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm md:text-base outline-none scrollbar-hide"
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:bg-zinc-400 shrink-0"
      >
        <Send className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

