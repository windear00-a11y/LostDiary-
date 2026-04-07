'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, X, MessageCircle } from 'lucide-react';
import { useDiaryStore } from '@/lib/store/use-diary-store';
import { useUIStore } from '@/lib/store/use-ui-store';
import { retentionSystem } from '@/lib/retention-system';
import { StreakBadge } from '@/components/retention/StreakBadge';

export const DiaryInput = ({
  handleCreate,
  handleUpdate,
}: {
  handleCreate: (content: string, imageUrl?: string) => Promise<void>;
  handleUpdate: (id: string, content: string, imageUrl?: string) => Promise<void>;
}) => {
  const selectedEntry = useDiaryStore((state) => state.selectedEntry);
  const setSelectedEntry = useDiaryStore((state) => state.setSelectedEntry);
  const setBottomSheetOpen = useUIStore((state) => state.setBottomSheetOpen);

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRemind, setShouldRemind] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setShouldRemind(retentionSystem.shouldRemind());
  }, []);

  useEffect(() => {
    if (selectedEntry) {
      setContent(selectedEntry.content);
      setImageUrl(selectedEntry.image_url || '');
    } else {
      setContent('');
      setImageUrl('');
    }
  }, [selectedEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedEntry) {
        await handleUpdate(selectedEntry.id, content, imageUrl);
      } else {
        await handleCreate(content, imageUrl);
      }
      
      // Success: Reset and Close
      setContent('');
      setImageUrl('');
      setSelectedEntry(null);
      setBottomSheetOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="p-6 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {selectedEntry ? 'Edit Entry' : 'How are you feeling today?'}
          </h3>
          {!selectedEntry && shouldRemind && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Haven&apos;t written today, want to check in?
            </p>
          )}
        </div>
        <StreakBadge />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/20">
            {error}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full min-h-[200px] p-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-base focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ImageIcon className="w-4 h-4" />
            <span>Image URL (optional)</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-3 bg-gray-50 dark:bg-[#262626] border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-gray-900 dark:text-gray-100"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {selectedEntry ? 'Update Entry' : 'Save Entry'}
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
