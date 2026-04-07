'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { diaryService } from '@/lib/services/diary-service';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';
import { useDiaryStore } from '@/lib/store/use-diary-store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Drawer } from './Drawer';

interface AppLayoutProps {
  children: React.ReactNode;
  entries?: any[];
}

export const AppLayout = ({ children, entries: initialEntries }: AppLayoutProps) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      logger.error('Error fetching entries in AppLayout:', err);
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

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0A0A0A]">
      <Sidebar isOpen={isSidebarOpen} />
      <Drawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          toggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
