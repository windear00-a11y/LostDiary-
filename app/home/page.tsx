'use client';

import { ChatInterface } from '@/features/home/ChatInterface';
import { BookView } from '@/features/story/BookView';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useUIStore } from '@/lib/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/ui/Header';

export default function HomePage() {
  const { user } = useAuth();
  const { activeView, isInputFocused } = useUIStore();

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-transparent overflow-hidden flex flex-col relative">
      <div className={`transition-all duration-700 ${isInputFocused ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <Header />
      </div>
      <main className="flex-1 w-full relative">
        <ChatInterface />
        
        <AnimatePresence>
          {activeView === 'story' && (
            <motion.div
              key="story-view"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-40 bg-[#fdfcfb] dark:bg-[#0d0d0d] overflow-y-auto"
            >
              <div className="pt-20"> {/* Offset for header if needed, but Header is fixed */}
                <BookView />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
