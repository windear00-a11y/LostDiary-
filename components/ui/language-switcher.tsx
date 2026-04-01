'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'Hindi', short: 'HI' },
  { code: 'hinglish', label: 'Hinglish', short: 'HN' },
  { code: 'es', label: 'Spanish', short: 'ES' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const activeLang = languages.find(l => language.startsWith(l.code))?.code || 'en';

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang).then(() => {
      localStorage.setItem('app_language', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = i18n.dir(lang);
      startTransition(() => {
        router.refresh();
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-all rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A1A] border border-transparent hover:border-gray-200 dark:hover:border-[#2E2E2E]"
        title="Change Language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-bold tracking-wider">
          {languages.find(l => activeLang === l.code)?.label || 'English'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2E2E2E] py-2 z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                activeLang === lang.code
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-[#6366F1] font-medium'
                  : 'text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#262626]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{lang.label}</span>
                {activeLang === lang.code && (
                  <span className="text-xs font-bold text-[#6366F1]">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
