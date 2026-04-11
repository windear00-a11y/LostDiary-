'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Settings, Book, LogOut, Heart } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Book, label: 'My Story', path: '/story' },
    { icon: Heart, label: 'Calm Mode', action: () => console.log('Calm mode toggled') },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-[#1A1A1D] z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
              <span className="font-serif italic text-xl font-bold text-accent">WinDear</span>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.path) router.push(item.path);
                    if (item.action) item.action();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300 group"
                >
                  <item.icon className="w-5 h-5 group-hover:text-accent transition-colors" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                  Your story is private
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
