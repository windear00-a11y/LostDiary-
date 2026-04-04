'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import WeeklyReflection from '@/components/diary/WeeklyReflection';
import GrowthTracker from '@/components/diary/GrowthTracker';
import { useAuth } from '@/components/auth/auth-provider';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export default function InsightsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    try {
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
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user, fetchEntries]);

  return (
    <AppLayout entries={entries}>
      <div className="space-y-12 max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">Insights</h1>
        {isLoading ? (
          <div className="animate-pulse text-gray-500">Loading your insights...</div>
        ) : entries.length === 0 ? (
          <div className="text-gray-500">No entries yet to generate insights.</div>
        ) : (
          <>
            <WeeklyReflection entries={entries} />
            <GrowthTracker entries={entries} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
