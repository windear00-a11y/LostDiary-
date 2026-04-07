'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { retentionSystem } from '@/lib/retention-system';

export const StreakBadge = () => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(retentionSystem.getStreak());
  }, []);

  if (streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-900/30">
      <Flame className="w-3.5 h-3.5 fill-current" />
      <span className="text-xs font-bold tracking-tight">{streak} day streak</span>
    </div>
  );
};
