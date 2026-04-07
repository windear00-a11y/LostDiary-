'use client';

import React, { useState } from 'react';
import { useDiaryData } from '@/features/diary/use-diary-data';
import { Header } from '@/components/ui/Header';
import { Sidebar } from './Sidebar';
import { Drawer } from './Drawer';
import { MicroInteractionToast } from '@/components/ui/MicroInteractionToast';

export const AppLayout = ({ children, entries: initialEntries }: { children: React.ReactNode; entries?: any[] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useDiaryData(initialEntries);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100">
      <Header onMenuClick={() => setIsMenuOpen(true)} />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar />
        <Drawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <MicroInteractionToast />
    </div>
  );
};
