'use client';

import React, { useState } from 'react';
import { Trash2, Calendar, X, Check } from 'lucide-react';
import { format } from 'date-fns';

import Image from 'next/image';

export const EntryCard = ({
  entry,
  deleteEntry,
}: {
  entry: any;
  deleteEntry: (id: string) => Promise<void>;
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(entry.created_at), 'PPP')}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
              <button
                onClick={() => deleteEntry(entry.id)}
                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Confirm delete"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {entry.content}
        </p>
      </div>

      {entry.image_url && (
        <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-[#2E2E2E]">
          <Image 
            src={entry.image_url} 
            alt="Entry attachment" 
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
