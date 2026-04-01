'use client';

import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIResponseProps {
  aiLoading: boolean;
  aiResponse: string | null;
}

const MOOD_EMOJIS: Record<string, string> = {
  Happy: '😊',
  Sad: '😔',
  Stressed: '😤',
  Neutral: '😐',
  Excited: '🔥',
  Calm: '😌',
};

const MOOD_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  Happy: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', darkBg: 'dark:bg-yellow-900/10', darkText: 'dark:text-yellow-500', darkBorder: 'dark:border-yellow-900/20' },
  Sad: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', darkBg: 'dark:bg-blue-900/10', darkText: 'dark:text-blue-500', darkBorder: 'dark:border-blue-900/20' },
  Stressed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', darkBg: 'dark:bg-red-900/10', darkText: 'dark:text-red-500', darkBorder: 'dark:border-red-900/20' },
  Calm: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', darkBg: 'dark:bg-green-900/10', darkText: 'dark:text-green-500', darkBorder: 'dark:border-green-900/20' },
  Neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', darkBg: 'dark:bg-gray-900/10', darkText: 'dark:text-gray-500', darkBorder: 'dark:border-gray-900/20' },
  Excited: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', darkBg: 'dark:bg-indigo-900/10', darkText: 'dark:text-indigo-500', darkBorder: 'dark:border-indigo-900/20' },
};

export default function AIResponse({ aiLoading, aiResponse }: AIResponseProps) {
  let aiData: { mood?: string; insight?: string; suggestion?: string } | null = null;
  
  if (aiResponse) {
    try {
      aiData = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response in component:', e);
    }
  }

  const moodStyle = aiData?.mood ? (MOOD_COLORS[aiData.mood] || MOOD_COLORS.Neutral) : MOOD_COLORS.Neutral;

  return (
    <AnimatePresence>
      {(aiLoading || aiResponse) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-12 p-10 bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm shadow-indigo-50/50 dark:shadow-none transition-colors duration-300"
        >
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center md:items-start gap-4 shrink-0 md:w-32">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${aiLoading ? 'bg-indigo-50 dark:bg-indigo-900/10 animate-pulse' : 'bg-indigo-50 dark:bg-indigo-900/10'}`}>
                <Sparkles className={`w-7 h-7 ${aiLoading ? 'text-indigo-300 dark:text-indigo-700' : 'text-[#6366F1]'}`} />
              </div>
              {!aiLoading && aiData?.mood && (
                <div className={`flex items-center gap-2 ${moodStyle.bg} ${moodStyle.darkBg} px-4 py-2 rounded-full border ${moodStyle.border} ${moodStyle.darkBorder}`}>
                  <span className="text-xl">{MOOD_EMOJIS[aiData.mood] || '✨'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${moodStyle.text} ${moodStyle.darkText}`}>{aiData.mood}</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-8">
              {aiLoading ? (
                <div className="space-y-4 py-2">
                  <div className="h-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full w-3/4 animate-pulse" />
                  <div className="h-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full w-1/2 animate-pulse" />
                  <div className="h-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full w-2/3 animate-pulse" />
                </div>
              ) : aiData ? (
                <div className="space-y-8 divide-y divide-gray-50 dark:divide-[#2E2E2E]">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">Insight</span>
                    <p className="text-[#111827] dark:text-[#F9FAFB] font-serif text-xl leading-relaxed italic">
                      &ldquo;{aiData.insight}&rdquo;
                    </p>
                  </div>
                  <div className="space-y-2 pt-8">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">Suggestion</span>
                    <p className="text-[#6B7280] dark:text-gray-400 font-serif text-lg leading-relaxed">
                      {aiData.suggestion}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#6B7280] dark:text-gray-400 italic font-serif text-lg leading-relaxed whitespace-pre-wrap py-2">
                  {aiResponse}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
