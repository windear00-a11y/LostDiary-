'use client';

import React, { useEffect, useState } from 'react';
import { Flame, MessageCircle } from 'lucide-react';
import { retentionSystem } from '@/lib/retention-system';
import { motion, AnimatePresence } from 'motion/react';

export const RetentionWidget = () => {
  const [streak, setStreak] = useState(0);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    setStreak(retentionSystem.getStreak());
    setShowReminder(retentionSystem.shouldRemind());
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Streak</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{streak} {streak === 1 ? 'day' : 'days'}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReminder && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-4"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">How are you feeling today?</p>
              <p className="text-xs text-indigo-100">Take a moment to write it down.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
