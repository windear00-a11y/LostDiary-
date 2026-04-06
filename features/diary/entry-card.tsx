import React from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit3, Pin, ChevronDown, ChevronUp, Sparkles, Tag, Clock } from 'lucide-react';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

interface EntryCardProps {
  entry: any;
  deleteEntry: (id: string) => Promise<void>;
  onEdit?: (entry: any) => void;
  onPin?: (id: string) => void;
  onTryNow: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const EntryCard = React.memo(({
  entry,
  deleteEntry,
  onEdit,
  onPin,
  onTryNow,
  isOpen,
  onToggle
}: EntryCardProps) => {
  const isPinned = entry.is_pinned;

  return (
    <motion.div 
      layout
      className={`bg-white dark:bg-[#1A1A1A] rounded-2xl border transition-all duration-300 overflow-hidden ${
        isPinned 
          ? 'border-amber-200 dark:border-amber-900/50 shadow-md shadow-amber-100/50 dark:shadow-none' 
          : 'border-gray-100 dark:border-[#2E2E2E] hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-none'
      }`}
    >
      <div 
        onClick={onToggle}
        className="p-5 cursor-pointer flex flex-col gap-3 group"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {new Date(entry.created_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {entry.mood && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-300 shrink-0">
                  {entry.mood}
                </span>
              )}
            </div>
            
            <p className={`text-gray-800 dark:text-gray-200 leading-relaxed ${!isOpen ? 'line-clamp-2' : ''}`}>
              {entry.content}
            </p>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {onPin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(entry.id);
                }}
                className={`p-2 rounded-full transition-colors ${
                  isPinned 
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                    : 'text-gray-400 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-[#262626] opacity-0 group-hover:opacity-100'
                }`}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-full transition-colors">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isOpen && entry.tags && entry.tags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {entry.tags.map((tag: string) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-50 dark:border-[#262626] bg-gray-50/50 dark:bg-[#151515]"
          >
            <div className="p-5 space-y-6">
              {/* Full Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>

              {/* AI Insights */}
              {(entry.summary || entry.insight) && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-400">AI Reflection</h4>
                  </div>
                  <div className="space-y-3">
                    {entry.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-200">Summary: </span>
                        {entry.summary}
                      </p>
                    )}
                    {entry.insight && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-200">Insight: </span>
                        {entry.insight}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  {entry.tags.map((tag: string) => (
                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-md bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[#2E2E2E]">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(entry);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Edit entry"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this entry?')) {
                      deleteEntry(entry.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

EntryCard.displayName = 'EntryCard';
