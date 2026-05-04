'use client';

import { ChatInterface } from '@/features/home/ChatInterface';
import { JournalTimeline } from '@/features/journal/JournalTimeline';
import { LanguageOnboarding } from '@/features/onboarding/LanguageOnboarding';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Suspense } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const { activeView, setActiveView, hasSetLanguage } = useUIStore();
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

      <main className="flex-1 w-full relative overflow-hidden">
        <Suspense fallback={<LoadingSpace />}>
          <ChatInterface />
        </Suspense>
        
        <AnimatePresence mode="wait">
          {activeView === 'timeline' && (
            <motion.div
              key="timeline-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[60] bg-neutral-950 overflow-y-auto w-full h-[100dvh]"
            >
              <JournalTimeline />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
