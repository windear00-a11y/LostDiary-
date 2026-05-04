'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Target, Zap, FlaskConical, Compass, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
import { 
  coreService, 
  CoreValue, 
  EnergyMap, 
  Experiment, 
  DirectionInsight, 
  EvolutionTrend 
} from '@/lib/services/core-service';
import { useAuth } from '@/components/auth/AuthProvider';

export function InsightDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Mock data for UI presentation since we don't have AI populating it yet
  const values: CoreValue[] = [
    { id: '1', user_id: 'x', value_name: 'Independence', confidence_score: 0.9, created_at: new Date().toISOString() },
    { id: '2', user_id: 'x', value_name: 'Growth', confidence_score: 0.85, created_at: new Date().toISOString() }
  ];

  const energyMaps: EnergyMap[] = [
    { id: '1', user_id: 'x', activity_type: 'Problem-solving', energy_level: 'energizing', confidence_score: 0.88, created_at: new Date().toISOString() },
    { id: '2', user_id: 'x', activity_type: 'Repetitive tasks', energy_level: 'draining', confidence_score: 0.92, created_at: new Date().toISOString() }
  ];

  const experiments: Experiment[] = [
    { id: '1', user_id: 'x', title: 'The Mentor Experience', description: 'Take 1 day to teach someone a concept you know well.', status: 'active', findings: null, created_at: new Date().toISOString(), completed_at: null },
    { id: '2', user_id: 'x', title: 'Deep Focus Block', description: 'Work for 2 hours without any distractions or phone checks.', status: 'completed', findings: 'Felt very productive but mentally tired afterwards.', created_at: new Date().toISOString(), completed_at: new Date().toISOString() }
  ];

  const directionInsights: DirectionInsight[] = [
    { id: '1', user_id: 'x', content: 'You perform best in roles that require guiding people rather than executing tasks.', insight_type: 'role', is_read: true, created_at: new Date().toISOString() },
    { id: '2', user_id: 'x', content: 'You function better when given independent projects rather than highly collaborative ones.', insight_type: 'environment', is_read: false, created_at: new Date().toISOString() }
  ];

  const trends: EvolutionTrend[] = [
    { id: '1', user_id: 'x', trend_description: 'Over the last 2 months, you have naturally shifted towards creation-oriented activities.', time_period: 'last 2 months', created_at: new Date().toISOString() },
    { id: '2', user_id: 'x', trend_description: 'Your ability to focus has significantly improved compared to your early entries.', time_period: 'last 3 months', created_at: new Date().toISOString() }
  ];

  useEffect(() => {
    // In a real implementation, we would fetch from coreService
    // coreService.fetchDirectionData(user.id);
    setTimeout(() => setLoading(false), 800);
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Compass className="w-8 h-8 text-[var(--color-accent-amber)]/40" />
        </motion.div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)] animate-pulse">Syncing Direction Layer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 mb-12">
        <h2 className="text-2xl font-serif text-[var(--color-primary-text-dark)]">Direction Engine</h2>
        <p className="text-[12px] font-serif italic text-[var(--color-secondary-text-dark)]">
          &quot;Awareness gives you understanding. Direction puts you on the path.&quot;
        </p>
      </div>

      {/* Values & Energy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Values */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--color-accent-amber)]/10 rounded-full">
              <Target className="w-4 h-4 text-[var(--color-accent-amber)]" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Extracted Values</h3>
          </div>
          <div className="space-y-3">
            {values.map(val => (
              <div key={val.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <span className="text-[14px] text-[var(--color-primary-text-dark)] font-medium capitalize">{val.value_name}</span>
                <span className="text-[9px] uppercase tracking-widest text-[var(--color-accent-amber)]/60">Core Driver</span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy Map */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Energy Map</h3>
          </div>
          <div className="space-y-3">
            {energyMaps.map(map => (
               <div key={map.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                 <span className="text-[13px] text-[var(--color-primary-text-dark)] font-medium">{map.activity_type}</span>
                 {map.energy_level === 'energizing' ? (
                   <span className="text-[9px] uppercase tracking-widest text-emerald-400/80 bg-emerald-400/10 px-2 py-1 rounded-full">Energizing</span>
                 ) : (
                   <span className="text-[9px] uppercase tracking-widest text-red-400/80 bg-red-400/10 px-2 py-1 rounded-full">Draining</span>
                 )}
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Direction Insights */}
      <div className="bg-[var(--color-accent-amber)]/[0.02] border border-[var(--color-accent-amber)]/10 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-accent-amber)]/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-[var(--color-accent-amber)]/20 rounded-full">
            <Compass className="w-5 h-5 text-[var(--color-accent-amber)]" />
          </div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-[var(--color-primary-text-dark)]">Direction Hints</h3>
        </div>
        <div className="space-y-4 relative z-10">
          {directionInsights.map((insight, idx) => (
            <div key={insight.id} className="p-4 bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl">
              <p className="text-[15px] font-serif text-[var(--color-primary-text-dark)] leading-relaxed italic">
                &ldquo;{insight.content}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-secondary-text-dark)]/60">Insight via Pattern Engine</span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-accent-amber)]/60">#{insight.insight_type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiment Engine */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FlaskConical className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Experiment Engine</h3>
              <p className="text-[10px] text-[var(--color-secondary-text-dark)]/60 mt-0.5 font-serif italic">Test assumptions in the real world.</p>
            </div>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 transition-colors">
            Generate New
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiments.map(exp => (
            <div key={exp.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] text-[var(--color-primary-text-dark)] font-medium">{exp.title}</h4>
                   {exp.status === 'active' ? (
                     <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                   ) : (
                     <span className="w-2 h-2 rounded-full bg-[var(--color-secondary-text-dark)]/30"></span>
                   )}
                </div>
                <p className="text-[13px] text-[var(--color-secondary-text-dark)] leading-relaxed mb-4">{exp.description}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                {exp.status === 'completed' ? (
                  <p className="text-[12px] text-emerald-400/80 italic font-serif">&ldquo;{exp.findings}&rdquo;</p>
                ) : (
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary-text-dark)] transition-colors">
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution Tracking */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Growth & Evolution</h3>
        </div>
        <div className="space-y-4">
           {trends.map(trend => (
             <div key={trend.id} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
               <div className="w-1 h-auto bg-emerald-500/30 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.2)]" />
               <div>
                  <p className="text-[14px] text-[var(--color-primary-text-dark)] leading-relaxed">{trend.trend_description}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-secondary-text-dark)] mt-2 opacity-50">{trend.time_period}</p>
               </div>
             </div>
           ))}
        </div>
      </div>
      
    </div>
  );
}
