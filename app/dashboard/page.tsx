'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book, User, LogOut, Settings, Bell } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUpdates } from '@/hooks/use-updates';
import { createClient } from '@/lib/supabase';
import posthog from 'posthog-js';
import { DiaryInput } from '@/components/diary/DiaryInput';
import { DiaryList } from '@/components/diary/DiaryList';
import GrowthTracker from '@/components/diary/GrowthTracker';
import WeeklyReflection from '@/components/diary/WeeklyReflection';
import ConsistencyTracker from '@/components/diary/ConsistencyTracker';
import { processDiaryEntry, classifyIntent, handleChat } from '@/lib/ai';
import { ChatResponse } from '@/components/diary/ChatResponse';

import { AppLayout } from '@/components/layout/AppLayout';

export default function AppDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { hasNewUpdates } = useUpdates({ autoRefreshInterval: 5 * 60 * 1000 });
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [newEntry, setNewEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchEntries = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      setIsLoadingEntries(true);
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || !user || !supabase) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setChatResponse(null);

    try {
      // 1. Classify Intent
      const intent = await classifyIntent(newEntry);

      if (intent === 'recall' || intent === 'analysis') {
        const response = await handleChat(newEntry, entries, i18n.resolvedLanguage || i18n.language || 'en', intent);
        setChatResponse(response);
        setNewEntry('');
        setIsSubmitting(false);
        return;
      }

      // 2. Generate AI Insights (Optional but recommended for the app's core value)
      const aiResult = await processDiaryEntry(newEntry, {
        understand_language: i18n.resolvedLanguage || i18n.language || 'en',
        response_language: i18n.resolvedLanguage || i18n.language || 'en'
      });

      // 2. Save to Supabase
      const { data, error } = await supabase
        .from('entries')
        .insert([
          {
            user_id: user.id,
            content: newEntry,
            mood: aiResult?.mood || 'Neutral',
            insight: aiResult?.insight || '',
            suggestion: aiResult?.suggestion || '',
            summary: aiResult?.summary || '',
            tags: aiResult?.tags || [],
            translated_content: aiResult?.translated_content || null,
            normalized_content: aiResult?.normalized_content || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      posthog.capture('entry_created', {
        mood: aiResult?.mood || 'Neutral',
        word_count: newEntry.trim().split(/\s+/).length,
        language: i18n.resolvedLanguage || i18n.language || 'en'
      });

      // 3. Update local state
      setEntries([data, ...entries]);
      setNewEntry('');
    } catch (err: any) {
      console.error('Error saving entry:', err);
      setSubmitError(err.message || 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleStartWriting = () => {
    textareaRef.current?.focus();
    // Smooth scroll to top if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout onNewEntry={handleStartWriting}>
      <div className="space-y-12 min-h-screen">
        <div className="text-center space-y-4 pt-10 min-h-[160px] flex flex-col justify-center">
          <h1 className="text-4xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">
            {t('dash.hello', 'Hello')}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('dash.howAreYou', 'How are you feeling today?')}
          </p>
        </div>

        <div className="min-h-[140px]">
          {isLoadingEntries ? (
            <div className="mt-12 mb-8 p-8 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm animate-pulse">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
              <div className="flex gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                ))}
              </div>
            </div>
          ) : entries.length > 0 && (
            <ConsistencyTracker entries={entries} />
          )}
        </div>

        <div className="min-h-[0px]">
          <ChatResponse 
            response={chatResponse} 
            onClose={() => setChatResponse(null)} 
            t={t} 
          />
        </div>

        <div className="min-h-[300px]">
          <DiaryInput 
            newEntry={newEntry}
            setNewEntry={setNewEntry}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            t={t}
            textareaRef={textareaRef}
          />
        </div>

        <div className="min-h-[600px]">
          <DiaryList 
            entries={entries}
            isLoadingEntries={isLoadingEntries}
            deleteEntry={deleteEntry}
            t={t}
            handleStartWriting={handleStartWriting}
          />
        </div>

        <div className="min-h-[200px]">
          {!isLoadingEntries && entries.length > 0 && (
            <div className="space-y-16">
              <WeeklyReflection entries={entries} />
              <GrowthTracker entries={entries} />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
