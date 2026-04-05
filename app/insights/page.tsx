'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InsightsDashboard } from '@/components/ai/InsightsDashboard';
import { createClient } from '@/lib/supabase';
import { useDiaryStore } from '@/lib/store/use-diary-store';

const supabase = createClient();

export default function InsightsPage() {
  const loading = useDiaryStore((state) => state.isLoading);

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
