'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { Drawer } from './Drawer';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useUpdates } from '@/hooks/use-updates';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

interface AppLayoutProps {
  children: React.ReactNode;
  onNewEntry?: () => void;
  onStartChat?: () => void;
  entries?: any[]; // Optional prop if already fetched
}

export const AppLayout = ({ children, onNewEntry, onStartChat, entries: initialEntries }: AppLayoutProps) => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [entries, setEntries] = useState<any[]>(initialEntries || []);
  const { hasNewUpdates } = useUpdates({ autoRefreshInterval: 5 * 60 * 1000 });

  const fetchEntries = useCallback(async () => {
    if (initialEntries) return; // Don't fetch if provided
    const supabase = createClient();
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries in AppLayout:', err);
    }
  }, [user, initialEntries]);

  useEffect(() => {
    if (user && !initialEntries) {
      fetchEntries();
    }
  }, [user, fetchEntries, initialEntries]);

  // Sync entries if initialEntries changes
  useEffect(() => {
    if (initialEntries) {
      setEntries(initialEntries);
    }
  }, [initialEntries]);

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] transition-colors duration-300 flex flex-col">
      {/* Header */}
      <Header 
        onOpenDrawer={() => setIsDrawerOpen(true)} 
        onNewEntry={onNewEntry}
        onStartChat={onStartChat}
        hasNewUpdates={hasNewUpdates}
      />

      {/* Drawer */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        hasNewUpdates={hasNewUpdates}
        entries={entries}
      />

      <FloatingActionButton onNewEntry={onNewEntry} />

      <div className="flex flex-1 pt-16 h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={true} onClose={() => {}} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>

        {/* Right Panel */}
        <RightPanel />
      </div>
    </div>
  );
};
