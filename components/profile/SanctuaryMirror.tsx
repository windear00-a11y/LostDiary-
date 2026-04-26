'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Heart, Target, Activity, MessageCircle, ShieldAlert, Trash2, Edit2, Check, X, Eye, EyeOff, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { IntelligenceProfile, UserProfile } from '@/lib/services/core-service';
import { toast } from 'sonner';

interface SanctuaryMirrorProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: IntelligenceProfile) => Promise<void>;
}

const DIMENSIONS = [
  { key: 'thinking_style', label: 'Thinking style', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/10' },
  { key: 'emotional_state', label: 'Soul mood', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', glow: 'shadow-rose-500/10' },
  { key: 'communication_style', label: 'Echo pattern', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/10' },
  { key: 'behavior_patterns', label: 'Silent rhythms', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/10' },
  { key: 'interests_goals', label: 'Deep orbits', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/10' },
  { key: 'sensitive_insights', label: 'Shadow work', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-600/10', glow: 'shadow-red-600/10', isSensitive: true }
];

export function SanctuaryMirror({ profile, onUpdate }: SanctuaryMirrorProps) {
  const intel = profile.intelligence_profile || {
    basic_profile: {}, thinking_style: {}, emotional_state: {},
    interests_goals: {}, behavior_patterns: {}, communication_style: {},
    sensitive_insights: {}, source_weights: { chat: 0.3, diary: 0.7 }
  };

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (key: string, data: any) => {
    setEditingKey(key);
    setEditValue(JSON.stringify(data, null, 2));
  };

  const handleSave = async (key: string) => {
    setIsSaving(true);
    try {
      let parsed = {};
      if (editValue.trim() !== '') {
        parsed = JSON.parse(editValue);
      }
      
      const newIntel = { ...intel, [key]: parsed };
      await onUpdate(newIntel);
      setEditingKey(null);
      toast.success("Memory refined.");
    } catch (error) {
      toast.error("Invalid energy format (JSON required).");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (key: string) => {
    if (confirm("Allow WinDear to forget this energy pattern?")) {
      setIsSaving(true);
      const newIntel = { ...intel, [key]: {} };
      await onUpdate(newIntel);
      setIsSaving(false);
      toast.info("Energy pattern dissolved.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
               <Sparkles className="w-5 h-5 text-white/50" />
            </div>
            <h3 className="text-xl font-serif text-white">
               The Sanctuary Mirror
            </h3>
        </div>
        <p className="text-[13px] text-white/40 leading-relaxed px-1 font-sans">
          WinDear reflects the patterns it sees in your soul. Explore the depth of your own reflection.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {DIMENSIONS.map(({ key, label, icon: Icon, color, bg, glow, isSensitive }) => {
          const data = (intel as any)[key] || {};
          const isEmpty = Object.keys(data).length === 0;
          const isExpanded = expandedKey === key;

          return (
            <motion.div 
               key={key} 
               layout
               className={`bg-white/[0.02] border transition-all duration-300 rounded-[24px] overflow-hidden ${
                  isExpanded ? 'border-white/20 shadow-xl' : 'border-white/5 hover:border-white/10'
               }`}
            >
              <div 
                onClick={() => { if(!editingKey) setExpandedKey(isExpanded ? null : key); }}
                className={`p-6 flex items-center justify-between cursor-pointer group hover:bg-white/[0.02] transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-[16px] bg-[#0a0a0a] border border-white/5 transition-all duration-300 group-hover:scale-105`}>
                    <Icon className={`w-5 h-5 text-white/60`} />
                  </div>
                  <div>
                     <h4 className={`text-[13px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-white' : 'text-white/80'}`}>
                        {label}
                     </h4>
                     {!isExpanded && !isEmpty && (
                        <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/60 mt-1.5 font-bold">
                           Pattern Manifested
                        </p>
                     )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   {!isEmpty && isExpanded && !editingKey && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 pr-2 border-r border-white/5 mr-2">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(key, data); }} className="p-2 text-white/30 hover:text-white transition-colors">
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleClear(key); }} className="p-2 text-rose-500/50 hover:text-rose-400 transition-colors">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </motion.div>
                   )}
                   {isExpanded ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="px-6 pb-8"
                  >
                     {editingKey === key ? (
                        <div className="bg-[#0a0a0a] p-5 rounded-[20px] border border-white/5 space-y-4">
                           <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full text-xs font-mono p-4 bg-transparent border-none outline-none resize-none h-48 text-white/60 focus:text-white/90 selection:bg-white/20 transition-colors"
                              placeholder=" Energy format (JSON)..."
                           />
                           <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                              <button onClick={() => setEditingKey(null)} className="px-6 py-2 rounded-xl text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-colors">
                                 Discard
                              </button>
                              <button onClick={() => handleSave(key)} disabled={isSaving} className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg disabled:opacity-50 transition-colors">
                                 {isSaving ? "Syncing..." : "Sync Pattern"}
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-4 pt-2">
                           {isEmpty ? (
                              <div className="py-10 text-center bg-[#0a0a0a] rounded-[20px] border border-dashed border-white/10">
                                 <p className="text-[13px] text-white/30 font-serif italic">No resonance detected in this dimension yet.</p>
                              </div>
                           ) : (
                              isSensitive && !revealed ? (
                                 <div 
                                    onClick={() => setRevealed(true)} 
                                    className="p-12 border border-dashed border-rose-500/20 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:bg-rose-500/5 group transition-all bg-[#0a0a0a]"
                                 >
                                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform border border-rose-500/20">
                                       <EyeOff className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <p className="text-[13px] text-rose-500/80 mb-2">These insights are guarded by the sanctuary.</p>
                                    <p className="text-[10px] text-rose-500 uppercase tracking-[0.2em] font-bold">Tap to reveal</p>
                                 </div>
                              ) : (
                                 <div className="space-y-3">
                                    {Object.entries(data).map(([k, v]: [string, any], idx) => (
                                       <motion.div 
                                          key={k} 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group flex flex-col gap-2 hover:bg-white/[0.04] transition-colors"
                                       >
                                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">
                                             {k.replace(/_/g, ' ')}
                                          </span>
                                          <p className="text-[13px] font-serif leading-[1.6] text-white/80">
                                             {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                          </p>
                                       </motion.div>
                                    ))}
                                 </div>
                              )
                           )}
                        </div>
                     )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
