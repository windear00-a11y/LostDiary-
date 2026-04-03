'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

interface HeaderAssistantProps {
  onStartChat?: () => void;
  t: (key: string) => string;
}

export function HeaderAssistant({ onStartChat, t }: HeaderAssistantProps) {
  const router = useRouter();
  const suggestions = [
    "Aaj ka din kaisa raha?",
    "Kuch 'Man ki Baat' karni hai?",
    "WinDear Soul se baat karein...",
    "Apne dil ki baat kahein...",
    "Kaisa feel kar rahe hain aap?"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [suggestions.length]);

  const handleClick = () => {
    if (onStartChat) {
      onStartChat();
    } else {
      router.push('/assistant');
    }
  };

  return (
    <div 
      className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4"
      onClick={handleClick}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-10 px-4 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-full flex items-center justify-between gap-3 group transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-[#252525] shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="relative h-5 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute inset-0 text-sm text-gray-500 dark:text-gray-400 truncate text-left"
              >
                {suggestions[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat <ArrowRight className="w-3 h-3" />
        </div>
      </motion.button>
    </div>
  );
}
