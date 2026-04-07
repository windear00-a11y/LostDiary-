'use client';

import { useEffect, useCallback } from 'react';
import { diaryService } from '@/lib/services/diary-service';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';
import { useDiaryStore } from '@/lib/store/use-diary-store';

export const useDiaryData = (initialEntries?: any[]) => {
  const { user } = useAuth();
  const entries = useDiaryStore((state) => state.entries);
  const setGlobalEntries = useDiaryStore((state) => state.setEntries);
  const setIsLoading = useDiaryStore((state) => state.setIsLoading);

  const fetchEntries = useCallback(async () => {
    if (initialEntries || !user) return;
    setIsLoading(true);
    try {
      const data = await diaryService.fetchEntries(user.id);
      setGlobalEntries(data || []);
    } catch (err) {
      logger.error('Error fetching entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, initialEntries, setGlobalEntries, setIsLoading]);

  useEffect(() => {
    if (user && !initialEntries && entries.length === 0) {
      fetchEntries();
    }
  }, [user, fetchEntries, initialEntries, entries.length]);

  useEffect(() => {
    if (initialEntries) {
      setGlobalEntries(initialEntries);
    }
  }, [initialEntries, setGlobalEntries]);

  return { entries, fetchEntries };
};
