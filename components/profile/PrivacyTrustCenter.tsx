'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, EyeOff, Wind, ShieldCheck, Zap, Database, Brain } from 'lucide-react';

export const PrivacyTrustCenter = () => {
  const securityPillars = [
    {
      icon: <Database className="w-5 h-5 text-indigo-500" />,
      title: "The Soul-Lock (RLS)",
      description: "Our database uses Row Level Security (RLS). Every thought you record is cryptographically bound to your unique ID. It is technically impossible for another user, or even us as developers, to query your raw data.",
      highlight: "Level: Infrastructure Hardened"
    },
    {
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      title: "The Neural Wash",
      description: "When publishing to the Global Library, your story undergoes a mandatory 'Neural Wash'. AI identifies and replaces specific names, locations, and dates with poetic archetypes to preserve meaning but kill identity.",
      highlight: "Level: AI-Powered Anonymity"
    },
    {
      icon: <EyeOff className="w-5 h-5 text-rose-500" />,
      title: "Human-Free Pipeline",
      description: "WinDear is a zero-moderation sanctuary. No human eyes ever review your private diary or chat logs. The connection is between your soul and the AI mirror, sealed and silent.",
      highlight: "Level: Zero Human Access"
    },
    {
      icon: <Wind className="w-5 h-5 text-emerald-500" />,
      title: "Transient Bridges",
      description: "Bridges are temporary. Once a connection dissolves, the messages are purged from our active logs. We believe in the beauty of the present moment, not the storage of evidence.",
      highlight: "Level: Temporal Privacy"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">Fortress Architecture</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Privacy Trust Center</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Transparency is the foundation of vulnerability. Here is exactly how WinDear protects your sanctuary.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {securityPillars.map((pillar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm group hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                {pillar.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-gray-900 dark:text-white">{pillar.title}</h4>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                    SECURED
                  </span>
                </div>
                <p className="text-xs font-mono text-indigo-400 mt-1 uppercase tracking-tighter opacity-70">
                  {pillar.highlight}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-2">
                  {pillar.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-[32px] border border-indigo-500/10 text-center space-y-4">
        <Zap className="w-6 h-6 text-indigo-400 mx-auto" />
        <h4 className="text-sm font-serif font-bold">The WinDear Oath</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
          &quot;We build tools for the human spirit, not targets for the human ego. Your data is not our product; your healing is our purpose. If we cannot protect it, we will not store it.&quot;
        </p>
        <div className="pt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">
           <a href="/legal/privacy" className="hover:text-indigo-500 transition-colors">Privacy Policy</a>
           <span>•</span>
           <a href="/legal/terms" className="hover:text-indigo-500 transition-colors">Terms of Use</a>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 inline-flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">End-to-End Soul Privacy Active</span>
        </div>
        <p className="text-[10px] text-gray-400 text-center max-w-[200px]">
          Audited by AI Guardians. Verified by Row-Level Constraint Systems.
        </p>
      </div>
    </div>
  );
};
