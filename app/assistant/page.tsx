'use client';

import dynamic from 'next/dynamic';

const Assistant = dynamic(() => import('@/features/assistant/Assistant').then(mod => mod.Assistant), { ssr: false });

export default function AssistantPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] pt-24 pb-safe">
      <Assistant />
    </main>
  );
}
