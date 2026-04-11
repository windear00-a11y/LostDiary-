'use client';

import { User } from 'lucide-react';
import { StreakBadge } from '@/components/retention/StreakBadge';
import Link from 'next/link';

export const Header = () => {
  return (
    <header className="h-16 border-b border-gray-100 dark:border-[#2E2E2E] bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 md:px-6 justify-between">
      <Link href="/home" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
        <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          WinDear
        </span>
      </Link>
      
      <div className="flex items-center gap-2 md:gap-4">
        <StreakBadge />
        <Link 
          href="/profile"
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition-colors text-gray-400 hover:text-indigo-600"
          aria-label="Profile"
        >
          <User className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
