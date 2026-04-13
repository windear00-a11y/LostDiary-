'use client';

import { ChatInterface } from '@/features/home/ChatInterface';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-bg-light dark:bg-bg-dark flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <ChatInterface key={sessionId} />
      </main>
    </div>
  );
}
