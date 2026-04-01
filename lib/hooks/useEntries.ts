import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export function useEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  const fetchEntries = useCallback(async () => {
    if (!userId || !supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) logger.error('Error fetching entries:', error);
      else setEntries(data || []);
    } catch (err) {
      logger.error('Unexpected error fetching entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, isLoading, refetch: fetchEntries, setEntries };
}
