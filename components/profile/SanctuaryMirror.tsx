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
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
               <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-serif text-gray-900 dark:text-gray-100 italic">
               The Sanctuary Mirror
            </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-serif leading-relaxed px-1">
          WinDear reflects the patterns it sees in your soul. Explore the depth of your own reflection.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DIMENSIONS.map(({ key, label, icon: Icon, color, bg, glow, isSensitive }) => {
          const data = (intel as any)[key] || {};
          const isEmpty = Object.keys(data).length === 0;
          const isExpanded = expandedKey === key;

          return (
            <motion.div 
               key={key} 
               layout
               className={`bg-white dark:bg-[#111] border transition-all duration-300 rounded-[32px] overflow-hidden ${
                  isExpanded ? 'border-indigo-500/30 ring-4 ring-indigo-500/5 shadow-2xl' : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
               }`}
            >
              <div 
                onClick={() => { if(!editingKey) setExpandedKey(isExpanded ? null : key); }}
                className={`p-6 flex items-center justify-between cursor-pointer group ${isExpanded ? 'bg-indigo-500/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${bg} ${glow} transition-all duration-300 group-hover:scale-110 shadow-lg`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                     <h4 className={`font-serif font-bold text-lg transition-colors ${isExpanded ? 'text-indigo-400' : 'text-gray-900 dark:text-gray-200'}`}>
                        {label}
                     </h4>
                     {!isExpanded && !isEmpty && (
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">
                           Pattern Manifested
                        </p>
                     )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   {!isEmpty && isExpanded && !editingKey && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 pr-2 border-r border-white/5 mr-2">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(key, data); }} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors">
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleClear(key); }} className="p-2 text-rose-400/50 hover:text-rose-500 transition-colors">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </motion.div>
                   )}
                   {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
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
                        <div className="bg-slate-50 dark:bg-black p-4 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                           <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full text-xs font-mono p-4 bg-transparent border-none outline-none resize-none h-48 text-gray-600 dark:text-gray-400"
                              placeholder=" Energy format (JSON)..."
                           />
                           <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingKey(null)} className="px-6 py-2 rounded-xl text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5">
                                 Discard
                              </button>
                              <button onClick={() => handleSave(key)} disabled={isSaving} className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-600 disabled:opacity-50">
                                 {isSaving ? "Syncing..." : "Sync Pattern"}
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {isEmpty ? (
                              <div className="py-8 text-center bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-gray-200 dark:border-white/5">
                                 <p className="text-sm text-gray-400 italic font-serif">No resonance detected in this dimension yet.</p>
                              </div>
                           ) : (
                              isSensitive && !revealed ? (
                                 <div 
                                    onClick={() => setRevealed(true)} 
                                    className="p-12 border border-dashed border-rose-200 dark:border-rose-900/20 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-rose-500/5 group transition-all"
                                 >
                                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                       <EyeOff className="w-8 h-8 text-rose-400" />
                                    </div>
                                    <p className="text-sm text-rose-500 font-serif italic mb-1">These insights are guarded by the sanctuary.</p>
                                    <p className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">Tap to reveal shadow work</p>
                                 </div>
                              ) : (
                                 <div className="space-y-3">
                                    {Object.entries(data).map(([k, v]: [string, any], idx) => (
                                       <motion.div 
                                          key={k} 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl group flex flex-col gap-1"
                                       >
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60 transition-colors group-hover:text-indigo-400">
                                             {k.replace(/_/g, ' ')}
                                          </span>
                                          <p className="text-sm font-serif leading-relaxed text-gray-700 dark:text-gray-300 italic">
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
