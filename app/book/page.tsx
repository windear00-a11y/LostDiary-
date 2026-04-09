'use client';

import { LifeBookView } from "@/features/book/LifeBookView";
import { Header } from "@/components/ui/Header";
import { FAB } from "@/components/ui/FAB";

export default function BookPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Header />
      <main className="max-w-4xl mx-auto p-4">
        <LifeBookView />
      </main>
      <FAB />
    </div>
  );
}
