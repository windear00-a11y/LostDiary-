'use client';

import React from 'react';
import { Sparkles, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { memorySystem } from '@/lib/memory-system';
import { retentionSystem } from '@/lib/retention-system';
import { InsightCard } from '@/components/ui/InsightCard';

export const InsightsPanel: React.FC = () => {
  const memory = memorySystem.getMemory();
  const streak = retentionSystem.getStreak();

  return (
    <div className="p-6 space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Insights</h3>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-4">
        <InsightCard
          icon={Calendar}
          title="Consistency"
          value={streak}
          unit="day streak"
          description={streak > 0 ? "You're building a great habit. Keep it up!" : "Start your journey today by writing your first entry."}
          colorClass="text-orange-500"
        />

        <InsightCard
          icon={TrendingUp}
          title="Mood Trend"
          value={memory.emotional_trend}
          indicatorColor={
            memory.emotional_trend === 'improving' ? 'bg-green-500' : 
            memory.emotional_trend === 'declining' ? 'bg-red-500' : 'bg-indigo-500'
          }
          description={
            memory.emotional_trend === 'improving' 
              ? "Your mood has been on a positive trajectory lately." 
              : memory.emotional_trend === 'declining'
              ? "Things have been a bit heavy. Remember to be kind to yourself."
              : "Your emotional state has been steady and balanced."
          }
          colorClass="text-indigo-500"
        />

        <div className="p-5 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] space-y-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Growth Summary</span>
          </div>
          <div className="space-y-2">
            {memory.recurring_patterns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.recurring_patterns.slice(0, 3).map((topic, i) => (
                  <span key={i} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-100 dark:border-emerald-900/20">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No patterns detected yet.</p>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {memory.recurring_patterns.length > 0 
              ? `You've been reflecting a lot on ${memory.recurring_patterns[0]}. This awareness is the first step to growth.`
              : "Keep writing to discover the patterns in your thoughts."}
          </p>
        </div>
      </div>
    </div>
  );
};
