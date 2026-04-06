'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, ArrowUp, Plus, Lightbulb } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

export function IdeasTab() {
  const { user } = useAuth();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    logger.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }
  const [ideas, setIdeas] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchIdeas = async () => {
      setIsLoading(true);
      
      const { data: ideasData } = await supabase
        .from('ideas')
        .select('*')
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false });

      const { data: votesData } = await supabase
        .from('idea_votes')
        .select('idea_id')
        .eq('user_id', user.id);

      setIdeas(ideasData || []);
      setUserVotes(new Set(votesData?.map((v: any) => v.idea_id) || []));
      setIsLoading(false);
    };

    fetchIdeas();
  }, [user, supabase]);

  const handleVote = async (ideaId: string) => {
    if (!user || !supabase) return;

    const hasVoted = userVotes.has(ideaId);
    
    if (hasVoted) {
      // Remove vote
      await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', user.id);
      await supabase.rpc('decrement_idea_upvotes', { row_id: ideaId });
      
      setUserVotes(prev => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, upvotes: i.upvotes - 1 } : i));
    } else {
      // Add vote
      await supabase.from('idea_votes').insert({ idea_id: ideaId, user_id: user.id });
      await supabase.rpc('increment_idea_upvotes', { row_id: ideaId });
      
      setUserVotes(prev => {
        const next = new Set(prev);
        next.add(ideaId);
        return next;
      });
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, upvotes: i.upvotes + 1 } : i));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newIdea.title.trim() || !newIdea.description.trim() || isSubmitting || !supabase) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title: newIdea.title.trim(),
        description: newIdea.description.trim(),
        upvotes: 1 // Auto-upvote own idea
      })
      .select()
      .single();

    if (!error && data) {
      // Add initial vote
      await supabase.from('idea_votes').insert({ idea_id: data.id, user_id: user.id });
      
      setIdeas([data, ...ideas].sort((a, b) => b.upvotes - a.upvotes));
      setUserVotes(prev => new Set(prev).add(data.id));
      setNewIdea({ title: '', description: '' });
      setShowForm(false);
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under_review': return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Under Review</span>;
      case 'planned': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Planned</span>;
      case 'in_progress': return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full">In Progress</span>;
      case 'completed': return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Completed</span>;
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif italic text-[#111827]">Feature Ideas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1f2937] transition-all"
        >
          <Plus className="w-4 h-4" />
          Submit Idea
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-lg font-serif italic text-[#111827]">New Idea</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={newIdea.title}
              onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
              placeholder="Short, descriptive title"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              required
            />
            <textarea
              value={newIdea.description}
              onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
              placeholder="Describe your idea in detail..."
              className="w-full min-h-[120px] p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newIdea.title.trim() || !newIdea.description.trim()}
                className="flex items-center gap-2 bg-[#111827] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#1f2937] transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {ideas.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-[#6B7280] font-serif italic">No ideas yet. Be the first to suggest one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex gap-6 items-start"
            >
              <button
                onClick={() => handleVote(idea.id)}
                className={`shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl transition-colors min-w-[60px] ${
                  userVotes.has(idea.id) 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <ArrowUp className="w-5 h-5" />
                <span className="font-bold text-sm">{idea.upvotes}</span>
              </button>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between gap-4">
                  {getStatusBadge(idea.status)}
                  <span className="text-xs text-[#6B7280] font-medium">
                    {new Date(idea.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className="text-lg font-serif italic text-[#111827]">{idea.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed whitespace-pre-wrap">
                  {idea.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
