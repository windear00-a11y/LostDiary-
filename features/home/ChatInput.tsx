'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, Flame, Compass, X } from 'lucide-react';
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
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speedDialRef = useRef<HTMLDivElement>(null);
  
  const { chatPersonaMode, setChatPersonaMode, isBrutalHonestyOn, setIsBrutalHonestyOn } = useUIStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedDialRef.current && !speedDialRef.current.contains(event.target as Node)) {
        setIsSpeedDialOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className={`relative w-full rounded-2xl backdrop-blur-[40px] transition-all duration-700 ease-out border
        ${isFocused 
          ? 'bg-white/[0.04] border-white/20 shadow-[0_10px_40px_rgba(255,158,94,0.06)]' 
          : 'bg-white/[0.02] border-white/[0.05] shadow-lg' }`}>
        
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
          className={`w-full px-6 py-3 min-h-[48px] max-h-[160px] bg-transparent border-none focus:ring-0 resize-none text-[15px] sm:text-base leading-relaxed outline-none overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} text-[var(--color-primary-text-dark)] placeholder:text-[var(--color-secondary-text-dark)] placeholder:italic transition-[height,opacity] duration-200 disabled:opacity-50 pl-[3.25rem] pr-14`}
        />

        <div className="absolute left-2 bottom-2 z-20" ref={speedDialRef}>
          <AnimatePresence>
            {isSpeedDialOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-12 left-0 flex flex-col gap-2 mb-2 p-2 rounded-2xl bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-3 px-2 py-1">
                  <button 
                    onClick={() => {
                      setChatPersonaMode(chatPersonaMode === 'mirror' ? 'guide' : 'mirror');
                      setIsSpeedDialOpen(false);
                    }}
                    title={`Switch Persona`}
                    className={`p-2.5 rounded-full transition-colors flex items-center gap-3 w-full hover:bg-white/5 whitespace-nowrap ${chatPersonaMode === 'mirror' ? 'text-emerald-500' : 'text-amber-500'}`}
                  >
                    {chatPersonaMode === 'mirror' ? <Compass size={18} /> : <Brain size={18} />}
                    <span className="text-sm font-medium text-white/80">Switch to {chatPersonaMode === 'mirror' ? 'Guide' : 'Mirror'}</span>
                  </button>
                </div>
                <div className="w-full h-[1px] bg-white/5" />
                <div className="flex items-center gap-3 px-2 py-1">
                  <button 
                    onClick={() => {
                      setIsBrutalHonestyOn(!isBrutalHonestyOn);
                      setIsSpeedDialOpen(false);
                    }}
                    title={`Brutal Honesty: ${isBrutalHonestyOn ? 'On' : 'Off'}`}
                    className={`p-2.5 rounded-full transition-colors flex items-center gap-3 w-full hover:bg-white/5 whitespace-nowrap ${isBrutalHonestyOn ? 'text-slate-400' : 'text-red-500'}`}
                  >
                    <Flame size={18} />
                    <span className="text-sm font-medium text-white/80">{isBrutalHonestyOn ? 'Turn Off Brutal Honesty' : 'Turn On Brutal Honesty'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeedDialOpen ? 'bg-white/10 text-white' : `bg-transparent hover:bg-white/5 disabled:opacity-50 ${chatPersonaMode === 'mirror' ? 'text-amber-500/80 hover:text-amber-500' : 'text-emerald-500/80 hover:text-emerald-500'}`}`}
            type="button"
            disabled={disabled}
          >
            {isSpeedDialOpen ? <X size={20} /> : (chatPersonaMode === 'mirror' ? <Brain size={20} /> : <Compass size={20} />)}
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

