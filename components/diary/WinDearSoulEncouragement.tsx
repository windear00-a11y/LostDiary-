'use client';

import { motion } from 'motion/react';
import { Sparkles, MessageCircle, Heart, ArrowRight } from 'lucide-react';

import { useRouter } from 'next/navigation';

interface WinDearSoulEncouragementProps {
  onStartChat?: () => void;
  t: any;
}

export function WinDearSoulEncouragement({ onStartChat, t }: WinDearSoulEncouragementProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onStartChat) {
      onStartChat();
    } else {
      router.push('/assistant');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group cursor-pointer"
      onClick={handleClick}
    >
      {/* Decorative background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative p-6 sm:p-8 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-50" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-2xl opacity-50" />

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
              <Heart className="w-3 h-3 fill-current" />
              <span>WinDear Soul</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">
              {t('assistant.encourage.title', 'Kuch "Man ki Baat" karni hai?')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('assistant.encourage.subtitle', 'WinDear Soul hamesha aapki baat sunne ke liye taiyaar hai. Aaj aapka din kaisa raha?')}
            </p>
          </div>

          <div className="shrink-0">
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-bold hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-gray-900/10 dark:shadow-white/5">
              <span>Baat Karein</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
