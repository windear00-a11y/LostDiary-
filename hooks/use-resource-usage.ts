'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

export function useResourceUsage() {
  const { user } = useAuth();
  const [aiCalls, setAiCalls] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntryCount = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setEntryCount(count || 0);
    } catch (err) {
      logger.error('Error fetching entry count:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Load AI calls from localStorage
    const savedCalls = localStorage.getItem('ai_calls_today');
    const lastDate = localStorage.getItem('ai_calls_date');
    const today = new Date().toDateString();

    if (lastDate === today && savedCalls) {
      setAiCalls(parseInt(savedCalls));
    } else {
      setAiCalls(0);
      localStorage.setItem('ai_calls_date', today);
      localStorage.setItem('ai_calls_today', '0');
    }

    if (user) {
      fetchEntryCount();
    }
  }, [user, fetchEntryCount]);

  const trackAICall = () => {
    const newCount = aiCalls + 1;
    setAiCalls(newCount);
    localStorage.setItem('ai_calls_today', newCount.toString());
  };

  return { aiCalls, entryCount, isLoading, trackAICall, refreshEntryCount: fetchEntryCount };
}
