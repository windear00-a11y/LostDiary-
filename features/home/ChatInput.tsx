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
      <div className={`w-full px-5 py-1 rounded-2xl backdrop-blur-md transition-all duration-700 flex items-end gap-2 shadow-sm
        ${isFocused 
          ? 'bg-neutral-900/90 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'bg-neutral-900/80 border-white/10' } border`}>
        <div className="flex-1 relative">
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
            placeholder={disabled ? "Thinking..." : "Write your moment..."}
            style={{ height: '48px' }}
            className="w-full min-h-[48px] max-h-[160px] bg-transparent border-none focus:ring-0 resize-none py-3 text-base md:text-lg leading-relaxed outline-none overflow-y-auto text-white placeholder:text-white/40 transition-[height,opacity] duration-200 disabled:opacity-50"
          />
          {disabled && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 pr-4 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-white/50 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                />
              ))}
            </div>
          )}
        </div>
        <div className="pb-3 pr-1">
          <AnimatePresence>
            {text.trim() && (
              <motion.button
                key="send-button"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 20, y: -20, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={disabled}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors shrink-0"
              >
                <Send className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

