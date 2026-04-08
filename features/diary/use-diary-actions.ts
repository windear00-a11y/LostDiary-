'use client';

import { useCallback } from 'react';
import { diaryService } from '@/lib/services/diary-service';
import { authService } from '@/lib/services/auth-service';
import { useDiaryStore, useEntries } from '@/lib/store/use-diary-store';
import { useUIStore } from '@/lib/store/use-ui-store';

import { memorySystem } from '@/lib/memory-system';
import { engagementSystem } from '@/lib/engagement-system';

import { generateAIResponse } from '@/ai-core/brain';
import { LifeAuthorEngine } from '@/ai-core/life-author';

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

      // 1. Rewrite content using LifeAuthorEngine
      const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const authoredContent = await authorEngine.rewriteEntry(content);

      // 2. Generate AI response (Brain system runs on authored content)
      const aiResponse = await generateAIResponse(authoredContent);

      // 3. Save to lightweight memory system
      memorySystem.saveEntry(authoredContent);

      // Update streak
      engagementSystem.updateStreak();

      const tempId = `temp-${Date.now()}`;
      const tempEntry = {
        id: tempId,
        user_id: user.id,
        content: authoredContent,
        original_content: content,
        authored_content: authoredContent,
        image_url: imageUrl,
        ai_response: aiResponse,
        created_at: new Date().toISOString(),
      };

      useDiaryStore.getState().addEntry(tempEntry);

      try {
        const data = await diaryService.createEntry(user.id, authoredContent, imageUrl, aiResponse, content, authoredContent);
        if (data) {
          useDiaryStore.getState().replaceEntry(tempId, data);
        }
      } catch (err: any) {
        console.error("Add failed:", err);
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

    // 1. Rewrite content using LifeAuthorEngine
    const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    const authoredContent = await authorEngine.rewriteEntry(content);

    // 2. Generate new AI response based on updated authored content
    const aiResponse = await generateAIResponse(authoredContent);

    updateEntry(id, { content: authoredContent, original_content: content, authored_content: authoredContent, image_url: imageUrl, ai_response: aiResponse });

    try {
      await diaryService.updateEntry(id, authoredContent, imageUrl, aiResponse, content, authoredContent);
    } catch (err: any) {
      console.error("Update failed:", err);
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
      console.error("Error deleting:", err);
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
