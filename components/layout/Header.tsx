'use client';

import React from 'react';
import { Book, Menu, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onOpenDrawer: () => void;
  onNewEntry?: () => void;
  hasNewUpdates?: boolean;
}

export const Header = ({ onOpenDrawer, onNewEntry, hasNewUpdates }: HeaderProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#1A1A1A] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex justify-between items-center">
        {/* Left Side: Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800/30 group-hover:scale-110 transition-transform">
            <Book className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-xl font-serif italic tracking-tight text-[#111827] dark:text-[#F9FAFB]">
            WinDear
          </span>
        </div>

        {/* Right Side: Actions & Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher (Desktop) */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme Toggle (Desktop) */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Primary Action Button */}
          {onNewEntry && (
            <button
              onClick={onNewEntry}
              aria-label={t('dash.newEntry', 'New Entry')}
              className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('dash.newEntry', 'New Entry')}</span>
            </button>
          )}

          {/* Hamburger Menu */}
          <button
            onClick={onOpenDrawer}
            className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
            aria-label={t('common.openMenu', 'Open Menu')}
            title={t('common.openMenu', 'Open Menu')}
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
            {hasNewUpdates && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0A0A0A]"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
