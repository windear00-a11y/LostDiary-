'use client';

import { useMemo } from 'react';
import { Trophy, Star, Target, Zap, Award, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface Entry {
  id: string;
  created_at: string;
  content: string;
  mood?: string;
}

interface MilestonesProps {
  entries: Entry[];
}

export default function Milestones({ entries }: MilestonesProps) {
  const achievements = useMemo(() => {
    if (entries.length === 0) return [];

    const list = [];
    
    // 1. Total Entries
    const total = entries.length;
    if (total >= 1) list.push({ id: 'first_step', icon: <Star className="w-4 h-4" />, title: 'First Step', desc: 'You wrote your first memory.', color: 'bg-yellow-500' });
    if (total >= 10) list.push({ id: 'consistent', icon: <Zap className="w-4 h-4" />, title: 'Consistent', desc: '10 memories saved forever.', color: 'bg-orange-500' });
    if (total >= 50) list.push({ id: 'storyteller', icon: <Award className="w-4 h-4" />, title: 'Storyteller', desc: '50 entries! Your life is a book.', color: 'bg-purple-500' });

    // 2. Streak Calculation
    const entryDates = new Set(entries.map(e => new Date(e.created_at).toDateString()));
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    while (entryDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (currentStreak >= 3) {
      list.push({ id: 'streak_3', icon: <Zap className="w-4 h-4" />, title: '3-Day Streak', desc: 'You are on fire! 3 days in a row.', color: 'bg-red-500' });
    }
    if (currentStreak >= 7) {
      list.push({ id: 'streak_7', icon: <Trophy className="w-4 h-4" />, title: 'Weekly Warrior', desc: 'A full week of self-reflection.', color: 'bg-indigo-500' });
    }

    // 3. Mood Variety
    const moods = new Set(entries.map(e => e.mood).filter(Boolean));
    if (moods.size >= 3) {
      list.push({ id: 'emotional_range', icon: <Target className="w-4 h-4" />, title: 'Self-Aware', desc: 'You recognize a wide range of emotions.', color: 'bg-green-500' });
    }

    return list;
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center sm:justify-start gap-3 px-4">
        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" aria-hidden="true" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#6B7280] dark:text-gray-500">
          Achievements
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {achievements.length === 0 ? (
          <div className="p-6 bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-dashed border-gray-200 dark:border-[#2E2E2E] text-center">
            <p className="text-xs text-gray-400 italic">Keep writing to unlock milestones.</p>
          </div>
        ) : (
          achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm group hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 ${achievement.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{achievement.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.desc}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
