'use client';

import React, { useState, useRef } from 'react';
import { Send, Brain, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';

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
  
  const { chatPersonaMode, setChatPersonaMode, isBrutalHonestyOn, setIsBrutalHonestyOn } = useUIStore();

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
    <div className="w-full relative group font-sans">
      <div className={`relative w-full rounded-3xl backdrop-blur-3xl transition-all duration-700 ease-out border
        ${isFocused 
          ? 'bg-white/[0.05] border-white/20 shadow-[0_10px_40px_rgba(255,158,94,0.08)]' 
          : 'bg-white/[0.02] border-white/5 shadow-sm' }`}>
        
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
          placeholder={disabled ? "Listening..." : "Whisper your thoughts..."}
          style={{ height: '48px' }}
          className={`w-full px-6 py-3 min-h-[48px] max-h-[160px] bg-transparent border-none focus:ring-0 resize-none text-[15px] sm:text-base leading-relaxed outline-none overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} text-[var(--color-primary-text-dark)] placeholder:text-[var(--color-secondary-text-dark)] placeholder:italic transition-[height,opacity] duration-200 disabled:opacity-50 pl-24 pr-14`}
        />

        <div className="absolute left-2 bottom-1.5 z-10 flex gap-0.5">
          <button 
             onClick={() => setChatPersonaMode(chatPersonaMode === 'mirror' ? 'guide' : 'mirror')}
             title={`Persona: ${chatPersonaMode}`}
             className={`p-2 rounded-full transition-colors ${chatPersonaMode === 'mirror' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
          >
            <Brain size={16} />
          </button>
          <button 
             onClick={() => setIsBrutalHonestyOn(!isBrutalHonestyOn)}
             title={`Brutal Honesty: ${isBrutalHonestyOn ? 'On' : 'Off'}`}
             className={`p-2 rounded-full transition-colors ${isBrutalHonestyOn ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Flame size={16} />
          </button>
        </div>

        <div className={`absolute right-2 bottom-2`}>
          <AnimatePresence>
            {text.trim() && !disabled ? (
              <motion.button
                key="send-button"
                type="button"
                initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevents blur before send
                  handleSend();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // handleSend is already called by onPointerDown for touch/mouse
                  // but we keep onClick logic for accessibility/tab-navigation
                }}
                aria-label="Send message"
                className="w-11 h-11 bg-[var(--color-accent-amber)] text-[var(--color-primary-text-light)] rounded-full shadow-[0_8px_24px_rgba(255,158,94,0.35)] shrink-0 flex items-center justify-center transition-all focus:outline-none active:bg-[var(--color-accent-amber)]/80"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </motion.button>
            ) : (
                <div className="w-11 h-11" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

