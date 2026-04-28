'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, EyeOff, Wind, ShieldCheck, Zap, Database, Brain } from 'lucide-react';

export const PrivacyTrustCenter = () => {
  const securityPillars = [
    {
      icon: <Database className="w-5 h-5 text-amber-500" />,
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-white/50" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">Fortress Architecture</span>
        </div>
        <h2 className="text-xl font-serif text-white">Trust Center</h2>
        <p className="text-[13px] text-white/40 max-w-sm mx-auto leading-relaxed">
          Transparency is the foundation of vulnerability. Here is exactly how WinDear protects your sanctuary.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {securityPillars.map((pillar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white/[0.02] border border-white/5 rounded-[24px] shadow-sm group hover:border-white/20 transition-all hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#0a0a0a] rounded-2xl border border-white/5 group-hover:scale-105 transition-transform shrink-0">
                {pillar.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold uppercase tracking-widest text-white/90">{pillar.title}</h4>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 tracking-widest uppercase">
                    Secured
                  </span>
                </div>
                <p className="text-[11px] font-sans font-bold text-white/30 mt-1 uppercase tracking-widest">
                  {pillar.highlight}
                </p>
                <p className="text-[13px] text-white/60 leading-[1.6] pt-2">
                  {pillar.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-white/[0.02] rounded-[32px] border border-white/10 text-center space-y-4 mt-8">
        <Zap className="w-6 h-6 text-white/30 mx-auto" />
        <h4 className="text-[11px] uppercase tracking-widest font-bold text-white/50">The WinDear Oath</h4>
        <p className="text-[13px] text-white/60 leading-relaxed italic font-serif">
          &quot;We build tools for the human spirit, not targets for the human ego. Your data is not our product; your healing is our purpose. If we cannot protect it, we will not store it.&quot;
        </p>
        <div className="pt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
           <a href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
           <span>•</span>
           <a href="/legal/terms" className="hover:text-white transition-colors">Terms of Use</a>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 inline-flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">End-to-End Privacy Active</span>
        </div>
      </div>
    </div>
  );
};
