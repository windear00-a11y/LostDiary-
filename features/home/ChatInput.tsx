'use client';

import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatInput = ({ onSendMessage, disabled, onFocusChange }: { 
  onSendMessage: (msg: any) => Promise<void>,
  disabled?: boolean,
  onFocusChange?: (focused: boolean) => void
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleSend = async () => {
    if (!text.trim() || disabled) return;
    
    // Light haptic feedback
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    const messageContent = text;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = '48px';

    await onSendMessage({ type: 'text', content: messageContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full relative group">
      <div className={`relative w-full rounded-2xl backdrop-blur-md transition-all duration-700 shadow-sm border
        ${isFocused 
          ? 'bg-neutral-900/90 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'bg-neutral-900/80 border-white/10' }`}>
        
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = '48px';
            const nextHeight = e.target.scrollHeight;
            e.target.style.height = `${Math.min(nextHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Processing..." : "Write your moment..."}
          style={{ height: '48px' }}
          className="w-full px-4 py-3 min-h-[48px] max-h-[160px] bg-transparent border-none focus:ring-0 resize-none text-base md:text-lg leading-relaxed outline-none overflow-y-auto text-white placeholder:text-white/40 transition-[height,opacity] duration-200 disabled:opacity-50 pr-12"
        />

        <div className="absolute right-3 bottom-3">
          <AnimatePresence>
            {text.trim() && !disabled && (
              <motion.button
                key="send-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="p-1.5 text-white/70 hover:text-white transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

