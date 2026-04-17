'use client';

import { ChatInterface } from '@/features/home/ChatInterface';
import { BookView } from '@/features/story/BookView';
import { JournalEditor } from '@/features/journal/JournalEditor';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/ui/Header';
import { Suspense } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const { activeView, isInputFocused } = useUIStore();

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-neutral-950 overflow-hidden flex flex-col relative">
      <div className={`transition-all duration-700 ${isInputFocused ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <Header />
      </div>
      <main className="flex-1 w-full relative">
        <Suspense fallback={<LoadingSpace />}>
          <ChatInterface />
        </Suspense>
        
        <AnimatePresence mode="wait">
          {activeView === 'journal' && (
            <motion.div
              key="journal-view"
              initial={{ y: '100dvh' }}
              animate={{ y: 0 }}
              exit={{ y: '100dvh' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              className="absolute inset-0 z-40 bg-neutral-950 overflow-y-auto"
            >
              <JournalEditor />
            </motion.div>
          )}

          {activeView === 'story' && (
            <motion.div
              key="story-view"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-40 bg-neutral-950 overflow-y-auto"
            >
              <div className="pt-20">
                <BookView />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
