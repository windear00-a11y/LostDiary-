'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book, User, LogOut, Settings } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SettingsModal } from '@/components/settings/settings-modal';
import { useState } from 'react';

export default function AppDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
            <Book className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-xl font-serif italic tracking-tight text-[#111827]">WinDear</span>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            title={t('profile.accountSettings', 'Settings')}
          >
            <Settings className="w-5 h-5" />
          </button>

          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.profile', 'Profile')}</span>
          </button>

          <button 
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title={t('dash.logout', 'Logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 py-20">
          <h1 className="text-4xl font-serif italic text-gray-900">
            {t('dash.hello', 'Hello')}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('dash.howAreYou', 'How are you feeling today?')}
          </p>
          
          {/* Placeholder for diary components */}
          <div className="mt-12 p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm border-dashed">
            <p className="text-gray-400 font-medium">
              Diary components will be integrated here.
            </p>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
