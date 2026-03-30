'use client';

import { useState, useMemo } from 'react';
import { Sparkles, BarChart2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateWeeklyReflection } from '@/lib/ai';

interface Entry {
  id: string;
  created_at: string;
  content: string;
  mood?: string;
}

interface WeeklyReflectionProps {
  entries: Entry[];
}

export default function WeeklyReflection({ entries }: WeeklyReflectionProps) {
  const [reflection, setReflection] = useState<{ trend: string; pattern: string; suggestion: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const last7DaysEntries = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return entries.filter(e => new Date(e.created_at) >= sevenDaysAgo);
  }, [entries]);

  const canReflect = last7DaysEntries.length >= 3;

  const generateReflection = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateWeeklyReflection(last7DaysEntries);
      setReflection(result);
    } catch (err) {
      console.error('Weekly Reflection Error:', err);
      setError("Failed to generate reflection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!canReflect && !reflection) return null;

  return (
    <section className="mt-16 pt-16 border-t border-gray-100">
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#6B7280]">
            Weekly Reflection
          </h2>
        </div>
        
        {!reflection && !loading && (
          <button 
            onClick={generateReflection}
            className="text-[10px] uppercase tracking-[0.2em] text-[#6366F1] hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            Generate <Sparkles className="w-3 h-3" />
          </button>
        )}

        {reflection && !loading && (
          <button 
            onClick={generateReflection}
            className="text-[10px] uppercase tracking-[0.2em] text-[#6366F1] hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            Refresh <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-indigo-50/20 p-12 rounded-[3rem] border border-indigo-100/30 flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-10 h-10 border-2 border-indigo-100 border-t-[#6366F1] rounded-full animate-spin" />
            <p className="text-[#6366F1] font-serif italic">Analyzing your week...</p>
          </motion.div>
        ) : reflection ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50/10 p-10 md:p-16 rounded-[3rem] border border-indigo-100/20 shadow-sm space-y-12"
          >
            <div className="space-y-4 text-center max-w-2xl mx-auto">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#6366F1] font-bold">The Week&apos;s Trend</span>
              <p className="text-[#111827] font-serif text-3xl md:text-4xl leading-tight italic">
                &ldquo;{reflection.trend}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-indigo-100/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold">Observed Pattern</span>
                </div>
                <p className="text-[#111827] font-serif text-xl leading-relaxed">
                  {reflection.pattern}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold">A Gentle Suggestion</span>
                </div>
                <p className="text-[#111827] font-serif text-xl leading-relaxed">
                  {reflection.suggestion}
                </p>
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <p className="text-[#6B7280] font-serif italic text-center py-8">{error}</p>
        ) : (
          <div className="bg-indigo-50/10 p-12 rounded-[3rem] border border-dashed border-indigo-100/50 text-center">
            <p className="text-[#6B7280] font-serif italic text-lg mb-2">
              You&apos;ve shared {last7DaysEntries.length} reflections this week. No pressure, just express.
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300">
              Ready for a deeper look?
            </p>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
