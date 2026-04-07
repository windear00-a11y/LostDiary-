'use client';
import Link from 'next/link';
import { LayoutDashboard, BookOpen } from 'lucide-react';

export const Sidebar = ({ isOpen }: { isOpen: boolean }) => (
  <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-200 dark:border-gray-800 h-screen overflow-hidden bg-white dark:bg-[#1A1A1A] flex-shrink-0`}>
    <nav className="p-4 space-y-2">
      <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-700 dark:text-gray-300">
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </Link>
      <Link href="/diary" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-700 dark:text-gray-300">
        <BookOpen className="w-5 h-5" />
        Diary
      </Link>
    </nav>
  </aside>
);
