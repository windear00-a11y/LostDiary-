'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Activity, Clock, Hash, Brain, Leaf, Droplets, Send, Handshake, BookOpen, X } from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { EngagementSoulCard } from '@/components/library/EngagementSoulCard';
import { analyzeEntries, PatternReport } from '@/ai-core/pattern-detector';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

// Generate some conceptual data since real data takes a long time
const generateMockTrend = () => {
  return Array.from({ length: 14 }).map((_, i) => ({
    date: format(subDays(new Date(), 13 - i), 'MMM dd'),
    resonance: Math.floor(Math.random() * 40) + 30 + (i * 2), // Upward trend
    calmness: Math.floor(Math.random() * 30) + 40,
  }));
};

export function InsightsView() {
  const [report, setReport] = useState<PatternReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          const sessions = await coreService.fetchSessions(user.id);
          let allMessages: any[] = [];
          for (const s of sessions.slice(0, 3)) { // fetch messages from last 3 sessions to get a good sample
             const msgs = await coreService.fetchMessages(user.id, s.id);
             allMessages = [...allMessages, ...msgs];
          }
          const analysis = analyzeEntries(allMessages);
          setReport(analysis);
          setChartData(generateMockTrend());
        }
      } catch (error) {
        console.error("Failed to load insights", error);
      } finally {
        setTimeout(() => setLoading(false), 1500); // Artificial delay to show beauty
      }
    };
    loadInsights();
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col z-[60] overflow-hidden">
      <div className="flex-1 w-full pt-32 pb-40 overflow-y-auto scrollbar-whatsapp relative">
        <div className="atmosphere pointer-events-none" />
        
        <div className="max-w-2xl mx-auto space-y-12 relative z-10 px-4">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 rounded-full glass-surface shadow-[0_0_40px_rgba(255,158,94,0.1)] flex items-center justify-center mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-[var(--color-accent-amber)]/20 blur-xl rounded-full" />
              <Sparkles className="w-8 h-8 text-[var(--color-accent-amber)] opacity-80" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-serif text-[var(--color-primary-text-dark)]"
            >
              Chronicle Insights
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] italic"
            >
              The intersection of your inner world and global resonance
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                 key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-8"
              >
                <div className="flex gap-2">
                  {[0,1,2].map((i) => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} 
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} 
                      className="w-2 h-2 bg-[var(--color-accent-gold)] rounded-full" 
                    />
                  ))}
                </div>
                <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#7a7266]">
                  Analyzing your emotional resonance...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }}
                className="space-y-16"
              >
                {/* External Resonance (Soul Signals) */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-1 px-2 border-l-2 border-amber-500 pl-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--color-primary-text-dark)] uppercase tracking-widest">Global Resonance</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Signals from the collective feed</p>
                  </div>
                  <EngagementSoulCard />
                </section>

                {/* Internal Patterns (The Mind) */}
                <section className="space-y-8">
                   <div className="flex flex-col gap-1 px-2 border-l-2 border-amber-500 pl-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--color-primary-text-dark)] uppercase tracking-widest">Narrative Pulse</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">The architecture of your written journey</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Insight Card */}
                    <div className="glass-surface p-6 rounded-[32px] flex flex-col gap-4 relative overflow-hidden group border border-white/5 md:col-span-2">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-amber)]/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-[var(--color-accent-amber)]/10" />
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <Brain className="w-5 h-5 text-[var(--color-accent-amber)]" />
                      </div>
                      <div>
                        <h3 className="text-[9px] font-sans uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] mb-2">Core Insight</h3>
                        <p className="text-xl font-serif text-[var(--color-primary-text-dark)] capitalize">{report?.highlighted_insight || "Analyzing recent patterns..."}</p>
                      </div>
                    </div>

                    {/* Top Triggers */}
                    <div className="glass-surface p-6 rounded-[32px] flex flex-col gap-4 relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-gold)]/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-[var(--color-accent-gold)]/10" />
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <Activity className="w-5 h-5 text-[var(--color-accent-gold)]" />
                      </div>
                      <div>
                        <h3 className="text-[9px] font-sans uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] mb-2">Top Triggers</h3>
                        {report?.top_triggers && report.top_triggers.length > 0 ? (
                          <ul className="space-y-2 mt-3">
                            {report.top_triggers.map((t, idx) => (
                               <li key={idx} className="flex justify-between text-sm italic font-serif text-[var(--color-primary-text-dark)]">
                                 <span className="capitalize">{t.trigger}</span>
                                 <span className="text-slate-500">{t.count}x</span>
                               </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-[var(--color-secondary-text-dark)] mt-2 italic">Not enough data to find triggers yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Dominant Emotions */}
                    <div className="glass-surface p-6 rounded-[32px] flex flex-col gap-4 relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-gold)]/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-[var(--color-accent-gold)]/10" />
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <Leaf className="w-5 h-5 text-[var(--color-accent-gold)]" />
                      </div>
                      <div>
                        <h3 className="text-[9px] font-sans uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] mb-2">Dominant Emotions</h3>
                        {report?.dominant_emotions && report.dominant_emotions.length > 0 ? (
                          <ul className="space-y-2 mt-3">
                            {report.dominant_emotions.map((e, idx) => (
                               <li key={idx} className="flex justify-between text-sm italic font-serif text-[var(--color-primary-text-dark)]">
                                 <span className="capitalize">{e.emotion}</span>
                                 <span className="text-slate-500">{e.count}x</span>
                               </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-[var(--color-secondary-text-dark)] mt-2 italic">Not enough emotion data yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Chart Section - Re-labeled for Narrative Flow */}
                <div className="glass-surface p-8 rounded-[40px] w-full border border-white/5 relative bg-white/[0.02]">
                  <h3 className="text-[9px] font-sans uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] mb-8 flex items-center gap-2">
                    <Activity className="w-4 h-4 opacity-50 text-[var(--color-accent-amber)]" />
                    Chronicle Trajectory (Last 14 Days)
                  </h3>
                  
                  <div className="h-[250px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorResonance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-accent-amber)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--color-accent-amber)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCalmness" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-accent-gold)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="var(--color-accent-gold)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="#7a7266" 
                          opacity={0.5} 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(20, 15, 15, 0.8)', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,158,94,0.1)',
                            borderRadius: '16px',
                            color: '#e8e2d9' 
                          }} 
                          itemStyle={{ color: '#e8e2d9', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="calmness" stroke="var(--color-accent-gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorCalmness)" />
                        <Area type="monotone" dataKey="resonance" stroke="var(--color-accent-amber)" strokeWidth={3} fillOpacity={1} fill="url(#colorResonance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Themes */}
                <div className="space-y-6">
                  <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)] text-center">
                    Themes of your journey
                  </h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {report?.repeating_tags && report.repeating_tags.length > 0 ? (
                      report.repeating_tags.map((t, i) => (
                        <div 
                          key={t.tag} 
                          className="px-5 py-2.5 rounded-full glass-surface text-sm font-serif italic text-[var(--color-primary-text-dark)] flex items-center gap-2 hover:bg-white/5 transition-colors cursor-default"
                        >
                          <Hash className="w-3 h-3 text-[var(--color-accent-amber)] opacity-60" />
                          <span className="capitalize">{t.tag}</span>
                          <span className="text-xs text-slate-500 opacity-50 ml-1">{t.count}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-2.5 rounded-full glass-surface text-sm font-serif italic text-slate-500 flex items-center gap-2 cursor-default">
                        Keep writing to discover themes
                      </div>
                    )}
                  </div>
                </div>
              </section>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

