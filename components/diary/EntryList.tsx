'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Book } from 'lucide-react';

interface Entry {
  id: string;
  created_at: string;
  content: string;
  mood?: string;
  insight?: string;
  suggestion?: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  Happy: '😊',
  Sad: '😔',
  Stressed: '😤',
  Neutral: '😐',
  Excited: '🔥',
  Calm: '😌',
};

const MOOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Happy: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
  Sad: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  Stressed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  Calm: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  Neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
  Excited: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
};

interface EntryListProps {
  entries: Entry[];
}

function EntryCard({ item }: { item: Entry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const preview = item.content.slice(0, 80) + (item.content.length > 80 ? '...' : '');
  const moodStyle = item.mood ? (MOOD_COLORS[item.mood] || MOOD_COLORS.Neutral) : MOOD_COLORS.Neutral;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 ${moodStyle.bg} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>
            {item.mood ? (MOOD_EMOJIS[item.mood] || '✨') : '📝'}
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <time className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${moodStyle.text}`}>
              {new Date(item.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
            <p className="text-[#111827] font-serif text-lg truncate">
              {isExpanded ? (item.mood || 'Reflection') : preview}
            </p>
          </div>
        </div>
        <div className="text-gray-300 group-hover:text-[#6366F1] transition-colors shrink-0">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-8 mt-6 border-t border-gray-50 space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-sans block">Your Reflection</span>
                <p className="text-[#111827] font-serif text-xl leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              {(item.insight || item.suggestion) && (
                <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                  {item.insight && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">AI Insight</span>
                      <p className="text-[#111827] font-serif text-lg leading-relaxed italic">
                        &ldquo;{item.insight}&rdquo;
                      </p>
                    </div>
                  )}
                  {item.suggestion && (
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold block">Suggestion</span>
                      <p className="text-[#6B7280] font-serif text-base leading-relaxed">
                        {item.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <span className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                  Shared at {new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function EntryList({ entries }: EntryListProps) {
  return (
    <section className="mt-20 space-y-10">
      <div className="flex items-center gap-3 px-4">
        <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#6B7280]">
          Past Reflections
        </h2>
      </div>
      
      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((item) => (
            <EntryCard key={item.id} item={item} />
          ))
        ) : (
          <div className="bg-white p-16 rounded-[3rem] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
              <Book className="w-6 h-6 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <p className="text-[#111827] font-serif text-xl italic">
                Start by writing your first thought.
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold">
                No pressure. Just express.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
