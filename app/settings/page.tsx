'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Settings as SettingsIcon, User, Bell, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
          <section className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h2 className="font-semibold">{user?.email}</h2>
                <p className="text-sm text-gray-500">Account Owner</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-[#2E2E2E]">
              <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="text-xs text-gray-400">Enabled</span>
              </button>
              
              <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">Privacy & Security</span>
                </div>
              </button>

              <button 
                onClick={signOut}
                className="flex items-center justify-between w-full p-4 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
