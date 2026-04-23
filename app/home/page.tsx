'use client';

import { ChatInterface } from '@/features/home/ChatInterface';
import { BookView } from '@/features/story/BookView';
import { JournalEditor } from '@/features/journal/JournalEditor';
import { LanguageOnboarding } from '@/features/onboarding/LanguageOnboarding';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/ui/Header';
import { Suspense } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const { activeView, hasSetLanguage } = useUIStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle store hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!user || !isHydrated) return null;

  return (
    <div className="h-[100dvh] bg-neutral-950 overflow-hidden flex flex-col relative">
      <AnimatePresence>
        {!hasSetLanguage && (
          <LanguageOnboarding />
        )}
      </AnimatePresence>

      <Header />
      <main className="flex-1 w-full relative overflow-hidden">
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
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150) {
                  setActiveView('chat');
                }
              }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              className="absolute inset-0 z-[60] bg-neutral-950"
            >
              <JournalEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
