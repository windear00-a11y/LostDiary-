'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { MicroInteractionToast } from '@/components/ui/MicroInteractionToast';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100">
      <Header />
      
      <div className="flex h-[calc(100vh-64px)]">
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
