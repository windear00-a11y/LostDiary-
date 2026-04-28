'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Heart, Target, Activity, MessageCircle, ShieldAlert, Trash2, Edit2, Check, X, Eye, EyeOff, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { IntelligenceProfile, UserProfile } from '@/lib/services/core-service';
import { toast } from 'sonner';

interface SanctuaryMirrorProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: IntelligenceProfile) => Promise<void>;
  onSync: () => Promise<void>;
}

const DIMENSIONS = [
  { 
    key: 'thinking_style', 
    label: 'Thinking style', 
    description: 'Cognitive patterns and logic flow.',
    icon: Brain, 
    color: 'text-sky-400', 
    accent: 'bg-sky-500/10', 
    border: 'border-sky-500/20' 
  },
  { 
    key: 'emotional_state', 
    label: 'Soul mood', 
    description: 'Underlying affective resonance.',
    icon: Heart, 
    color: 'text-rose-400', 
    accent: 'bg-rose-500/10', 
    border: 'border-rose-500/20' 
  },
  { 
    key: 'communication_style', 
    label: 'Echo pattern', 
    description: 'Verbal rhythms and expressive tone.',
    icon: MessageCircle, 
    color: 'text-emerald-400', 
    accent: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20' 
  },
  { 
    key: 'behavior_patterns', 
    label: 'Silent rhythms', 
    description: 'Subconscious habits and tendencies.',
    icon: Activity, 
    color: 'text-purple-400', 
    accent: 'bg-purple-500/10', 
    border: 'border-purple-500/20' 
  },
  { 
    key: 'interests_goals', 
    label: 'Deep orbits', 
    description: 'What the spirit gravitates toward.',
    icon: Target, 
    color: 'text-amber-400', 
    accent: 'bg-amber-500/10', 
    border: 'border-amber-500/20' 
  },
  { 
    key: 'sensitive_insights', 
    label: 'Shadow work', 
    description: 'Guarded truths and buried patterns.',
    icon: ShieldAlert, 
    color: 'text-rose-500', 
    accent: 'bg-rose-500/20', 
    border: 'border-rose-500/30', 
    isSensitive: true 
  }
];

function ScanningEffect() {
  return (
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-scan" />
  );
}

export function SanctuaryMirror({ profile, onUpdate, onSync }: SanctuaryMirrorProps) {
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
  const [isScanning, setIsScanning] = useState(false);

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

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      await onSync();
      toast.success("Inner resonance re-aligned with latest entries.");
    } catch (e: any) {
      toast.error(e.message || "Cognitive haze blocked the sync.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                   <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-serif text-white tracking-tight">
                   The Sanctuary Mirror
                </h3>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed font-sans max-w-xs">
              WinDear reflects the deep patterns manifested in your archives. Explore your digital soul.
            </p>
        </div>
        
        <button 
          onClick={handleManualScan}
          disabled={isScanning}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 ${isScanning ? 'animate-pulse' : ''}`}
        >
          {isScanning ? (
            <Activity className="w-3 h-3 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
          )}
          {isScanning ? 'Scanning...' : 'Sync Depth'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DIMENSIONS.map(({ key, label, description, icon: Icon, color, accent, border, isSensitive }, idx) => {
          const data = (intel as any)[key] || {};
          const isEmpty = Object.keys(data).length === 0;
          const isExpanded = expandedKey === key;

          return (
            <motion.div 
               key={key} 
               layout
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.08 }}
               className={`relative bg-[var(--color-bg-dark)] border transition-all duration-500 rounded-[28px] overflow-hidden group/card ${
                  isExpanded 
                    ? 'border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10' 
                    : 'border-white/5 hover:border-white/10'
               }`}
            >
              {isExpanded && <ScanningEffect />}
              
              <div 
                onClick={() => { if(!editingKey) setExpandedKey(isExpanded ? null : key); }}
                className={`p-6 flex items-center justify-between cursor-pointer transition-colors relative z-10 ${
                  isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${accent} ${border} border flex items-center justify-center transition-all duration-500 group-hover/card:scale-105 group-hover/card:rotate-3 shadow-inner`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div className="space-y-1">
                     <h4 className={`text-[14px] font-bold uppercase tracking-[0.15em] transition-colors ${
                       isExpanded ? 'text-white' : 'text-white/70 group-hover/card:text-white/90'
                     }`}>
                        {label}
                     </h4>
                     <p className="text-[11px] text-white/30 tracking-wide font-medium">
                        {description}
                     </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   {!isEmpty && !isExpanded && (
                      <div className="flex -space-x-1.5 opacity-60 group-hover/card:opacity-100 transition-opacity">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${color} opacity-${100 - i * 25}`} />
                        ))}
                      </div>
                   )}
                   
                   <div className="flex items-center gap-3">
                      {!isEmpty && isExpanded && !editingKey && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 pr-3 border-r border-white/5 mr-1">
                           <button onClick={(e) => { e.stopPropagation(); startEdit(key, data); }} className="w-9 h-9 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all">
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleClear(key); }} className="w-9 h-9 flex items-center justify-center rounded-full text-rose-500/30 hover:text-rose-400 hover:bg-rose-500/5 transition-all">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </motion.div>
                      )}
                      <div className={`w-8 h-8 rounded-full border border-white/5 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-white/30" />
                      </div>
                   </div>
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
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(data).map(([k, v]: [string, any], idx) => (
                                       <motion.div 
                                          key={k} 
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl group/item flex flex-col gap-2 hover:bg-white/[0.04] transition-all hover:border-white/10"
                                       >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 group-hover/item:text-white/40 transition-colors">
                                              {k.replace(/_/g, ' ')}
                                            </span>
                                            {typeof v === 'number' && (
                                              <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} opacity-50`} style={{ width: `${Math.min(v * 100, 100)}%` }} />
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-[14px] font-serif leading-[1.6] text-white/90">
                                             {Array.isArray(v) 
                                               ? v.join(', ') 
                                               : typeof v === 'object' 
                                                 ? JSON.stringify(v) 
                                                 : String(v)
                                             }
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
