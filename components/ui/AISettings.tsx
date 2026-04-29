'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const AISettings = () => {
  const { chatPersonaMode, setChatPersonaMode, isBrutalHonestyOn, setIsBrutalHonestyOn } = useUIStore();

  return (
    <div className="bg-[#111] rounded-2xl p-4 border border-white/10 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
         <Sparkles className="w-4 h-4 text-amber-500/50" />
         <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Assistant Persona</h3>
      </div>
      
      <div className="space-y-4">
         <div className="flex p-1 bg-white/5 rounded-xl gap-1">
            <button 
                onClick={() => setChatPersonaMode('mirror')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                chatPersonaMode === 'mirror' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Mirror
            </button>
            <button 
                onClick={() => setChatPersonaMode('guide')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                chatPersonaMode === 'guide' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Guide
            </button>
         </div>

         <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-300 font-medium block mb-1">Brutal Honesty</span>
            </div>
            <button
              onClick={() => setIsBrutalHonestyOn(!isBrutalHonestyOn)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isBrutalHonestyOn ? 'bg-amber-500/50' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isBrutalHonestyOn ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
         </div>
      </div>
    </div>
  );
};
