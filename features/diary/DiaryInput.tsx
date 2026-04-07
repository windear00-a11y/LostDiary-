'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export const DiaryInput = ({
  newEntry,
  setNewEntry,
  handleSubmit,
  isSubmitting,
  submitError,
  textareaRef,
}: {
  newEntry: string;
  setNewEntry: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) => {
  return (
    <section className="p-6 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/20">
            {submitError}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full min-h-[200px] p-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-base focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newEntry.trim()}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Save Entry
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
