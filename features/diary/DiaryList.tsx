'use client';

import React from 'react';
import { EntryCard } from './entry-card';
import { DiarySkeleton } from './skeleton-card';
import { useEntries } from '@/lib/store/use-diary-store';
import { isToday, isYesterday, format } from 'date-fns';
import { engagementSystem, Nudge } from '@/lib/engagement-system';
import { Sparkles } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { NudgeInline } from '@/components/ui/NudgeInline';

export const DiaryList = ({
  isLoadingEntries,
  deleteEntry,
}: {
  isLoadingEntries: boolean;
  deleteEntry: (id: string) => Promise<void>;
}) => {
  const entries = useEntries();
  const setBottomSheetOpen = useUIStore((state) => state.setBottomSheetOpen);
  const [activeNudge, setActiveNudge] = React.useState<Nudge | null>(null);

  React.useEffect(() => {
    // Only show nudge if there are entries and it's been a while
    if (entries.length > 0) {
      const nudge = engagementSystem.getNudge();
      setActiveNudge(nudge);
    }
  }, [entries]);

  if (isLoadingEntries) return <DiarySkeleton />;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <p className="text-gray-900 dark:text-gray-100 font-bold text-xl">Start by writing your first thought...</p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">WinDear is here to listen and reflect with you. Tap the + button to begin.</p>
        </div>
      </div>
    );
  }

  const groupedEntries = entries.reduce((groups: any, entry) => {
    const date = new Date(entry.created_at);
    let label = 'Older';
    if (isToday(date)) label = 'Today';
    else if (isYesterday(date)) label = 'Yesterday';
    else label = format(date, 'MMMM d, yyyy');

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
    return groups;
  }, {});

  return (
    <div className="space-y-10 pb-32">
      {Object.entries(groupedEntries).map(([label, group]: [string, any]) => (
        <div key={label} className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {label}
            </h3>
            <div className="h-[1px] w-full bg-gray-100 dark:bg-[#1A1A1A]" />
          </div>

          {/* Inline Nudge for Today */}
          {label === 'Today' && activeNudge && (
            <NudgeInline 
              message={activeNudge.message} 
              onClick={() => setBottomSheetOpen(true)} 
            />
          )}

          <div className="space-y-8">
            {group.map((entry: any) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                deleteEntry={deleteEntry} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
