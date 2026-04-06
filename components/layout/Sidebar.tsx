'use client';

import React from 'react';
import { LayoutDashboard, Pin, BarChart3, ChevronRight, Folder } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const sections = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'All Entries', path: '/dashboard' },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0A0A0A] border-r border-gray-100 dark:border-[#1A1A1A] h-full p-6 transition-all duration-300">
      <div className="space-y-8">
        <div className="space-y-2">
          {sections.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                pathname === item.path ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
