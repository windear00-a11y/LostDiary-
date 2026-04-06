'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, X, User, Settings, Bell, LogOut, ChevronRight, Sparkles, BarChart3, Moon, Sun, ShieldCheck, Cloud } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useResourceUsage } from '@/hooks/use-resource-usage';
import Image from 'next/image';
import { logger } from '@/lib/logger';

import { useUIStore } from '@/lib/store/use-ui-store';

interface DrawerProps {
  hasNewUpdates?: boolean;
  entries?: any[];
}

export const Drawer = ({ hasNewUpdates, entries = [] }: DrawerProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { aiCalls, entryCount } = useResourceUsage();
  const isOpen = useUIStore((state) => state.isSidebarOpen);
  const setOpen = useUIStore((state) => state.setSidebarOpen);
  const onClose = React.useCallback(() => setOpen(false), [setOpen]);

  // Free tier limits for visualization
  const AI_LIMIT = 100; // 100 calls per day
  const DB_LIMIT = 500; // 500 entries per user

  const aiPercentage = Math.min((aiCalls / AI_LIMIT) * 100, 100);
  const dbPercentage = Math.min((entryCount / DB_LIMIT) * 100, 100);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    // Prevent background scroll
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const menuItems = [
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      path: '/profile',
      onClick: () => {
        router.push('/profile');
        onClose();
      }
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Notifications',
      path: '/updates',
      onClick: () => {
        router.push('/updates');
        onClose();
      },
      badge: hasNewUpdates
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      path: '/settings',
      onClick: () => {
        router.push('/settings');
        onClose();
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-[320px] bg-white dark:bg-[#0F0F0F] shadow-2xl z-[70] flex flex-col border-l border-gray-100 dark:border-[#1A1A1A]"
      >
        {/* Header - Google Style Profile Section */}
        <div className="p-6 space-y-6 border-b border-gray-100 dark:border-[#1A1A1A]">
          <div className="flex justify-between items-start">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-[#1A1A1A] shadow-md ring-1 ring-gray-200 dark:ring-gray-800">
                {user?.user_metadata?.avatar_url ? (
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      logger.error("Avatar failed to load:", user.user_metadata.avatar_url);
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = "w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold";
                        fallback.innerText = user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || '?';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-[#1A1A1A] rounded-full border border-gray-100 dark:border-[#2E2E2E] flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
            <button 
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#F9FAFB] truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
              {user?.email}
            </p>
            <button 
              onClick={() => {
                router.push('/profile');
                onClose();
              }}
              className="mt-3 px-4 py-1.5 rounded-full border border-gray-200 dark:border-[#2E2E2E] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors inline-flex items-center gap-1"
            >
              Manage your WinDear Account
            </button>
          </div>

          {/* Storage & AI Usage Bar - Google Photos Style */}
          <div className="pt-4 space-y-5">
            {/* AI Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>AI Resources</span>
                </div>
                <span className="font-mono">{aiCalls} / {AI_LIMIT}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                <div 
                  style={{ width: `${aiPercentage}%` }}
                  className={`h-full rounded-full ${
                    aiPercentage > 80 ? 'bg-red-500' : aiPercentage > 50 ? 'bg-yellow-500' : 'bg-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Storage Used</span>
                </div>
                <span className="font-mono">{entryCount} / {DB_LIMIT}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                <div 
                  style={{ width: `${dbPercentage}%` }}
                  className={`h-full rounded-full ${
                    dbPercentage > 80 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {/* Main Menu */}
          <nav className="space-y-1" aria-label="Main navigation">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  aria-label={item.label}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group active:scale-[0.98] ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400' 
                      : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} transition-colors`} aria-hidden="true">
                      {item.icon}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="w-2 h-2 bg-red-500 rounded-full" aria-label="New notification" />
                    )}
                    <ChevronRight className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 group-hover:text-gray-400'}`} aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="h-px bg-gray-50 dark:bg-[#1A1A1A] mx-2" aria-hidden="true" />

          {/* Theme Toggle in Drawer for Mobile Visibility */}
          <div className="sm:hidden pt-4 border-t border-gray-50 dark:border-[#1A1A1A]">
            <div className="flex items-center justify-between px-3">
               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
               <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 dark:border-[#1A1A1A]">
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            aria-label="Logout"
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
