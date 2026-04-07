'use client';

import React from 'react';
import { EntryCard } from './entry-card';
import { DiarySkeleton } from './skeleton-card';
import { useEntries } from '@/lib/store/use-diary-store';

export const DiaryList = ({
  isLoadingEntries,
  deleteEntry,
}: {
  isLoadingEntries: boolean;
  deleteEntry: (id: string) => Promise<void>;
}) => {
  const entries = useEntries();

  if (isLoadingEntries) return <DiarySkeleton />;

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No entries yet. Start writing!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Your Memories</h2>
      <div className="grid gap-6">
        {entries.map((entry) => (
          <EntryCard 
            key={entry.id} 
            entry={entry} 
            deleteEntry={deleteEntry} 
          />
        ))}
      </div>
    </div>
  );
};
