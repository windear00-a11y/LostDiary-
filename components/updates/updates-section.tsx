'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdates } from '@/hooks/use-updates';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Bug, Zap, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

type TabType = 'all' | 'feature' | 'fix' | 'improvement';

const parseUpdate = (message: string) => {
  // Extract an optional link like [link:/profile]
  const linkMatch = message.match(/\[link:([^\]]+)\]/);
  const link = linkMatch ? linkMatch[1] : null;
  const cleanMessage = message.replace(/\[link:[^\]]+\]/, '').trim();

  const match = cleanMessage.match(/^(\w+)(?:\([^)]+\))?:\s*(.*)/);
  if (match) {
    const typeRaw = match[1].toLowerCase();
    const title = match[2];
    
    if (['feat', 'feature'].includes(typeRaw)) return { type: 'feature' as const, title, link: link || '/app' };
    if (['fix', 'bug'].includes(typeRaw)) return { type: 'fix' as const, title, link };
    return { type: 'improvement' as const, title, link };
  }
  return { type: 'improvement' as const, title: cleanMessage, link };
};

const TypeIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'feature': return <Sparkles className={className} />;
    case 'fix': return <Bug className={className} />;
    default: return <Zap className={className} />;
  }
};

const TypeBadge = ({ type }: { type: string }) => {
  switch (type) {
    case 'feature':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Sparkles className="w-3 h-3"/> Feature</span>;
    case 'fix':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><Bug className="w-3 h-3"/> Fix</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Zap className="w-3 h-3"/> Improvement</span>;
  }
};

export function UpdatesSection() {
  const router = useRouter();
  const { updates, loading, error, markAsRead, markAllAsRead } = useUpdates({ autoRefreshInterval: 5 * 60 * 1000 });
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const parsedUpdates = useMemo(() => {
    return updates.map(u => ({
      ...u,
      ...parseUpdate(u.message)
    }));
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    if (activeTab === 'all') return parsedUpdates;
    return parsedUpdates.filter(u => u.type === activeTab);
  }, [parsedUpdates, activeTab]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All Updates' },
    { id: 'feature', label: 'Features' },
    { id: 'fix', label: 'Fixes' },
    { id: 'improvement', label: 'Improvements' },
  ];

  const handleTryNow = (e: React.MouseEvent, hash: string, link: string) => {
    e.stopPropagation(); // Prevent the card click event from firing twice
    markAsRead(hash);
    router.push(link);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
          <Bug className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load updates</h2>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  const latestUpdate = filteredUpdates[0];
  const remainingUpdates = filteredUpdates.slice(1);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">What&apos;s New</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Latest updates and improvements to the platform.</p>
        </div>
        
        {updates.some(u => u.isNew) && (
          <button 
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredUpdates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-[#2E2E2E] rounded-2xl">
          <p className="text-gray-500 dark:text-gray-400">No updates found for this category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Highlighted Latest Update */}
          {latestUpdate && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => markAsRead(latestUpdate.hash)}
              className={`group relative bg-white dark:bg-[#1A1A1A] border rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${
                latestUpdate.type === 'feature' 
                  ? 'border-blue-200 dark:border-blue-900/50 ring-1 ring-blue-50 dark:ring-blue-900/20' 
                  : 'border-gray-200 dark:border-[#2E2E2E]'
              }`}
            >
              {/* Subtle background gradient based on type */}
              <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none ${
                latestUpdate.type === 'feature' ? 'bg-blue-500' : 
                latestUpdate.type === 'fix' ? 'bg-red-500' : 'bg-green-500'
              }`} />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <TypeBadge type={latestUpdate.type} />
                  {latestUpdate.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white animate-pulse">
                      NEW
                    </span>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <time dateTime={latestUpdate.date}>
                      {new Date(latestUpdate.date).toLocaleDateString('en-US', { 
                        month: 'long', day: 'numeric', year: 'numeric' 
                      })}
                    </time>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {latestUpdate.title}
                </h2>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {latestUpdate.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      By {latestUpdate.author}
                    </span>
                  </div>

                  {/* Try Now CTA for Features */}
                  {latestUpdate.type === 'feature' && latestUpdate.link && (
                    <button
                      onClick={(e) => handleTryNow(e, latestUpdate.hash, latestUpdate.link!)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md group-hover:scale-105"
                    >
                      Try Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Remaining Updates List */}
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {remainingUpdates.map((update, index) => (
                <motion.div
                  key={update.hash}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => markAsRead(update.hash)}
                  className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white dark:bg-[#1A1A1A] border rounded-xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                    update.type === 'feature'
                      ? 'border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50'
                      : 'border-gray-100 dark:border-[#2E2E2E] hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1 hidden sm:block">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      update.type === 'feature' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                      update.type === 'fix' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      <TypeIcon type={update.type} className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <div className="sm:hidden">
                          <TypeBadge type={update.type} />
                        </div>
                        {update.isNew && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            NEW
                          </span>
                        )}
                        <time className="text-sm text-gray-500 dark:text-gray-400" dateTime={update.date}>
                          {new Date(update.date).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}
                        </time>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate whitespace-normal">
                        {update.title}
                      </h3>
                    </div>

                    {/* Try Now CTA for Features */}
                    {update.type === 'feature' && update.link && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => handleTryNow(e, update.hash, update.link!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg transition-colors group-hover:scale-105"
                        >
                          Try Now
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
