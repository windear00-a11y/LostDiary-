import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Trash2, ChevronRight, Lightbulb, Languages, Copy, Check, Share2 } from 'lucide-react';

interface EntryCardProps {
  entry: any;
  deleteEntry: (id: string) => void;
  t: any;
  onTryNow?: () => void;
}

export function EntryCard({ entry, deleteEntry, t, onTryNow }: EntryCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const hasTranslation = entry.translated_content && entry.translated_content !== entry.content;
  const readingTime = Math.max(1, Math.ceil(entry.content.split(/\s+/).length / 200));

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Diary Entry',
          text: entry.content,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const moodEmojis: { [key: string]: string } = {
    Happy: "😊",
    Sad: "😔",
    Stressed: "😰",
    Neutral: "😐"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm hover:shadow-md transition-all group ${entry.suggestion ? 'hover:border-indigo-200 dark:hover:border-indigo-800/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-gray-500">
            {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm">{moodEmojis[entry.mood] || "😐"}</span>
            <span className="text-xs font-medium text-[#6366F1]">{entry.mood}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-2">• {readingTime} {t('dash.minRead')}</span>
          </div>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {entry.tags.map((tag: string, i: number) => (
                <span key={i} className="text-[9px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all active:scale-90"
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all active:scale-90"
            title="Share entry"
            aria-label="Share entry"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {hasTranslation && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 transition-colors bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-full"
              title="Toggle original text"
              aria-label="Toggle original text"
            >
              <Languages className="w-3 h-3" />
              {showOriginal ? t('dash.translated') : t('dash.original')}
            </button>
          )}
          <button 
            onClick={() => deleteEntry(entry.id)}
            className="p-2 text-gray-200 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative min-h-[3rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={showOriginal ? 'original' : 'translated'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-[#374151] dark:text-[#D1D5DB] leading-relaxed mb-6 whitespace-pre-wrap"
          >
            {showOriginal ? entry.content : (entry.translated_content || entry.content)}
          </motion.p>
        </AnimatePresence>
      </div>
      {entry.summary && (
        <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
          <p className="text-xs font-bold text-[#6366F1] uppercase tracking-widest mb-2">
            {t('dash.summaryTitle')}
          </p>
          <p className="text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">{entry.summary}</p>
        </div>
      )}
      {entry.insight && (
        <div className="pt-6 border-t border-gray-50 dark:border-gray-800 space-y-4">
          <p className="text-sm font-serif italic text-[#6B7280] dark:text-[#9CA3AF]">
            {entry.insight}
          </p>
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">
              <ChevronRight className="w-3 h-3" />
              {t('dash.growthStep')} {entry.suggestion}
            </div>
            {entry.suggestion && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onTryNow?.();
                }}
                className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-[#6366F1] rounded-full hover:bg-[#6366F1] hover:text-white transition-all active:scale-95 whitespace-nowrap"
                aria-label={`Try this growth step now: ${entry.suggestion}`}
              >
                {t('dash.tryNow')}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
