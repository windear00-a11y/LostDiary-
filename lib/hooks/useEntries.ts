import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export function useEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

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

      if (error) console.error('Error fetching entries:', error);
      else setEntries(data || []);
    } catch (err) {
      console.error('Unexpected error fetching entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, isLoading, refetch: fetchEntries, setEntries };
}
