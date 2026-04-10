'use client';

import React from 'react';
import { MessageSquare, BookOpen, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Write', icon: MessageSquare, path: '/home' },
    { name: 'Book', icon: BookOpen, path: '/story' },
  ];

  // Don't show on landing page or auth page
  if (pathname === '/' || pathname === '/auth') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border border-gray-100 dark:border-[#2E2E2E] rounded-full p-2 shadow-2xl shadow-indigo-100/20 pointer-events-auto">
        <div className="flex justify-between items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center py-2 px-6 rounded-full transition-all duration-300 group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#6366F1] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon 
                  className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#6366F1]'
                  }`} 
                />
                <span className={`text-[10px] font-medium mt-1 relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#6366F1]'
                }`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
