"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/features/chat/ChatInterface";

export default function ChatPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col border border-gray-100 dark:border-[#2E2E2E] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border-b border-gray-100 dark:border-[#2E2E2E]">
          <h1 className="text-xl font-semibold">AI Diary Chat</h1>
          <p className="text-sm text-gray-500">Chat with your diary to log events and reflect.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </AppLayout>
  );
}
