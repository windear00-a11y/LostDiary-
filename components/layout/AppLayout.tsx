'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { Drawer } from './Drawer';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { WinDearSoul } from '@/components/ai/WinDearSoul';
import { useUpdates } from '@/hooks/use-updates';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

import { useUIStore } from '@/lib/store/use-ui-store';
import { useDiaryStore } from '@/lib/store/use-diary-store';

interface AppLayoutProps {
  children: React.ReactNode;
  onStartChat?: () => void;
  entries?: any[]; // Optional prop if already fetched
}

export const AppLayout = ({ children, onStartChat, entries: initialEntries }: AppLayoutProps) => {
  const { user } = useAuth();
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const isAIAssistantOpen = useUIStore((state) => state.isAIAssistantOpen);
  const setAIAssistantOpen = useUIStore((state) => state.setAIAssistantOpen);
  
  const entries = useDiaryStore((state) => state.entries);
  const setGlobalEntries = useDiaryStore((state) => state.setEntries);
  const setIsLoading = useDiaryStore((state) => state.setIsLoading);
  const { hasNewUpdates } = useUpdates({ autoRefreshInterval: 5 * 60 * 1000 });

  const fetchEntries = useCallback(async () => {
    if (initialEntries) return; // Don't fetch if provided
    const supabase = createClient();
    if (!supabase || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGlobalEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries in AppLayout:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, initialEntries, setGlobalEntries, setIsLoading]);

  useEffect(() => {
    if (user && !initialEntries && entries.length === 0) {
      fetchEntries();
    }
  }, [user, fetchEntries, initialEntries, entries.length]);

  // Sync entries if initialEntries changes
  useEffect(() => {
    if (initialEntries) {
      setGlobalEntries(initialEntries);
    }
  }, [initialEntries, setGlobalEntries]);

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] transition-colors duration-300 flex flex-col">
      {/* Header */}
      <Header 
        onStartChat={onStartChat}
        hasNewUpdates={hasNewUpdates}
      />

      {/* Drawer */}
      <Drawer 
        hasNewUpdates={hasNewUpdates}
        entries={entries}
      />

      <FloatingActionButton />

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

      {/* Mobile AI Assistant Bottom Sheet */}
      <div className="xl:hidden">
        <BottomSheet isOpen={isAIAssistantOpen} onClose={() => setAIAssistantOpen(false)}>
          <div className="h-[70vh]">
            <WinDearSoul />
          </div>
        </BottomSheet>
      </div>
    </div>
  );
};
