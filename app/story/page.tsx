'use client';

import { BookView } from '@/features/story/BookView';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <BookView />
      </main>
    </div>
  );
}
