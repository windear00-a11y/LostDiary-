'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

interface Entry {
  id: string;
  created_at: string;
  content: string;
  mood?: string;
}

interface ConsistencyTrackerProps {
  entries: Entry[];
}

export default function ConsistencyTracker({ entries }: ConsistencyTrackerProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get unique dates of entries
    const entryDates = entries.map(e => new Date(e.created_at).toDateString());
    const uniqueDates = Array.from(new Set(entryDates)).map(d => new Date(d));

    const last7DaysCount = uniqueDates.filter(d => d >= sevenDaysAgo).length;
    const last30DaysCount = uniqueDates.filter(d => d >= thirtyDaysAgo).length;

    return {
      last7DaysCount,
      last30DaysCount,
      uniqueDates
    };
  }, [entries]);

  // Generate dots for the last 7 days
  const weekDots = useMemo(() => {
    const dots = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const hasEntry = stats.uniqueDates.some(d => d.toDateString() === date.toDateString());
      dots.push({ date, hasEntry });
    }
    return dots;
  }, [stats.uniqueDates]);

  if (entries.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 mb-8 p-8 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm transition-colors duration-300"
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <p className="text-[#111827] dark:text-[#F9FAFB] font-serif text-lg italic">
            {stats.last7DaysCount === 0 
              ? "Write whenever you feel like. I'm here."
              : `You showed up ${stats.last7DaysCount} ${stats.last7DaysCount === 1 ? 'time' : 'times'} this week.`}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6366F1] font-bold">
            No pressure, just express.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {weekDots.map((dot, i) => (
            <div 
              key={i}
              title={dot.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              aria-label={`${dot.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${dot.hasEntry ? 'Entry written' : 'No entry'}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                dot.hasEntry 
                  ? 'bg-[#6366F1] scale-110 shadow-sm shadow-indigo-100 dark:shadow-none' 
                  : 'bg-gray-100 dark:bg-[#262626]'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
