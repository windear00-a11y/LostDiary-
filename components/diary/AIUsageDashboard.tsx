'use client';

import { motion } from 'motion/react';
import { Sparkles, Database, Cpu, Activity, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AIUsageDashboardProps {
  aiCalls: number;
  entryCount: number;
  t: any;
}

export function AIUsageDashboard({ aiCalls, entryCount, t }: AIUsageDashboardProps) {
  // Free tier limits for visualization
  const AI_LIMIT = 100; // 100 calls per day
  const DB_LIMIT = 500; // 500 entries per user

  const aiPercentage = Math.min((aiCalls / AI_LIMIT) * 100, 100);
  const dbPercentage = Math.min((entryCount / DB_LIMIT) * 100, 100);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden"
    >
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-serif italic text-lg text-gray-900 dark:text-[#F9FAFB]">
                {t('usage.title', 'AI & Resource Health')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('usage.subtitle', 'Real-time resource tracking')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              aiPercentage > 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {aiPercentage > 80 ? 'High Load' : 'Healthy'}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 space-y-6 border-t border-gray-50 dark:border-[#2E2E2E] pt-6"
          >
            {/* AI Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>Gemini 3 Flash (AI)</span>
                </div>
                <span className="font-mono text-xs">{aiCalls} / {AI_LIMIT} calls</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-[#2E2E2E] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${aiPercentage}%` }}
                  className={`h-full rounded-full ${
                    aiPercentage > 80 ? 'bg-red-500' : aiPercentage > 50 ? 'bg-yellow-500' : 'bg-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* DB Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Supabase (Database)</span>
                </div>
                <span className="font-mono text-xs">{entryCount} / {DB_LIMIT} entries</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-[#2E2E2E] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dbPercentage}%` }}
                  className={`h-full rounded-full ${
                    dbPercentage > 80 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Resource Info */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl flex gap-3">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                {t('usage.info', 'Usage is tracked per session. Database limits are based on your current free tier plan. AI resources are optimized for real-time emotional processing.')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { AnimatePresence } from 'motion/react';
