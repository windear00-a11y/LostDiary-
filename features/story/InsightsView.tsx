'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Hash } from 'lucide-react';
import { chatService } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { analyzeEntries, PatternReport } from '@/ai-core/pattern-detector';

export const InsightsView = () => {
  const [report, setReport] = useState<PatternReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          const messages = await chatService.fetchMessages(user.id);
          const analysis = analyzeEntries(messages.map(m => m.content || ""));
          setReport(analysis);
        }
      } catch (error) {
        console.error("Failed to load insights", error);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, []);

  if (loading || !report) return null;

  const insights = [
    {
      label: "Emotional Trend",
      value: report.emotional_trend.charAt(0).toUpperCase() + report.emotional_trend.slice(1),
      icon: report.emotional_trend === 'improving' ? TrendingUp : report.emotional_trend === 'declining' ? TrendingDown : Minus,
      color: report.emotional_trend === 'improving' ? 'text-emerald-500' : report.emotional_trend === 'declining' ? 'text-rose-500' : 'text-gray-400',
      description: report.emotional_trend === 'improving' ? "You've been feeling more positive lately." : report.emotional_trend === 'declining' ? "Things have been a bit heavy recently." : "Your mood has been steady."
    },
    {
      label: "Dominant Mood",
      value: report.dominant_emotion.charAt(0).toUpperCase() + report.dominant_emotion.slice(1),
      icon: Sparkles,
      color: 'text-indigo-500',
      description: `You've been feeling mostly ${report.dominant_emotion} in your entries.`
    },
    {
      label: "Recurring Themes",
      value: report.recurring_topics.length > 0 ? report.recurring_topics.slice(0, 3).join(', ') : "None yet",
      icon: Hash,
      color: 'text-amber-500',
      description: "Topics that have been on your mind frequently."
    }
  ];

  return (
    <div className="space-y-12 py-12">
      <div className="text-center space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Reflections</h3>
        <p className="font-serif italic text-gray-500">Subtle patterns in your journey</p>
      </div>

      <div className="grid gap-8">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-6 group"
          >
            <div className={`mt-1 p-2 rounded-xl bg-gray-50 dark:bg-white/5 ${insight.color}`}>
              <insight.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                {insight.label}
              </h4>
              <p className="text-lg font-serif text-gray-800 dark:text-gray-200">
                {insight.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                {insight.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
