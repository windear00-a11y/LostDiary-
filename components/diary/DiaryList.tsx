'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EntryCard } from '@/components/diary/entry-card';
import { DiarySkeleton } from '@/components/diary/skeleton-card';
import { PenLine, Tag, Filter, LayoutGrid, List, Search, X, Download, Folder, ChevronDown, ChevronUp, Pin } from 'lucide-react';

import { useDiaryStore, useEntries } from '@/lib/store/use-diary-store';
import { useUIState } from '@/lib/store/use-ui-store';

export const DiaryList = React.memo(function DiaryList({
  isLoadingEntries,
  deleteEntry,
  onEdit,
  onPin,
  t,
  handleStartWriting,
}: {
  isLoadingEntries: boolean;
  deleteEntry: (id: string) => Promise<void>;
  onEdit?: (entry: any) => void;
  onPin?: (id: string) => void;
  t: (key: string) => string;
  handleStartWriting: () => void;
}) {
  const entries = useEntries();
  const { showTranslated } = useUIState();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  const toggleFolder = useCallback((tag: string) => {
    setOpenFolders(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const toggleEntry = useCallback((id: string) => {
    setOpenEntryId(prev => {
      const newId = prev === id ? null : id;
      if (newId) {
        const entry = entries.find(e => e.id === newId);
        useDiaryStore.getState().setSelectedEntry(entry || null);
      } else {
        useDiaryStore.getState().setSelectedEntry(null);
      }
      return newId;
    });
  }, [entries]);

  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `windear-diary-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [entries]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    return ['All', ...Array.from(tags).sort()];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    
    // Pinned filter
    if (showPinnedOnly) {
      result = result.filter(entry => entry.is_pinned);
    }

    // Tag filter
    if (selectedTag !== 'All') {
      result = result.filter(entry => 
        entry.tags && Array.isArray(entry.tags) && entry.tags.includes(selectedTag)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry => 
        entry.content.toLowerCase().includes(query) || 
        (entry.summary && entry.summary.toLowerCase().includes(query)) ||
        (entry.insight && entry.insight.toLowerCase().includes(query)) ||
        (entry.tags && entry.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
    }

    // Date sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, selectedTag, searchQuery, showPinnedOnly, dateSort]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredEntries.forEach(entry => {
      const tags = entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 ? entry.tags : ['Uncategorized'];
      tags.forEach((tag: string) => {
        if (selectedTag === 'All' || tag === selectedTag) {
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(entry);
        }
      });
    });
    return groups;
  }, [filteredEntries, selectedTag]);

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif italic tracking-tight text-slate-900 dark:text-[#F9FAFB]">{t('dash.past')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {filteredEntries.length} {t('dash.entries')} {selectedTag !== 'All' && `in #${selectedTag}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-xl p-1">
            <button
              onClick={() => setDateSort('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateSort === 'newest' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Newest
            </button>
            <button
              onClick={() => setDateSort('oldest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateSort === 'oldest' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Oldest
            </button>
          </div>

          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showPinnedOnly 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' 
                : 'bg-white dark:bg-[#1A1A1A] border-gray-100 dark:border-[#2E2E2E] text-gray-500 hover:border-amber-200 dark:hover:border-amber-800'
            }`}
          >
            <Pin className={`w-4 h-4 ${showPinnedOnly ? 'fill-amber-500' : ''}`} />
            <span>Pinned</span>
          </button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportData}
            className="p-2 bg-white dark:bg-[#1A1A1A] text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100 dark:border-[#2E2E2E] rounded-xl shadow-sm transition-all"
            title="Export all entries as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      {!isLoadingEntries && entries.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1A1A] rounded-full border border-gray-100 dark:border-[#2E2E2E] shadow-sm shrink-0">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Categories</span>
            </div>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                  selectedTag === tag
                    ? 'bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] border-[#111827] dark:border-[#F9FAFB] shadow-lg shadow-indigo-100 dark:shadow-none scale-105'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#2E2E2E] hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                }`}
              >
                {tag === 'All' ? 'All Entries' : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Folder View */}
      <div className="space-y-4">
        {isLoadingEntries ? (
          <DiarySkeleton />
        ) : (
          Object.entries(groupedEntries).map(([tag, entriesInTag]) => (
            <div key={tag} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden">
              <button 
                onClick={() => toggleFolder(tag)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-gray-900 dark:text-white">#{tag}</span>
                  <span className="text-sm text-gray-400">({entriesInTag.length})</span>
                </div>
                {openFolders.includes(tag) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {openFolders.includes(tag) && (
                <div className="p-4 border-t border-gray-100 dark:border-[#2E2E2E] space-y-4">
                  {entriesInTag.map(entry => (
                    <EntryCard 
                      key={entry.id} 
                      entry={entry} 
                      deleteEntry={deleteEntry} 
                      onEdit={onEdit}
                      onPin={onPin}
                      t={t} 
                      onTryNow={handleStartWriting} 
                      isOpen={openEntryId === entry.id}
                      onToggle={() => toggleEntry(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

        {!isLoadingEntries && entries.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 space-y-6 text-center col-span-full"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{t('dash.empty.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">{t('dash.empty.subtitle')}</p>
            </div>
            <button
              onClick={handleStartWriting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {t('dash.empty.cta')}
            </button>
          </motion.div>
        )}

        {!isLoadingEntries && entries.length > 0 && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
            <p className="text-gray-500 dark:text-gray-400 italic font-serif">No entries match your current filters.</p>
          </div>
        )}
      </section>
  );
});
