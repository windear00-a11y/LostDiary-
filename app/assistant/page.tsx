'use client';

import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';

const Assistant = dynamic(() => import('@/features/assistant/Assistant').then(mod => mod.Assistant), { ssr: false });

export default function AssistantPage() {
  return (
    <AppLayout>
      <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] pt-8 pb-safe">
        <Assistant />
      </main>
    </AppLayout>
  );
}
