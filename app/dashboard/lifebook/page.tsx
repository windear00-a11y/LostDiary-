"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { LifeBookView } from "@/features/lifebook/LifeBookView";

export default function LifeBookPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 relative min-h-[calc(100vh-120px)]">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My LifeBook</h1>
          <p className="text-gray-500 text-sm">Your life story, beautifully written.</p>
        </div>

        <LifeBookView />
      </div>
    </AppLayout>
  );
}
