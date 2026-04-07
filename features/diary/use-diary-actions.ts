'use client';

import { useCallback } from 'react';
import { diaryService } from '@/lib/services/diary-service';
import { authService } from '@/lib/services/auth-service';
import { useDiaryStore, useEntries } from '@/lib/store/use-diary-store';
import { useUIStore } from '@/lib/store/use-ui-store';
import { logger } from '@/lib/logger';

export const useDiaryActions = () => {
  const entries = useEntries();
  const updateEntry = useDiaryStore((state) => state.updateEntry);
  const setSelectedEntry = useDiaryStore((state) => state.setSelectedEntry);
  const selectedEntry = useDiaryStore((state) => state.selectedEntry);

  const isBottomSheetOpen = useUIStore((state) => state.isBottomSheetOpen);
  const setBottomSheetOpen = useUIStore((state) => state.setBottomSheetOpen);
  
  const loading = useDiaryStore((state) => state.isLoading);

  const handleCreate = async (content: string, imageUrl?: string) => {
    try {
      const user = await authService.getUser();
      if (!user) throw new Error("No user");

      const tempId = `temp-${Date.now()}`;
      const tempEntry = {
        id: tempId,
        user_id: user.id,
        content,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      };

      useDiaryStore.getState().addEntry(tempEntry);

      try {
        const data = await diaryService.createEntry(user.id, content, imageUrl);
        if (data) {
          useDiaryStore.getState().replaceEntry(tempId, data);
        }
      } catch (err: any) {
        logger.error("Add failed:", err);
        useDiaryStore.getState().deleteEntry(tempId);
        throw err;
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdate = async (id: string, content: string, imageUrl?: string) => {
    const originalEntry = entries.find(e => e.id === id);
    if (!originalEntry) return;

    updateEntry(id, { content, image_url: imageUrl });

    try {
      await diaryService.updateEntry(id, content, imageUrl);
    } catch (err: any) {
      logger.error("Update failed:", err);
      updateEntry(id, originalEntry);
      throw err;
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return;

    useDiaryStore.getState().deleteEntry(id);

    try {
      await diaryService.deleteEntry(id);
    } catch (err) {
      logger.error("Error deleting:", err);
      if (entryToDelete) {
        useDiaryStore.getState().addEntry(entryToDelete);
      }
    }
  }, [entries]);

  return {
    entries,
    loading,
    selectedEntry,
    setSelectedEntry,
    isBottomSheetOpen,
    setBottomSheetOpen,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};
