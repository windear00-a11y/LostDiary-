"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { DiaryList } from "@/components/diary/DiaryList";
import { DiaryInput } from "@/components/diary/DiaryInput";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Milestones } from "@/components/diary/Milestones";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export default function DashboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for DiaryInput
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const handlePin = async (id: string) => {
    try {
      const entry = entries.find(e => e.id === id);
      const { error } = await supabase
        .from('entries')
        .update({ is_pinned: !entry.is_pinned })
        .eq('id', id);

      if (error) throw error;
      setEntries(entries.map(e => e.id === id ? { ...e, is_pinned: !e.is_pinned } : e));
    } catch (err) {
      console.error("Error pinning:", err);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setNewEntry(entry.content);
    setImageUrl(entry.image_url || "");
    setIsInputOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        console.error("ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      if (editingId) {
        const { error } = await supabase
          .from('entries')
          .update({
            content: newEntry,
            image_url: imageUrl
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('entries')
          .insert({
            user_id: user.id,
            content: newEntry,
            image_url: imageUrl
          });
        if (error) throw error;
      }
      
      setNewEntry("");
      setImageUrl("");
      setEditingId(null);
      setIsInputOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Refresh entries
      const { data } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setEntries(data || []);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <BottomSheet isOpen={isInputOpen} onClose={() => setIsInputOpen(false)}>
            <DiaryInput 
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              t={t}
              textareaRef={textareaRef}
              showSuccess={showSuccess}
              showTranslated={showTranslated}
              setShowTranslated={setShowTranslated}
              entries={entries}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
            />
          </BottomSheet>
          
          <DiaryList 
            entries={entries}
            isLoadingEntries={loading}
            deleteEntry={async (id) => {
              await supabase.from('entries').delete().eq('id', id);
              setEntries(entries.filter(e => e.id !== id));
            }}
            onEdit={handleEdit}
            onPin={handlePin}
            t={t}
            handleStartWriting={() => {
              setEditingId(null);
              setNewEntry("");
              setImageUrl("");
              setIsInputOpen(true);
            }}
            showTranslated={showTranslated}
          />

          <Milestones entries={entries} />
        </div>
      </div>
    </AppLayout>
  );
}
