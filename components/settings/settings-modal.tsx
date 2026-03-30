import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [understandLanguage, setUnderstandLanguage] = useState('auto');
  const [responseLanguage, setResponseLanguage] = useState(i18n.language);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const loadSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('understand_language, response_language')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setUnderstandLanguage(data.understand_language || 'auto');
        setResponseLanguage(data.response_language || i18n.language);
      } else {
        setResponseLanguage(i18n.language);
      }
      setIsLoading(false);
    };

    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user, i18n.language, supabase]);

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        understand_language: understandLanguage,
        response_language: responseLanguage,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    setIsSaving(false);
    if (!error) {
      onClose();
    } else {
      console.error('Error saving settings:', error);
      // If table doesn't exist, we might want to show a message or just close
      onClose();
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'hinglish', label: 'Hinglish' },
    { code: 'es', label: 'Spanish' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111827]/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif italic text-[#111827]">Settings</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Hinglish Mode</label>
                  <button
                    onClick={() => {
                      const newLang = i18n.language === 'hinglish' ? 'en' : 'hinglish';
                      i18n.changeLanguage(newLang);
                      localStorage.setItem('app_language', newLang);
                      setResponseLanguage(newLang);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${i18n.language === 'hinglish' ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${i18n.language === 'hinglish' ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Understand language</label>
                  <select
                    value={understandLanguage}
                    onChange={(e) => setUnderstandLanguage(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    <option value="auto">Auto (Detect from input)</option>
                    <option value="manual">Manual (Same as Response language)</option>
                  </select>
                  <p className="text-xs text-gray-500">How the AI should interpret your diary entries.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Response language</label>
                  <select
                    value={responseLanguage}
                    onChange={(e) => setResponseLanguage(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">The language the AI will use to reply to you.</p>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full bg-[#111827] text-white py-3 rounded-xl font-medium hover:bg-[#1f2937] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Settings
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
