'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export function FeedbackTab() {
  const { user } = useAuth();
  const supabase = createClient();
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchFeedback = async () => {
      setIsLoading(true);
      
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .is('update_id', null)
        .order('created_at', { ascending: false });

      setFeedbackList(data || []);
      setIsLoading(false);
    };

    fetchFeedback();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedback.trim() || isSubmitting || !supabase) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        comment: newFeedback.trim()
      })
      .select()
      .single();

    if (!error && data) {
      setFeedbackList([data, ...feedbackList]);
      setNewFeedback('');
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Submit Form */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-serif italic text-[#111827]">Share Your Thoughts</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="What do you love? What could be better? Let us know..."
            className="w-full min-h-[120px] p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newFeedback.trim()}
              className="flex items-center gap-2 bg-[#111827] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#1f2937] transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Feedback
            </button>
          </div>
        </form>
      </div>

      {/* Past Feedback */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#6B7280] px-2">Your Past Feedback</h3>
        {feedbackList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100">
            <p className="text-[#6B7280] font-serif italic">You haven&apos;t submitted any general feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280] font-medium">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-[#111827] text-sm leading-relaxed whitespace-pre-wrap">
                  {item.comment}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
