import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Trash2, ChevronRight, Lightbulb, Languages, Copy, Check, Share2 } from 'lucide-react';

interface EntryCardProps {
  entry: any;
  deleteEntry: (id: string) => void;
  t: any;
}

export function EntryCard({ entry, deleteEntry, t }: EntryCardProps) {
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
      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF]">
            {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm">{moodEmojis[entry.mood] || "😐"}</span>
            <span className="text-xs font-medium text-[#6366F1]">{entry.mood}</span>
            <span className="text-[10px] text-gray-400 font-medium ml-2">• {readingTime} min read</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all active:scale-90"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all active:scale-90"
            title="Share entry"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {hasTranslation && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-full"
              title="Toggle original text"
            >
              <Languages className="w-3 h-3" />
              {showOriginal ? 'Translated' : 'Original'}
            </button>
          )}
          <button 
            onClick={() => deleteEntry(entry.id)}
            className="p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
            className="text-[#374151] leading-relaxed mb-6 whitespace-pre-wrap"
          >
            {showOriginal ? entry.content : (entry.translated_content || entry.content)}
          </motion.p>
        </AnimatePresence>
      </div>
      {entry.summary && (
        <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <p className="text-xs font-bold text-[#6366F1] uppercase tracking-widest mb-2">
            {t('dash.summaryTitle')}
          </p>
          <p className="text-sm text-[#374151] leading-relaxed">{entry.summary}</p>
        </div>
      )}
      {entry.insight && (
        <div className="pt-6 border-t border-gray-50 space-y-4">
          <p className="text-sm font-serif italic text-[#6B7280]">
            {entry.insight}
          </p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">
            <ChevronRight className="w-3 h-3" />
            {t('dash.growthStep')} {entry.suggestion}
          </div>
        </div>
      )}
    </motion.div>
  );
}
