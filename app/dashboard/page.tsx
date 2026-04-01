'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book, User, LogOut, Settings, Bell } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SettingsModal } from '@/components/settings/settings-modal';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUpdates } from '@/hooks/use-updates';
import { createClient } from '@/lib/supabase';
import { DiaryInput } from '@/components/diary/DiaryInput';
import { DiaryList } from '@/components/diary/DiaryList';
import GrowthTracker from '@/components/diary/GrowthTracker';
import WeeklyReflection from '@/components/diary/WeeklyReflection';
import ConsistencyTracker from '@/components/diary/ConsistencyTracker';
import { processDiaryEntry } from '@/lib/ai';

export default function AppDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
      // 1. Generate AI Insights (Optional but recommended for the app's core value)
      const aiResult = await processDiaryEntry(newEntry, {
        understand_language: i18n.language || 'en',
        response_language: i18n.language || 'en'
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
            translated_content: aiResult?.translated_content || null,
            normalized_content: aiResult?.normalized_content || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

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
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] pt-safe pb-safe transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white dark:bg-[#0A0A0A]/80 dark:backdrop-blur-md border-b border-gray-100 dark:border-[#1A1A1A] px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800/30">
            <Book className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-xl font-serif italic tracking-tight text-[#111827] dark:text-[#F9FAFB]">WinDear</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          
          <button 
            onClick={() => router.push('/updates')}
            className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
            title="Updates"
            aria-label="Updates"
          >
            <Bell className="w-5 h-5" />
            {hasNewUpdates && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0A0A0A] animate-pulse"></span>
            )}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
            title={t('profile.accountSettings', 'Settings')}
            aria-label={t('profile.accountSettings', 'Settings')}
          >
            <Settings className="w-5 h-5" />
          </button>

          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#262626] border border-gray-200 dark:border-[#2E2E2E] rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.profile', 'Profile')}</span>
          </button>

          <button 
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
            title={t('dash.logout', 'Logout')}
            aria-label={t('dash.logout', 'Logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="text-center space-y-4 pt-10">
          <h1 className="text-4xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">
            {t('dash.hello', 'Hello')}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('dash.howAreYou', 'How are you feeling today?')}
          </p>
        </div>

        {!isLoadingEntries && entries.length > 0 && (
          <ConsistencyTracker entries={entries} />
        )}

        <DiaryInput 
          newEntry={newEntry}
          setNewEntry={setNewEntry}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          t={t}
          textareaRef={textareaRef}
        />

        <DiaryList 
          entries={entries}
          isLoadingEntries={isLoadingEntries}
          deleteEntry={deleteEntry}
          t={t}
          handleStartWriting={handleStartWriting}
        />

        {!isLoadingEntries && entries.length > 0 && (
          <div className="space-y-16">
            <WeeklyReflection entries={entries} />
            <GrowthTracker entries={entries} />
          </div>
        )}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
