import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Smile, Trash2, ChevronRight, Lightbulb, Languages, Copy, Check, Share2, ChevronDown, MoreVertical, Edit2, Pin, PinOff } from 'lucide-react';

import ReactMarkdown from 'react-markdown';

interface EntryCardProps {
  entry: any;
  deleteEntry: (id: string) => void;
  onEdit?: (entry: any) => void;
  onPin?: (id: string) => void;
  t: any;
  onTryNow?: () => void;
  showTranslatedGlobal?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function EntryCard({ entry, deleteEntry, onEdit, onPin, t, onTryNow, showTranslatedGlobal = false, isOpen, onToggle }: EntryCardProps) {
  const [localShowOriginal, setLocalShowOriginal] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.1)", "rgba(255, 255, 255, 0)", "rgba(245, 158, 11, 0.1)"]
  );
  const pinOpacity = useTransform(x, [20, 80], [0, 1]);
  const deleteOpacity = useTransform(x, [-80, -20], [1, 0]);
  const pinScale = useTransform(x, [20, 80], [0.8, 1.2]);
  const deleteScale = useTransform(x, [-80, -20], [1.2, 0.8]);

  const showOriginal = localShowOriginal !== null ? localShowOriginal : !showTranslatedGlobal;
  
  const hasTranslation = entry.translated_content && entry.translated_content !== entry.content;
  const readingTime = Math.max(1, Math.ceil(entry.content.split(/\s+/).length / 200));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onPin?.(entry.id);
    } else if (info.offset.x < -100) {
      deleteEntry(entry.id);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      handleCopy(e);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group/card"
    >
      {/* Swipe Background Actions */}
      <motion.div 
        style={{ background }}
        className="absolute inset-0 rounded-[2rem] flex items-center justify-between px-8 pointer-events-none"
      >
        <motion.div style={{ opacity: pinOpacity, scale: pinScale }} className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <Pin className="w-5 h-5" />
          <span>{entry.is_pinned ? 'Unpin' : 'Pin'}</span>
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }} className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest">
          <span>Delete</span>
          <Trash2 className="w-5 h-5" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        className={`bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm transition-all duration-300 overflow-hidden cursor-grab active:cursor-grabbing ${
          isOpen 
            ? 'shadow-lg border-indigo-100 dark:border-indigo-900/50 scale-[1.01]' 
            : 'hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800/50'
        }`}
      >
        <div className="relative">
          <button
            onClick={onToggle}
            className="w-full p-6 sm:p-8 flex items-center justify-between gap-4 text-left"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                {entry.is_pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {entry.summary || entry.content.substring(0, 50) + '...'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm" aria-hidden="true">{moodEmojis[entry.mood] || "😐"}</span>
                <span className="text-xs font-medium text-[#6366F1]">{entry.mood}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-2">• {readingTime} {t('dash.minRead')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(entry);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPin?.(entry.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                          {entry.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          {entry.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEntry(entry.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 sm:px-8 pb-8"
            >
              <div className="flex justify-end items-center gap-3 mb-6">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all active:scale-90"
                  title={t('common.copy', 'Copy to clipboard')}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all active:scale-90"
                  title={t('common.share', 'Share entry')}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {hasTranslation && (
                  <button
                    onClick={() => setLocalShowOriginal(showOriginal ? false : true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 transition-colors bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-full"
                  >
                    <Languages className="w-3 h-3" />
                    {showOriginal ? t('dash.translated') : t('dash.original')}
                  </button>
                )}
                <button 
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title={t('common.delete', 'Delete entry')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {entry.image_url && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
                  <img 
                    src={entry.image_url} 
                    alt="Memory" 
                    className="w-full h-auto max-h-[400px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              <div className="text-[#374151] dark:text-[#D1D5DB] leading-relaxed mb-6 prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {showOriginal ? entry.content : (entry.translated_content || entry.content)}
                </ReactMarkdown>
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
                      >
                        {t('dash.tryNow')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
