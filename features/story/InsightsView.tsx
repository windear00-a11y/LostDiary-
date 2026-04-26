'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Hash } from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
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
          const sessions = await coreService.fetchSessions(user.id);
          const messages = sessions.length > 0 ? await coreService.fetchMessages(user.id, sessions[0].id) : [];
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

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 gap-6">
        <div className="flex gap-1.5">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </div>
        <p className="text-xs font-serif italic text-gray-400">Discovering patterns in your story...</p>
      </div>
    );
  }

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
    <div className="space-y-12 py-12 text-center">
      <div className="text-center space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Reflections</h3>
        <p className="font-serif italic text-gray-500">Subtle patterns in your journey</p>
      </div>
      <p className="text-gray-400 italic">Pattern analysis coming later.</p>
    </div>
  );
};
