'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Settings, Trash2, ArrowLeft, Loader2, Shield, Bell, Lock, Globe, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';

import { AppLayout } from '@/components/layout/AppLayout';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [understandLanguage, setUnderstandLanguage] = useState('auto');
  const [responseLanguage, setResponseLanguage] = useState(i18n.language);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!supabase || !user) return;
      setIsLoadingPrefs(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('understand_language, response_language')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setUnderstandLanguage(data.understand_language || 'auto');
        setResponseLanguage(data.response_language || i18n.language);
      }
      setIsLoadingPrefs(false);
    };

    if (user) {
      loadSettings();
    }
  }, [user, i18n.language, supabase]);

  const handleSavePrefs = async () => {
    if (!user || !supabase) return;
    setIsSavingPrefs(true);
    
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        understand_language: understandLanguage,
        response_language: responseLanguage,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    setIsSavingPrefs(false);
    if (!error) {
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!supabase) return;
    
    const confirmDelete = window.confirm(t('profile.deleteConfirm', 'Are you sure you want to delete your account? This action cannot be undone.'));
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        await supabase.auth.signOut();
        router.push('/');
      } else {
        await supabase.auth.signOut();
        router.push('/');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('profile.deleteError', 'Failed to delete account') });
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!supabase || !user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setMessage({ type: 'success', text: t('profile.passwordResetSent', 'Password reset email sent!') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'hinglish', label: 'Hinglish' },
    { code: 'es', label: 'Spanish' },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-3xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">{t('profile.accountSettings', 'Account Settings')}</h1>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Preferences Section */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#2E2E2E] space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              {t('settings.preferences', 'Preferences')}
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-[#F9FAFB]">Appearance</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#D1D5DB]">Understand language</label>
                  <select
                    value={understandLanguage}
                    onChange={(e) => setUnderstandLanguage(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333333] rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-[#111827] dark:text-[#F9FAFB] outline-none"
                  >
                    <option value="auto">Auto (Detect from input)</option>
                    <option value="manual">Manual (Same as Response language)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#D1D5DB]">Response language</label>
                  <select
                    value={responseLanguage}
                    onChange={(e) => setResponseLanguage(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333333] rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-[#111827] dark:text-[#F9FAFB] outline-none"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSavePrefs}
                  disabled={isSavingPrefs}
                  className="w-full bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] py-3 rounded-xl font-medium hover:bg-[#1f2937] dark:hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  {isSavingPrefs && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#2E2E2E] space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              {t('settings.security', 'Security')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-[#F9FAFB]">{t('profile.password', 'Password')}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.passwordDesc', 'Manage your password and security')}</p>
                  </div>
                </div>
                <button 
                  onClick={handleResetPassword}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors"
                >
                  {t('profile.resetPassword', 'Reset')}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30 space-y-6">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              {t('profile.dangerZone', 'Danger Zone')}
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                {t('profile.deleteWarning', 'Once you delete your account, there is no going back. Please be certain.')}
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('profile.deleteAccount', 'Delete Account')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
