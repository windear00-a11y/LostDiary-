import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Heart, Target, Activity, MessageCircle, ShieldAlert, Trash2, Edit2, Check, X, Eye, EyeOff } from 'lucide-react';
import { IntelligenceProfile, UserProfile } from '@/lib/services/core-service';

interface SanctuaryMirrorProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: IntelligenceProfile) => Promise<void>;
}

const DIMENSIONS = [
  { key: 'thinking_style', label: 'Thinking Style', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'emotional_state', label: 'Emotional State', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { key: 'communication_style', label: 'Communication', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'behavior_patterns', label: 'Behavior Patterns', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'interests_goals', label: 'Interests & Goals', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'sensitive_insights', label: 'Sensitive Insights', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', isSensitive: true }
];

export function SanctuaryMirror({ profile, onUpdate }: SanctuaryMirrorProps) {
  const intel = profile.intelligence_profile || {
    basic_profile: {}, thinking_style: {}, emotional_state: {},
    interests_goals: {}, behavior_patterns: {}, communication_style: {},
    sensitive_insights: {}, source_weights: { chat: 0.3, diary: 0.7 }
  };

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
      // If user clears the text entirely, save as empty object
      if (editValue.trim() !== '') {
        parsed = JSON.parse(editValue);
      }
      
      const newIntel = { ...intel, [key]: parsed };
      await onUpdate(newIntel);
      setEditingKey(null);
    } catch (error) {
      alert("Invalid JSON format. Please check your edits.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (key: string) => {
    if (confirm("Are you sure you want to clear this memory? WinDear will forget these patterns completely.")) {
      setIsSaving(true);
      const newIntel = { ...intel, [key]: {} };
      await onUpdate(newIntel);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
           The Sanctuary Mirror
        </h3>
        <p className="text-sm text-gray-500 mt-1 italic font-serif">
          Minimalist observations of your current resonance. No drama, just patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIMENSIONS.map(({ key, label, icon: Icon, color, bg, isSensitive }) => {
          const data = (intel as any)[key] || {};
          const isEmpty = Object.keys(data).length === 0;

          return (
            <div key={key} className="bg-white dark:bg-[#1A1A1D] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-200">{label}</h4>
                </div>
                {!isEmpty && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(key, data)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleClear(key)} className="p-1.5 text-rose-400 hover:text-rose-600 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-grow">
                {editingKey === key ? (
                  <div className="flex flex-col gap-2 h-full">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-xs font-mono p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl resize-none h-32 focus:outline-none focus:border-accent"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingKey(null)} className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSave(key)} disabled={isSaving} className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    {isEmpty ? (
                      <p className="text-xs text-gray-400 italic">No patterns detected yet.</p>
                    ) : (
                      isSensitive && !revealed ? (
                        <div onClick={() => setRevealed(true)} className="h-full border border-dashed border-rose-200 dark:border-rose-900/30 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition group text-center">
                           <EyeOff className="w-5 h-5 text-rose-300 dark:text-rose-700 mb-2 group-hover:text-rose-400" />
                           <span className="text-xs text-rose-400 dark:text-rose-600">Tap to reveal sensitive insights</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(data).map(([k, v]: [string, any]) => (
                            <div key={k} className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg px-2.5 py-1.5 break-words max-w-full">
                              <span className="font-semibold text-gray-600 dark:text-gray-300 mr-1">{k.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-500 dark:text-gray-400">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
