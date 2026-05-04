'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Book, Clock, Sparkles } from 'lucide-react';
import { coreService, ChatSession } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { format } from 'date-fns';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { useRouter } from 'next/navigation';

export function JournalTimeline() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          const data = await coreService.fetchSessions(user.id);
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  if (loading) return <LoadingSpace message="Fetching your chronicles..." />;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-bg-dark)]/50 border border-white/10 flex items-center justify-center">
          <Book className="w-10 h-10 text-[var(--color-secondary-text-dark)]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif text-[var(--color-secondary-text-dark)]/80">Your timeline is empty.</h3>
          <p className="text-xs text-[var(--color-secondary-text-dark)] font-sans uppercase tracking-widest max-w-xs mx-auto italic">
            Capture your first reflection to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 pt-32 pb-40 relative">
      <div className="text-center space-y-4 mb-16 relative z-10">
        <h1 className="text-4xl font-serif text-[var(--color-primary-text-dark)]">Chronicles</h1>
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[var(--color-secondary-text-dark)] italic">
          Your life patterns over time
        </p>
      </div>

      <div className="space-y-6 relative z-10">
        {sessions.map((session, idx) => {
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                router.push(`/home?session=${session.id}`);
              }}
              className="group cursor-pointer glass-surface p-6 rounded-[30px] border border-white/5 hover:border-[var(--color-accent-amber)]/30 transition-all duration-500 bg-[var(--color-bg-dark)] shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-serif text-[var(--color-primary-text-dark)] group-hover:text-[var(--color-accent-amber)] transition-colors">
                  {session.title || 'Untitled Fragment'}
                </h3>
                <div className="flex items-center gap-1.5 text-[var(--color-secondary-text-dark)] text-[10px] uppercase tracking-widest font-sans shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(session.created_at), 'MMM dd')}</span>
                </div>
              </div>

              {session.processing_status === 'woven' && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[var(--color-accent-amber)]/50" />
                  <span className="text-[9px] uppercase tracking-widest text-[var(--color-accent-amber)]/50 font-medium">
                    Analysis Synced
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
