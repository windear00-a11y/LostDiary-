'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Handshake, Sparkles, BookOpen, Activity, Leaf, Droplets, ChevronDown } from 'lucide-react';

interface EngagementMetrics {
  luminous_lines: number;
  resonances: number;
  paper_planes: number;
  active_bridges: number;
  spin_threads: number;
  energy_jar: {
    hope: number;
    tear: number;
    resonance: number;
  };
  shining_moments: {
    text: string;
    count: number;
    storyTitle: string;
  }[];
}

export const EngagementSoulCard = () => {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShiningMoments, setShowShiningMoments] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/profile/engagement');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Failed to fetch engagement metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-slate-100 dark:bg-white/5 rounded-3xl" />
      ))}
    </div>
  );

  if (!metrics) return null;

  const energyCards = [
    { label: 'Hope Given', value: metrics.energy_jar.hope, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'authored hope' },
    { label: 'Tears Shared', value: metrics.energy_jar.tear, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'soul touching' },
    { label: 'Deep Resonance', value: metrics.energy_jar.resonance, icon: Handshake, color: 'text-amber-500', bg: 'bg-amber-500/10', description: 'shared truth' },
  ];

  const coreCards = [
    { label: 'Paper Planes', value: metrics.paper_planes, icon: Send, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Soul Bridges', value: metrics.active_bridges, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-10 mb-20">
      {/* 1. The Energy Jar - Mood Breakdown */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1 px-2 border-l-2 border-amber-500 pl-4">
          <h3 className="text-sm font-serif font-bold text-[var(--color-primary-text-dark)]">The Energy Jar</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Emotional residues left by your readers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {energyCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-6 bg-white dark:bg-[#0c0c0c] border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden hover:border-amber-500/20 transition-all shadow-sm"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full -mr-8 -mt-8 opacity-40 blur-2xl group-hover:opacity-60 transition-opacity`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-[var(--color-primary-text-dark)]">{card.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. Luminous Lines - Constellation Mapping (Paragraph Engagement) */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1 px-2 border-l-2 border-amber-500 pl-4">
          <h3 className="text-sm font-serif font-bold text-[var(--color-primary-text-dark)]">Luminous Lines</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Constellations of resonance in your paragraphs</p>
        </div>
        
        <div 
          onClick={() => setShowShiningMoments(!showShiningMoments)}
          className="relative p-8 bg-gradient-to-br from-slate-900 to-black rounded-[40px] border border-white/5 overflow-hidden group cursor-pointer"
        >
          {/* Constellation Glow Effect */}
          <div className="absolute inset-0 opacity-20">
             {[...Array(20)].map((_, i) => (
               <motion.div 
                 key={i}
                 animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                 transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
                 className="absolute w-1 h-1 bg-amber-400 rounded-full"
                 style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
               />
             ))}
          </div>

          <div className="relative flex flex-col items-center justify-center text-center space-y-4">
             <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/20">
                   <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-r from-amber-500/50 to-transparent" />
                <div className="text-5xl font-serif font-bold text-white tracking-tighter">{metrics.resonances}</div>
             </div>
             <div>
                <p className="text-amber-200/80 font-serif italic text-lg leading-tight">
                  Your words have kindled {metrics.resonances} luminous lines.
                </p>
                <div className="mt-3 flex flex-col items-center gap-2">
                   <p className="text-[10px] text-amber-200/40 uppercase tracking-[0.3em] font-bold">
                     Click to reveal the shining moments
                   </p>
                   <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                   >
                    <ChevronDown className="w-4 h-4 text-amber-500/40" />
                   </motion.div>
                </div>
             </div>
          </div>
        </div>

        {/* Shining Moments Detail List */}
        <AnimatePresence>
          {showShiningMoments && metrics.shining_moments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              {metrics.shining_moments.map((moment, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 mb-1">In &quot;{moment.storyTitle}&quot;</p>
                      <p className="text-sm font-serif italic text-slate-700 dark:text-amber-100/80 leading-relaxed">
                        &quot;{moment.text}&quot;
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10">
                       <span className="text-lg font-serif font-bold text-amber-500">{moment.count}</span>
                       <span className="text-[8px] font-bold uppercase tracking-tighter text-amber-600">Echoes</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Spun Threads & Bridge Connectivity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Connections */}
        <div className="grid grid-cols-1 gap-4">
          {coreCards.map((card, idx) => (
            <div key={card.label} className="flex items-center justify-between p-6 bg-slate-100/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[32px]">
               <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</span>
               </div>
               <div className="text-2xl font-serif font-bold text-[var(--color-primary-text-dark)]">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Spun Threads - The Woven Legacy */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden p-8 bg-gradient-to-br from-amber-600 via-violet-700 to-purple-800 rounded-[40px] text-white shadow-2xl shadow-amber-500/30 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20">
             <BookOpen className="w-32 h-32 text-white -mr-16 -mt-16 rotate-12" />
          </div>

          <div className="relative space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 mb-4">
               <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Woven Legacy</p>
            <h4 className="text-2xl font-serif font-bold leading-tight">
               {metrics.spin_threads === 0 
                ? "Your needle is poised, waiting to spin the first thread." 
                : `${metrics.spin_threads} Souls Spun New Threads`}
            </h4>
            <p className="text-xs font-serif italic text-white/50 pt-2 border-t border-white/10">
               {metrics.spin_threads > 0 
                ? "Your story was the source code for their next chapter."
                : "When your story inspires another's entry, a thread is spun here."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
