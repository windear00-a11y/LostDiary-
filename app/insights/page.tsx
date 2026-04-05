'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InsightsDashboard } from '@/components/ai/InsightsDashboard';
import { createClient } from '@/lib/supabase';
import { useDiaryStore } from '@/lib/store/use-diary-store';

const supabase = createClient();

export default function InsightsPage() {
  const { setEntries } = useDiaryStore();
  const [loading, setLoading] = useState(true);

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
  }, [setEntries]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-500 animate-pulse uppercase tracking-widest">
              WinDear Soul is analyzing your journey...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <InsightsDashboard />
    </AppLayout>
  );
}
