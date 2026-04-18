'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Check, Globe, Search, X } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useAuth } from '@/components/auth/auth-provider';
import { coreService } from '@/lib/services/core-service';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

export const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { language, setLanguage } = useUIStore();

  // Sync with remote profile on mount if logged in
  useEffect(() => {
    if (user) {
      coreService.getProfile(user.id).then(profile => {
        if (profile?.preferred_language && profile.preferred_language !== language) {
          setLanguage(profile.preferred_language);
        }
      });
    }
  }, [user, language, setLanguage]);

  const handleLanguageSelect = async (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    
    if (user) {
      try {
        await coreService.updateProfile(user.id, { preferred_language: code });
      } catch (error) {
        console.error("Failed to sync language preference to profile:", error);
      }
    }
  };

  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(search.toLowerCase()) || 
    lang.native.toLowerCase().includes(search.toLowerCase())
  );

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors flex flex-col items-center justify-center group relative"
      >
        <Languages className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <span className="absolute -bottom-1 right-0 text-[6px] font-bold uppercase text-indigo-500/80 bg-neutral-900 px-0.5 rounded leading-none">{language}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-[#fdfcfb] dark:bg-[#121212] rounded-[32px] shadow-2xl z-[101] overflow-hidden border border-gray-100 dark:border-white/5"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-serif italic text-lg font-bold">Choose Language</h3>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search language..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-whatsapp space-y-1">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        language === lang.code 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{lang.name}</span>
                        <span className="text-[10px] opacity-60">{lang.native}</span>
                      </div>
                      {language === lang.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs italic">
                      No languages found...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
