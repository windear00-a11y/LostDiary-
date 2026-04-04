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
import { DiaryInput } from '@/components/diary/DiaryInput';
import { DiaryList } from '@/components/diary/DiaryList';
import dynamic from 'next/dynamic';

const GrowthTracker = dynamic(() => import('@/components/diary/GrowthTracker'), { ssr: false });
const WeeklyReflection = dynamic(() => import('@/components/diary/WeeklyReflection'), { ssr: false });
const ConsistencyTracker = dynamic(() => import('@/components/diary/ConsistencyTracker'), { ssr: false });
const Milestones = dynamic(() => import('@/components/diary/Milestones'), { ssr: false });
const AIUsageDashboard = dynamic(() => import('@/components/diary/AIUsageDashboard'), { ssr: false });

import { processDiaryEntry, classifyIntent, handleChat } from '@/lib/ai';
import { useResourceUsage } from '@/hooks/use-resource-usage';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const { aiCalls, entryCount, trackAICall } = useResourceUsage();
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

    try {
      trackAICall();
      // 1. Generate AI Insights
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
            image_url: imageUrl || null,
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
      setImageUrl('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
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

  const handleStartChat = () => {
    router.push('/assistant');
  };

  return (
    <AppLayout onNewEntry={handleStartWriting} onStartChat={handleStartChat}>
      <div className="space-y-12 min-h-screen w-full max-w-7xl mx-auto">
        <div className="text-center space-y-4 pt-6 sm:pt-10 min-h-[140px] sm:min-h-[160px] flex flex-col justify-center px-4">
          <h1 className="text-2xl sm:text-4xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">
            {t('dash.hello', 'Hello')}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. Diary Input (Top on both) */}
          <div className="lg:col-span-7 order-1 space-y-8">
            <div className="min-h-[300px]">
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
            </div>
          </div>

          {/* 2. Insights (Middle on mobile, Right on desktop) */}
            <div className="lg:col-span-5 order-2 lg:order-3 space-y-8 lg:sticky lg:top-8">
            <AIUsageDashboard 
              aiCalls={aiCalls}
              entryCount={entryCount}
              t={t}
            />
            
            <div className="hidden lg:block space-y-8">
              {!isLoadingEntries && entries.length > 0 && (
                <div className="space-y-8">
                  <Milestones entries={entries} />
                </div>
              )}
            </div>
          </div>

          {/* 3. Diary List (Bottom on mobile, Left on desktop) */}
          <div className="lg:col-span-7 order-3 lg:order-2 space-y-8">
            <div className="min-h-[600px]">
              <DiaryList 
                entries={entries}
                isLoadingEntries={isLoadingEntries}
                deleteEntry={deleteEntry}
                t={t}
                handleStartWriting={handleStartWriting}
                showTranslated={showTranslated}
              />
            </div>
            
            {/* Show trackers at the very bottom on mobile */}
            <div className="lg:hidden space-y-8 mt-8">
              {!isLoadingEntries && entries.length > 0 && (
                <div className="space-y-8">
                  <Milestones entries={entries} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
