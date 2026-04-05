"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { DiaryList } from "@/components/diary/DiaryList";
import { DiaryInput } from "@/components/diary/DiaryInput";
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
  const [imageUrl, setImageUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

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

      const { error } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          content: newEntry,
          image_url: imageUrl
        });

      if (error) throw error;
      
      setNewEntry("");
      setImageUrl("");
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
          
          <DiaryList 
            entries={entries}
            isLoadingEntries={loading}
            deleteEntry={async (id) => {
              await supabase.from('entries').delete().eq('id', id);
              setEntries(entries.filter(e => e.id !== id));
            }}
            t={t}
            handleStartWriting={() => textareaRef.current?.focus()}
            showTranslated={showTranslated}
          />

          <Milestones entries={entries} />
        </div>
      </div>
    </AppLayout>
  );
}
