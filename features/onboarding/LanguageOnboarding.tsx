'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowRight, Search, Sparkles } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useAuth } from '@/components/auth/auth-provider';
import { coreService } from '@/lib/services/core-service';

const TOP_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', desc: 'Global communication & clarity.' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', desc: 'Gahre ehsaas, apni bhasha mein.' },
  { code: 'es', name: 'Spanish', native: 'Español', desc: 'Tu refugio personal en español.' },
  { code: 'ar', name: 'Arabic', native: 'العربية', desc: 'التعبير عن النفس بكل عمق.' },
  { code: 'fr', name: 'French', native: 'Français', desc: 'L\'expression pure de l\'âme.' },
  { code: 'zh', name: 'Chinese', native: '中文', desc: '用你最熟悉的语言记录生活。' },
];

const ALL_LANGUAGES = [
  ...TOP_LANGUAGES,
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

export const LanguageOnboarding = () => {
  const { setLanguage, setHasSetLanguage } = useUIStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);

  const handleSelect = async (lang: string) => {
    setLanguage(lang);
    setHasSetLanguage(true);
    
    if (user) {
      try {
        await coreService.updateProfile(user.id, { preferred_language: lang });
      } catch (error) {
        console.error("Failed to sync language to profile:", error);
      }
    }
  };

  const filteredLanguages = ALL_LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.native.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col items-center p-8 md:p-12 relative z-10 overflow-y-auto scrollbar-none"
      >
        <div className="text-center space-y-6 mb-12">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[28px] flex items-center justify-center mx-auto border border-white/10 shadow-2xl"
          >
            <Globe className="w-10 h-10 text-white" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-serif italic text-white leading-tight">
              A World of Belonging
            </h1>
            <p className="text-neutral-500 font-serif italic text-lg leading-relaxed max-w-md mx-auto">
              WinDear understands the heart, regardless of borders. How would you like to express yourself?
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-md relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input 
            type="text"
            placeholder="Search language or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white placeholder:text-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
          />
        </div>

        {/* Language Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {(searchTerm ? filteredLanguages : (showAll ? ALL_LANGUAGES : TOP_LANGUAGES)).map((lang, i) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.04)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lang.code)}
              className="group flex items-center gap-4 p-5 bg-neutral-900/40 border border-white/5 rounded-[24px] text-left transition-all hover:border-indigo-500/30"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg font-medium shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                {lang.native[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">{lang.native}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-700 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                {lang.desc && <p className="text-neutral-600 text-[10px] mt-0.5 truncate">{lang.desc}</p>}
              </div>
            </motion.button>
          ))}
        </div>

        {!searchTerm && !showAll && (
          <button 
            onClick={() => setShowAll(true)}
            className="mt-8 text-indigo-400 text-xs font-medium uppercase tracking-[0.2em] hover:text-white transition-colors py-2 px-4 rounded-full bg-white/5 border border-white/10"
          >
            Explore All 20+ Languages
          </button>
        )}

        <div className="mt-16 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-800 font-bold">
           <Sparkles className="w-3 h-3" />
           WinDear AI is Global
        </div>
      </motion.div>
    </div>
  );
};
