'use client';
import { motion, AnimatePresence } from 'motion/react';
import { EntryCard } from '@/components/diary/entry-card';
import { PenLine, Sparkles } from 'lucide-react';

export function DiaryList({
  entries,
  isLoadingEntries,
  deleteEntry,
  t,
  handleStartWriting
}: {
  entries: any[];
  isLoadingEntries: boolean;
  deleteEntry: (id: string) => Promise<void>;
  t: (key: string) => string;
  handleStartWriting: () => void;
}) {
  return (
    <section className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif italic tracking-tight text-slate-900 dark:text-[#F9FAFB]">{t('dash.past')}</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{entries.length} {t('dash.entries')}</span>
      </div>
      
      <div className="space-y-8">
        {isLoadingEntries ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm animate-pulse">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-3">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
              <div className="pt-6 border-t border-gray-50 dark:border-gray-800 space-y-4">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
            </div>
          ))
        ) : entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} deleteEntry={deleteEntry} t={t} />
        ))}

        {!isLoadingEntries && entries.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 space-y-8 text-center bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-slate-100 dark:border-[#2E2E2E] shadow-sm"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-40 animate-pulse" />
              <div className="relative w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <PenLine className="w-10 h-10 text-[#6366F1]" />
              </div>
            </div>
            <div className="space-y-2 px-6">
              <h3 className="text-2xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">{t('dash.empty.title')}</h3>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mx-auto">{t('dash.empty.subtitle')}</p>
            </div>
            <button
              onClick={handleStartWriting}
              className="bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] px-10 py-5 rounded-2xl text-base font-semibold hover:bg-[#1f2937] dark:hover:bg-white transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              {t('dash.empty.cta')}
            </button>
            
            {/* Demo Card */}
            <div className="w-full max-w-sm px-6">
              <div className="bg-gray-50 dark:bg-[#262626] p-6 rounded-2xl border border-gray-100 dark:border-[#333333] text-left opacity-60 hover:opacity-100 transition-opacity cursor-default group">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-2">{t('dash.empty.demoLabel')}</p>
                <p className="font-serif italic text-[#111827] dark:text-[#F9FAFB] mb-1">&ldquo;{t('dash.empty.demoTitle')}&rdquo;</p>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] line-clamp-1">{t('dash.empty.demoText')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
