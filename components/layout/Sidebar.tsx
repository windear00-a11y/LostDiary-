'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, BookOpen, MessageSquare } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Chat', href: '/dashboard', icon: MessageSquare },
  { label: 'LifeBook', href: '/dashboard/lifebook', icon: BookOpen },
  { label: 'Insights', href: '/assistant', icon: Sparkles },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 dark:border-[#2E2E2E] bg-white dark:bg-[#0A0A0A] p-4 space-y-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              isActive 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
};
