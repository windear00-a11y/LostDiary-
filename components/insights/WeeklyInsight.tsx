'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { memorySystem } from '@/lib/memory-system';
import { weeklyInsightGenerator } from '@/ai-core/weekly-insight';

/**
 * WeeklyInsight Component
 * Displays a single, impactful line summarizing the user's week.
 */
export const WeeklyInsight: React.FC = () => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const memory = memorySystem.getMemory();
    
    // Check if it's already dismissed in this session
    const dismissed = sessionStorage.getItem('windear_weekly_insight_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // 1. Check if we have enough data (3+ entries)
    // 2. Check if it's been a week since the last insight
    if (memory.recent_entries.length >= 3 && weeklyInsightGenerator.shouldShowWeeklyInsight()) {
      const generated = weeklyInsightGenerator.generateWeeklyInsight({
        emotional_trend: memory.emotional_trend,
        dominant_emotion: memory.dominant_emotion,
        recurring_topics: memory.recurring_patterns,
        risk_flag: memory.risk_flag
      });
      setInsight(generated);
      weeklyInsightGenerator.recordInsightShown();
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('windear_weekly_insight_dismissed', 'true');
  };

  if (!insight || isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative p-6 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-xl shadow-indigo-500/5 overflow-hidden group"
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
      
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/70 dark:text-indigo-400/50">
            Weekly Reflection
          </h4>
          <p className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">
            &quot;{insight}&quot;
          </p>
        </div>
      </div>
    </motion.div>
  );
};
