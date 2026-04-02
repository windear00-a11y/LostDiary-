'use client';

import { Book, CloudRain, Sparkles, Brain, Heart, ShieldCheck, MessageSquareOff, PenLine, Lightbulb, TrendingUp, Smile, Calendar, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { FeedbackButton } from '@/components/ui/feedback-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleCTA = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] overflow-hidden relative transition-colors duration-300">
      {/* Soft Background Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-50 dark:bg-yellow-900/10 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-[#2E2E2E]">
            <Book className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="text-xl font-serif italic tracking-tight text-[#111827] dark:text-[#F9FAFB]">WinDear</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />
          <LanguageSwitcher />
          {user && (
            <button 
              onClick={() => router.push('/profile')}
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              {t('nav.profile', 'Profile')}
            </button>
          )}
          <button 
            onClick={handleCTA}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            {user ? t('nav.goToApp') : t('nav.signIn')}
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#111827] dark:text-[#F9FAFB] leading-[1.1]">
              {t('hero.mainTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto">
              {t('hero.mainSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button 
              onClick={handleCTA}
              className="w-full sm:w-auto bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-[#1f2937] dark:hover:bg-white transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95"
            >
              {t('hero.startWriting')}
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('how-it-works');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto bg-white dark:bg-transparent text-[#111827] dark:text-[#F9FAFB] px-10 py-5 rounded-2xl text-lg font-semibold border border-gray-200 dark:border-[#2E2E2E] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all active:scale-95"
            >
              {t('hero.viewDemo')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Problem-Solution Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-t border-gray-100">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl font-serif italic text-[#111827]">{t('why.title')}</h2>
          <p className="text-[#6B7280] max-w-md mx-auto">{t('why.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50/50 p-12 rounded-[3rem] border border-gray-100 space-y-12"
          >
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#6B7280]">{t('landing.struggle.tag')}</span>
              <h3 className="text-3xl font-serif italic text-[#111827]">{t('landing.struggle.title')}</h3>
            </div>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <CloudRain className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.struggle.item1.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.struggle.item1.desc')}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <Brain className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.struggle.item2.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.struggle.item2.desc')}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <MessageSquareOff className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.struggle.item3.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.struggle.item3.desc')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white p-12 rounded-[3rem] shadow-xl shadow-indigo-100/20 border border-indigo-50 space-y-12"
          >
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#6366F1]">{t('landing.relief.tag')}</span>
              <h3 className="text-3xl font-serif italic text-[#111827]">{t('landing.relief.title')}</h3>
            </div>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.relief.item1.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.relief.item1.desc')}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.relief.item2.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.relief.item2.desc')}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#111827]">{t('landing.relief.item3.title')}</p>
                  <p className="text-sm text-[#6B7280]">{t('landing.relief.item3.desc')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 py-32">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl font-serif italic text-[#111827]">{t('how.title')}</h2>
          <p className="text-[#6B7280] max-w-md mx-auto">{t('how.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors duration-500">
              <PenLine className="w-6 h-6 text-gray-400 group-hover:text-[#6366F1] transition-colors duration-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif italic text-[#111827]">{t('landing.how.step1.title')}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.how.step1.desc')}</p>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors duration-500">
              <Lightbulb className="w-6 h-6 text-gray-400 group-hover:text-[#6366F1] transition-colors duration-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif italic text-[#111827]">{t('landing.how.step2.title')}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.how.step2.desc')}</p>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors duration-500">
              <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-[#6366F1] transition-colors duration-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif italic text-[#111827]">{t('landing.how.step3.title')}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.how.step3.desc')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <div className="mt-48 max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#6366F1]">{t('landing.features.tag')}</span>
          <h2 className="text-4xl font-serif italic text-[#111827]">{t('features.title')}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-[#111827]">{t('landing.features.item1.title')}</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full">New</span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.features.item1.desc')}</p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Smile className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-[#111827]">{t('landing.features.item2.title')}</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full">New</span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.features.item2.desc')}</p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-[#111827]">{t('landing.features.item3.title')}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.features.item3.desc')}</p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-[#111827]">{t('landing.features.item4.title')}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{t('landing.features.item4.desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust and Privacy Section */}
      <div className="mt-48 max-w-4xl mx-auto bg-white p-12 md:p-16 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#6366F1]" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-serif italic text-[#111827]">{t('privacy.title')}</h2>
          <p className="text-[#6B7280] max-w-lg mx-auto leading-relaxed">
            {t('privacy.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-sm font-medium text-[#111827]">{t('landing.privacy.item1')}</span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-sm font-medium text-[#111827]">{t('landing.privacy.item2')}</span>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] font-medium">
          {t('landing.privacy.note')}
        </p>
      </div>

      {/* Final CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-48 text-center">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-50 rounded-full blur-[120px] opacity-40" />
        </div>
        <div className="relative z-10 space-y-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-serif italic tracking-tight text-[#111827]"
          >
            {t('cta.title')}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <button 
                onClick={handleCTA}
                className="bg-[#111827] text-white px-14 py-6 rounded-full text-lg font-medium hover:bg-[#1f2937] transition-all shadow-2xl shadow-gray-200 active:scale-95"
              >
                {t('cta.button')}
              </button>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280] font-bold">
                {t('landing.cta.note1')}
              </p>
            </div>
            <p className="text-sm text-[#6B7280] font-serif italic tracking-wide">
              {t('landing.cta.note2')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="relative z-10 py-12 text-center space-y-4">
        <div className="flex justify-center gap-6 text-[10px] uppercase tracking-[0.2em] text-[#6B7280] font-medium">
          <button onClick={() => router.push('/privacy')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Privacy Policy</button>
          <button onClick={() => router.push('/terms')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Terms of Service</button>
          <button onClick={() => router.push('/support')} className="hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors">Support</button>
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#6B7280] opacity-50">
          &copy; {new Date().getFullYear()} {t('landing.footer')}
        </p>
      </footer>
      <FeedbackButton />
    </main>
  );
}
