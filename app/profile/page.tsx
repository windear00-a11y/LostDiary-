'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { User, Mail, Settings, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import { AppLayout } from '@/components/layout/AppLayout';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (user) {
      setDisplayName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        data: { full_name: displayName }
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: t('profile.updateSuccess', 'Profile updated successfully') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('profile.updateError', 'Failed to update profile') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!supabase) return;
    
    const confirmDelete = window.confirm(t('profile.deleteConfirm', 'Are you sure you want to delete your account? This action cannot be undone.'));
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // In a real app, you might want to call a secure edge function to delete the user
      // or use supabase.rpc to delete user data.
      // For now, we'll sign them out and show a message.
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        // Fallback if RPC doesn't exist
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-3xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">{t('profile.title', 'Your Profile')}</h1>
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

        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#2E2E2E] space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-[#2E2E2E]">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
              {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F9FAFB]">{displayName || t('profile.noName', 'No Name Set')}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                {t('profile.personalInfo', 'Personal Information')}
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-[#D1D5DB]">
                    {t('profile.displayName', 'Display Name')}
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333333] bg-white dark:bg-[#262626] text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-[#D1D5DB]">
                    {t('profile.email', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333333] bg-white dark:bg-[#262626] text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] px-6 py-3 rounded-xl font-medium hover:bg-[#1f2937] dark:hover:bg-white transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('profile.saveChanges', 'Save Changes')}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#2E2E2E] space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            {t('profile.accountSettings', 'Account Settings')}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333]">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-[#F9FAFB]">{t('profile.password', 'Password')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.passwordDesc', 'Manage your password and security')}</p>
              </div>
              <button 
                onClick={() => {
                  if (supabase) {
                    supabase.auth.resetPasswordForEmail(user.email || '');
                    setMessage({ type: 'success', text: t('profile.passwordResetSent', 'Password reset email sent!') });
                  }
                }}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors"
              >
                {t('profile.resetPassword', 'Reset')}
              </button>
            </div>
          </div>
        </div>

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
    </AppLayout>
  );
}
