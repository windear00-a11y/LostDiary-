'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, Zap, Sparkles, Loader2, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

export function UpdatesTab() {
  const { user } = useAuth();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    logger.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }
  const [updates, setUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchUpdatesAndFeedback = async () => {
      setIsLoading(true);
      
      const { data: updatesData } = await supabase
        .from('updates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setUpdates(updatesData || []);

      if (updatesData && updatesData.length > 0) {
        // Mark as read
        const updateIds = updatesData.map((u: any) => u.id);
        const { data: readData } = await supabase
          .from('user_updates')
          .select('update_id')
          .eq('user_id', user.id);
          
        const readIds = new Set(readData?.map((r: any) => r.update_id) || []);
        const unreadIds = updateIds.filter((id: any) => !readIds.has(id));
        
        if (unreadIds.length > 0) {
          const insertData = unreadIds.map((id: any) => ({
            user_id: user.id,
            update_id: id,
            is_read: true,
            read_at: new Date().toISOString()
          }));
          await supabase.from('user_updates').upsert(insertData, { onConflict: 'user_id, update_id' });
        }

        // Fetch user's feedback for these updates
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', user.id)
          .not('update_id', 'is', null);

        const feedbackMap: Record<string, any> = {};
        feedbackData?.forEach((f: any) => {
          feedbackMap[f.update_id] = f;
        });
        setFeedback(feedbackMap);
      }

      setIsLoading(false);
    };

    fetchUpdatesAndFeedback();
  }, [user, supabase]);

  const handleVote = async (updateId: string, isLike: boolean) => {
    if (!user || !supabase) return;

    const existing = feedback[updateId];
    const newIsLike = existing?.is_like === isLike ? null : isLike;

    const { data, error } = await supabase
      .from('feedback')
      .upsert({
        id: existing?.id,
        update_id: updateId,
        user_id: user.id,
        is_like: newIsLike,
        comment: existing?.comment || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (!error && data) {
      setFeedback(prev => ({ ...prev, [updateId]: data }));
    } else if (!error && !data && existing) {
       // if we toggled off and there's no comment, we might want to delete, but upsert handles it if we just set is_like to null
       setFeedback(prev => ({ ...prev, [updateId]: { ...existing, is_like: newIsLike } }));
    }
  };

  const submitComment = async (updateId: string) => {
    if (!user || !commentText.trim() || !supabase) return;

    const existing = feedback[updateId];

    const { data, error } = await supabase
      .from('feedback')
      .upsert({
        id: existing?.id,
        update_id: updateId,
        user_id: user.id,
        is_like: existing?.is_like,
        comment: commentText.trim()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (!error && data) {
      setFeedback(prev => ({ ...prev, [updateId]: data }));
      setCommentingOn(null);
      setCommentText('');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new': return <Rocket className="w-5 h-5 text-indigo-500" />;
      case 'improvement': return <Zap className="w-5 h-5 text-green-500" />;
      case 'upcoming': return <Sparkles className="w-5 h-5 text-yellow-500" />;
      default: return <Rocket className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'new': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">New</span>;
      case 'improvement': return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Improvement</span>;
      case 'upcoming': return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Upcoming</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-[#6B7280] font-serif italic">No updates yet. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {updates.map((update, index) => {
        const userFeedback = feedback[update.id];

        return (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex gap-6 flex-col sm:flex-row"
          >
            <div className="shrink-0">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                {getIcon(update.type)}
              </div>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between gap-4">
                {getBadge(update.type)}
                <span className="text-xs text-[#6B7280] font-medium">
                  {new Date(update.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              <h2 className="text-xl font-serif italic text-[#111827]">{update.title}</h2>
              <p className="text-[#6B7280] leading-relaxed text-sm whitespace-pre-wrap">
                {update.description}
              </p>

              {/* Feedback Actions */}
              <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                <button
                  onClick={() => handleVote(update.id, true)}
                  className={`p-2 rounded-xl transition-colors ${userFeedback?.is_like === true ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleVote(update.id, false)}
                  className={`p-2 rounded-xl transition-colors ${userFeedback?.is_like === false ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCommentingOn(commentingOn === update.id ? null : update.id);
                    setCommentText(userFeedback?.comment || '');
                  }}
                  className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium ${userFeedback?.comment ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {userFeedback?.comment ? 'Edit Comment' : 'Comment'}
                </button>
              </div>

              {/* Comment Input */}
              {commentingOn === update.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 space-y-3"
                >
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What do you think about this update?"
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setCommentingOn(null)}
                      className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitComment(update.id)}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-medium hover:bg-[#1f2937] disabled:opacity-50"
                    >
                      Save Comment
                    </button>
                  </div>
                </motion.div>
              )}
              
              {userFeedback?.comment && commentingOn !== update.id && (
                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
                  &quot;{userFeedback.comment}&quot;
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
