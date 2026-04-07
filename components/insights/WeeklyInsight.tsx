'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { memorySystem } from '@/lib/memory-system';
import { weeklyInsightGenerator } from '@/ai-core/weekly-insight';

/**
 * WeeklyInsight Component
 * Displays a single, impactful line summarizing the user's week.
 */
export const WeeklyInsight: React.FC = () => {
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    const memory = memorySystem.getMemory();
    
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

  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/20"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500/70 dark:text-indigo-400/50">
            Weekly Reflection
          </h4>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">
            &quot;{insight}&quot;
          </p>
        </div>
      </div>
    </motion.div>
  );
};
