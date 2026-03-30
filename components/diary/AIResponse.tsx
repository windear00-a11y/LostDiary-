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

const MOOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Happy: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
  Sad: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  Stressed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  Calm: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  Neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
  Excited: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
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
          className="mt-12 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm shadow-indigo-50/50"
        >
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center md:items-start gap-4 shrink-0 md:w-32">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${aiLoading ? 'bg-indigo-50 animate-pulse' : 'bg-indigo-50'}`}>
                <Sparkles className={`w-7 h-7 ${aiLoading ? 'text-indigo-300' : 'text-[#6366F1]'}`} />
              </div>
              {!aiLoading && aiData?.mood && (
                <div className={`flex items-center gap-2 ${moodStyle.bg} px-4 py-2 rounded-full border ${moodStyle.border}`}>
                  <span className="text-xl">{MOOD_EMOJIS[aiData.mood] || '✨'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${moodStyle.text}`}>{aiData.mood}</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-8">
              {aiLoading ? (
                <div className="space-y-4 py-2">
                  <div className="h-5 bg-indigo-50/50 rounded-full w-3/4 animate-pulse" />
                  <div className="h-5 bg-indigo-50/50 rounded-full w-1/2 animate-pulse" />
                  <div className="h-5 bg-indigo-50/50 rounded-full w-2/3 animate-pulse" />
                </div>
              ) : aiData ? (
                <div className="space-y-8 divide-y divide-gray-50">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">Insight</span>
                    <p className="text-[#111827] font-serif text-xl leading-relaxed italic">
                      &ldquo;{aiData.insight}&rdquo;
                    </p>
                  </div>
                  <div className="space-y-2 pt-8">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">Suggestion</span>
                    <p className="text-[#6B7280] font-serif text-lg leading-relaxed">
                      {aiData.suggestion}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#6B7280] italic font-serif text-lg leading-relaxed whitespace-pre-wrap py-2">
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
