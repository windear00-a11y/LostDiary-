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
  const [isScrolling, setIsScrolling] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1500);
  };

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
          ? 'bg-neutral-900/90 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'bg-neutral-900/80 border-white/5' }`}>
        
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
          onScroll={handleScroll}
          placeholder={disabled ? "Processing..." : "Write your moment..."}
          style={{ height: '48px' }}
          className={`w-full px-4 py-3 min-h-[48px] max-h-[160px] bg-transparent border-none focus:ring-0 resize-none text-base md:text-lg leading-relaxed outline-none overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} text-white placeholder:text-white/40 transition-[height,opacity] duration-200 disabled:opacity-50 pr-12`}
        />

        <div className={`absolute right-2 bottom-2`}>
          <AnimatePresence>
            {text.trim() && !disabled && (
              <motion.button
                key="send-button"
                initial={{ opacity: 0, scale: 0.5, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 10 }}
                whileHover={{ scale: 1.1, color: '#fff' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                aria-label="Send message"
                className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

