'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/ui/Header';
import { MicroInteractionToast } from '@/components/ui/MicroInteractionToast';
import { useUIStore } from '@/lib/store/use-ui-store';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { activeView, activeLibraryTab } = useUIStore();
  
  // Create a unique key for the content to trigger animation
  const routeKey = `${pathname}-${activeView}-${activeLibraryTab}`;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100">
      <Header />
      
      <div className="flex h-[calc(100vh-64px)]">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={routeKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
