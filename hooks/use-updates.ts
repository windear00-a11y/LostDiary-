import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface UpdateItem {
  hash: string;
  message: string;
  author: string;
  date: string;
  isNew?: boolean;
}

const STORAGE_KEY = 'readUpdates';

export function useUpdates(options?: { autoRefreshInterval?: number }) {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      // Add a cache-busting query param to ensure we get the latest file
      const response = await fetch(`/updates.json?t=${new Date().getTime()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch updates: ${response.statusText}`);
      }
      
      // Handle empty response body
      const text = await response.text();
      if (!text || text.trim() === '') {
        setUpdates([]);
        return;
      }

      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: Expected a JSON array');
      }

      if (data.length === 0) {
        setUpdates([]);
        return;
      }

      // Read readUpdates from localStorage
      let readUpdates: string[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          readUpdates = JSON.parse(stored);
        }
      } catch (e) {
        logger.warn('Failed to parse readUpdates from localStorage', e);
      }

      // Process and mark as "isNew"
      const processedUpdates: UpdateItem[] = data.map((item: any) => ({
        hash: item.hash || Math.random().toString(36).substring(7), // Fallback if hash is missing
        message: item.message || 'No description provided',
        author: item.author || 'Unknown',
        date: item.date || new Date().toISOString(),
        isNew: !readUpdates.includes(item.hash)
      }));

      // Sort updates by latest date first
      processedUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpdates(processedUpdates);
    } catch (err: any) {
      logger.error('Error fetching updates:', err);
      setError(err.message || 'An unexpected error occurred while fetching updates');
      if (!silent) setUpdates([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();

    if (options?.autoRefreshInterval) {
      const intervalId = setInterval(() => {
        fetchUpdates(true); // silent fetch
      }, options.autoRefreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchUpdates, options?.autoRefreshInterval]);

  const markAsRead = useCallback((hash: string) => {
    setUpdates(prev => {
      const newUpdates = prev.map(u => u.hash === hash ? { ...u, isNew: false } : u);
      
      // Update localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const readUpdates = stored ? JSON.parse(stored) : [];
        if (!readUpdates.includes(hash)) {
          readUpdates.push(hash);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(readUpdates));
        }
      } catch (e) {
        logger.error('Failed to save read status to localStorage', e);
      }
      
      return newUpdates;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setUpdates(prev => {
      const newUpdates = prev.map(u => ({ ...u, isNew: false }));
      
      try {
        const allHashes = newUpdates.map(u => u.hash);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allHashes));
      } catch (e) {
        logger.error('Failed to save read status to localStorage', e);
      }
      
      return newUpdates;
    });
  }, []);

  const hasNewUpdates = updates.some(u => u.isNew);

  return { 
    updates, 
    loading, 
    error, 
    hasNewUpdates,
    markAsRead, 
    markAllAsRead, 
    refetch: fetchUpdates 
  };
}
