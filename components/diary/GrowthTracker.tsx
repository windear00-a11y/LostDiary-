'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Activity, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateGrowthInsight } from '@/lib/ai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Entry {
  id: string;
  created_at: string;
  content: string;
  mood?: string;
}

interface GrowthTrackerProps {
  entries: Entry[];
  isDrawer?: boolean;
}

export default function GrowthTracker({ entries, isDrawer = false }: GrowthTrackerProps) {
  const [growthInsight, setGrowthInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    const totalWithMood = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      percentage: Math.round((count / totalWithMood) * 100),
    })).sort((a, b) => b.percentage - a.percentage);

    // Writing frequency (entries per week over last 4 weeks)
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => new Date(e.created_at) >= fourWeeksAgo);
    const entriesPerWeek = (recentEntries.length / 4).toFixed(1);

    // Mood trend data for chart
    const moodValues: Record<string, number> = {
      'Happy': 4,
      'Neutral': 3,
      'Stressed': 2,
      'Sad': 1
    };

    const trendData = entries
      .slice(0, 10)
      .reverse()
      .map(e => ({
        date: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: moodValues[e.mood || 'Neutral'] || 3,
        mood: e.mood || 'Neutral'
      }));

    return {
      moodDistribution,
      entriesPerWeek,
      recentCount: recentEntries.length,
      trendData
    };
  }, [entries]);

  const generateGrowthInsightAction = async () => {
    setLoading(true);
    try {
      const result = await generateGrowthInsight(entries);
      setGrowthInsight(result);
    } catch (err) {
      console.error('Growth Insight Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!stats || entries.length < 5) return null;

  return (
    <section className={`${isDrawer ? 'mt-4 pt-4' : 'mt-16 pt-16 border-t'} border-gray-100 dark:border-[#1A1A1A] min-h-[400px]`}>
      <div className={`flex items-center ${isDrawer ? 'justify-start' : 'justify-center sm:justify-start'} gap-3 mb-10 px-0 sm:px-4`}>
        <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" aria-hidden="true" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#6B7280] dark:text-gray-500">
          Growth Journey
        </h2>
      </div>

      <div className={`grid grid-cols-1 ${isDrawer ? '' : 'md:grid-cols-2'} gap-8`}>
        <div className={`space-y-8 bg-white dark:bg-[#1A1A1A] ${isDrawer ? 'p-4 rounded-2xl' : 'p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem]'} border border-gray-100 dark:border-[#2E2E2E] shadow-sm transition-colors duration-300 min-h-[320px]`}>
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-widest text-[#6366F1] font-sans block">Mood Trend</span>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 5]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-[#1A1A1A] p-3 rounded-xl border border-gray-100 dark:border-[#2E2E2E] shadow-xl">
                            <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                            <p className="text-sm font-serif italic text-gray-900 dark:text-white">{payload[0].payload.mood}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-gray-50 dark:border-[#2E2E2E]">
            <span className="text-[10px] uppercase tracking-widest text-[#6366F1] font-sans block">Mood Distribution</span>
            <div className="space-y-5">
              {stats.moodDistribution.slice(0, 3).map((item) => (
                <div key={item.mood} className="space-y-2">
                  <div className="flex justify-between text-xs text-[#6B7280] dark:text-gray-400 font-serif italic">
                    <span>{item.mood}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 dark:bg-[#262626] rounded-full overflow-hidden" aria-hidden="true">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.percentage}%` }}
                      viewport={{ once: true }}
                      className="h-full bg-[#6366F1]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-[#2E2E2E]">
            <span className="text-[10px] uppercase tracking-widest text-[#6366F1] font-sans block mb-3">Habit Summary</span>
            <p className="text-[#111827] dark:text-[#F9FAFB] font-serif text-lg leading-relaxed italic">
              You&apos;ve shared {stats.recentCount} reflections this month, averaging {stats.entriesPerWeek} entries per week. Your consistency is a quiet strength.
            </p>
          </div>
        </div>

        <div className={`${isDrawer ? 'p-4 rounded-2xl' : 'p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem]'} bg-indigo-50/20 dark:bg-indigo-900/5 border border-indigo-100/30 dark:border-indigo-800/20 flex flex-col justify-between shadow-sm transition-colors duration-300 min-h-[320px]`}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6366F1]">
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-widest font-sans">Growth Insight</span>
            </div>
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 py-4"
                >
                  <div className="h-4 bg-indigo-100/50 dark:bg-indigo-900/20 rounded animate-pulse w-full" />
                  <div className="h-4 bg-indigo-100/50 dark:bg-indigo-900/20 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-indigo-100/50 dark:bg-indigo-900/20 rounded animate-pulse w-4/6" />
                </motion.div>
              ) : growthInsight ? (
                <motion.p 
                  key="insight"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#111827] dark:text-[#F9FAFB] font-serif text-lg leading-relaxed italic"
                >
                  &ldquo;{growthInsight}&rdquo;
                </motion.p>
              ) : (
                <p className="text-[#6366F1] font-serif italic text-lg py-4">
                  Reflect on your progress over the last month.
                </p>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={generateGrowthInsightAction}
            disabled={loading}
            aria-label={growthInsight ? 'Refresh Growth Insight' : 'Discover Growth Insight'}
            className="mt-8 self-start text-[10px] uppercase tracking-[0.2em] text-[#6366F1] hover:text-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-30"
          >
            {growthInsight ? 'Refresh Insight' : 'Discover Growth'} 
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3 h-3" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  );
}
