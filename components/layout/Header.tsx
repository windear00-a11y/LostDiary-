'use client';

import React from 'react';
import { Book, Menu, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderAssistant } from './HeaderAssistant';

import { useUIStore } from '@/lib/store/use-ui-store';

interface HeaderProps {
  onStartChat?: () => void;
  hasNewUpdates?: boolean;
}

export const Header = ({ onStartChat, hasNewUpdates }: HeaderProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { setSidebarOpen } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#1A1A1A] transition-colors duration-300 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Left Side: Logo */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 justify-start" 
          onClick={() => router.push('/')}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800/30 group-hover:scale-110 transition-transform">
            <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6366F1]" />
          </div>
          <span className="text-lg sm:text-xl font-serif italic tracking-tight text-[#111827] dark:text-[#F9FAFB] hidden sm:inline">
            WinDear
          </span>
        </div>

        {/* Center: Assistant Suggestion Bar */}
        <div className="flex justify-center min-w-0">
          {onStartChat && (
            <HeaderAssistant onStartChat={onStartChat} t={t} />
          )}
        </div>

        {/* Right Side: Actions & Menu */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 justify-end">
          {/* Language Switcher (Desktop) */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme Toggle (Desktop) */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
            aria-label={t('common.openMenu', 'Open Menu')}
            title={t('common.openMenu', 'Open Menu')}
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            {hasNewUpdates && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0A0A0A]"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
