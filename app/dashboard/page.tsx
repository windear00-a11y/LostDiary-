"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDiaryStore, useEntries } from "@/lib/store/use-diary-store";
import { useUIStore } from "@/lib/store/use-ui-store";
import { useAI } from "@/hooks/use-ai";
import { logger } from "@/lib/logger";

const DiaryInput = dynamic(() => import("@/features/diary/DiaryInput").then(mod => ({ default: mod.DiaryInput })), { ssr: false });
const DiaryList = dynamic(() => import("@/features/diary/DiaryList").then(mod => ({ default: mod.DiaryList })), { ssr: false });
const BottomSheet = dynamic(() => import("@/components/ui/bottom-sheet").then(mod => ({ default: mod.BottomSheet })), { ssr: false });

const supabase = createClient();

export default function DashboardPage() {
  const entries = useEntries();
  const setEntries = useDiaryStore((state) => state.setEntries);
  const updateEntry = useDiaryStore((state) => state.updateEntry);
  const togglePin = useDiaryStore((state) => state.togglePin);
  const setSelectedEntry = useDiaryStore((state) => state.setSelectedEntry);
  const selectedEntry = useDiaryStore((state) => state.selectedEntry);

  const isBottomSheetOpen = useUIStore((state) => state.isBottomSheetOpen);
  const setBottomSheetOpen = useUIStore((state) => state.setBottomSheetOpen);
  
  const { analyzeEntry, isAnalyzing } = useAI();
  const loading = useDiaryStore((state) => state.isLoading);
  
  // State for DiaryInput (some of these could also be in store, but keeping form state local is often better)
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePin = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    // Optimistic update
    togglePin(id);

    try {
      const { error } = await supabase
        .from('entries')
        .update({ is_pinned: !entry.is_pinned })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      logger.error("Error pinning:", err);
      // Revert on failure
      togglePin(id);
    }
  }, [entries, togglePin]);

  const handleEdit = useCallback((entry: any) => {
    setSelectedEntry(entry);
    setNewEntry(entry.content);
    setImageUrl(entry.image_url || "");
    setBottomSheetOpen(true);
  }, [setSelectedEntry, setBottomSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newEntry;
    const img = imageUrl;
    const isEditing = !!selectedEntry;
    const originalEntry = selectedEntry;

    // Reset form and close sheet immediately for "no delay" feel
    setNewEntry("");
    setImageUrl("");
    setSelectedEntry(null);
    setBottomSheetOpen(false);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Get AI analysis
      const analysis = await analyzeEntry(content);
      const aiData = analysis || { summary: "", insight: "", sentiment: "Neutral", tags: [] };

      if (isEditing && originalEntry) {
        // Optimistic update
        updateEntry(originalEntry.id, { 
          content, 
          image_url: img,
          summary: aiData.summary,
          insight: aiData.insight,
          mood: aiData.sentiment,
          tags: aiData.tags
        });

        try {
          const { error } = await supabase
            .from('entries')
            .update({ 
              content, 
              image_url: img,
              summary: aiData.summary,
              insight: aiData.insight,
              mood: aiData.sentiment,
              tags: aiData.tags
            })
            .eq('id', originalEntry.id);
          if (error) throw error;
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
          logger.error("Update failed:", err);
          // Revert
          updateEntry(originalEntry.id, originalEntry);
          setSubmitError(err.message);
        }
      } else {
        // Optimistic add
        const tempId = `temp-${Date.now()}`;
        const tempEntry = {
          id: tempId,
          user_id: user.id,
          content,
          image_url: img,
          summary: aiData.summary,
          insight: aiData.insight,
          mood: aiData.sentiment,
          tags: aiData.tags,
          created_at: new Date().toISOString(),
          is_pinned: false
        };

        useDiaryStore.getState().addEntry(tempEntry);

        try {
          const { data, error } = await supabase
            .from('entries')
            .insert({
              user_id: user.id,
              content,
              image_url: img,
              summary: aiData.summary,
              insight: aiData.insight,
              mood: aiData.sentiment,
              tags: aiData.tags
            })
            .select()
            .single();

          if (error) throw error;
          
          // Replace temp entry with real one
          if (data) {
            useDiaryStore.getState().replaceEntry(tempId, data);
          }
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
          logger.error("Add failed:", err);
          // Revert
          useDiaryStore.getState().deleteEntry(tempId);
          setSubmitError(err.message);
        }
      }
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return;

    // Optimistic update
    useDiaryStore.getState().deleteEntry(id);

    try {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      logger.error("Error deleting:", err);
      // Revert on failure
      if (entryToDelete) {
        useDiaryStore.getState().addEntry(entryToDelete);
      }
    }
  }, [entries]);

  const handleStartWriting = useCallback(() => {
    setSelectedEntry(null);
    setNewEntry("");
    setImageUrl("");
    setBottomSheetOpen(true);
  }, [setSelectedEntry, setBottomSheetOpen]);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="space-y-8">
          <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setBottomSheetOpen(false)}>
            <DiaryInput 
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              textareaRef={textareaRef}
              showSuccess={showSuccess}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
            />
          </BottomSheet>
          
          <DiaryList 
            isLoadingEntries={loading}
            deleteEntry={handleDelete}
            onEdit={handleEdit}
            onPin={handlePin}
            handleStartWriting={handleStartWriting}
          />
        </div>
      </div>
    </AppLayout>
  );
}
