'use client';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, X } from 'lucide-react';

export const Drawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  isOpen ? (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
      <div className="w-64 bg-white dark:bg-[#1A1A1A] h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="space-y-2">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-700 dark:text-gray-300">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/diary" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-700 dark:text-gray-300">
            <BookOpen className="w-5 h-5" />
            Diary
          </Link>
        </nav>
      </div>
    </div>
  ) : null
);
