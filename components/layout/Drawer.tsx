'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, Settings, X, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NAV_ITEMS = [
  { label: 'Timeline', href: '/dashboard', icon: LayoutDashboard },
  { label: 'LifeBook', href: '/dashboard/lifebook', icon: BookOpen },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { label: 'Assistant', href: '/assistant', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Drawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#0A0A0A] z-[60] md:hidden p-6 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-black text-2xl tracking-tighter text-indigo-600">WinDear</span>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 font-semibold text-lg ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
