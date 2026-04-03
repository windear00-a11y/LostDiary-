'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Drawer } from './Drawer';
import { useUpdates } from '@/hooks/use-updates';

interface AppLayoutProps {
  children: React.ReactNode;
  onNewEntry?: () => void;
  onStartChat?: () => void;
}

export const AppLayout = ({ children, onNewEntry, onStartChat }: AppLayoutProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasNewUpdates } = useUpdates({ autoRefreshInterval: 5 * 60 * 1000 });

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] transition-colors duration-300 pt-16 flex flex-col">
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
      />

      {/* Main Content Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {children}
      </main>

      {/* Optional: Simple Footer or other layout elements */}
    </div>
  );
};
