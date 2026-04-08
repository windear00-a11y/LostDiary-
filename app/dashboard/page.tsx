"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/features/chat/ChatInterface";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 relative h-[calc(100vh-120px)] flex flex-col">
        <div className="flex flex-col space-y-2 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
          <p className="text-gray-500 text-sm">Your journey, one thought at a time.</p>
        </div>

        <div className="flex-1 overflow-hidden border border-gray-100 dark:border-[#2E2E2E] rounded-2xl shadow-sm bg-white dark:bg-[#0A0A0A]">
          <ChatInterface />
        </div>
      </div>
    </AppLayout>
  );
}
