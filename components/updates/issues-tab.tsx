'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertCircle, Plus, Bug, LayoutTemplate, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { logger } from '@/lib/logger';

export function IssuesTab() {
  const { user } = useAuth();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    logger.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '', type: 'bug' });

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchIssues = async () => {
      setIsLoading(true);
      
      const { data } = await supabase
        .from('issues')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setIssues(data || []);
      setIsLoading(false);
    };

    fetchIssues();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newIssue.title.trim() || !newIssue.description.trim() || isSubmitting || !supabase) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('issues')
      .insert({
        user_id: user.id,
        title: newIssue.title.trim(),
        description: newIssue.description.trim(),
        type: newIssue.type
      })
      .select()
      .single();

    if (!error && data) {
      setIssues([data, ...issues]);
      setNewIssue({ title: '', description: '', type: 'bug' });
      setShowForm(false);
    }

    setIsSubmitting(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-5 h-5 text-red-500" />;
      case 'ux': return <LayoutTemplate className="w-5 h-5 text-indigo-500" />;
      case 'performance': return <Zap className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Open</span>;
      case 'in_progress': return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full">In Progress</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Resolved</span>;
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
        <h2 className="text-xl font-serif italic text-[#111827]">Report an Issue</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1f2937] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-serif italic text-[#111827]">Describe the Issue</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <select
                value={newIssue.type}
                onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                className="p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              >
                <option value="bug">Bug</option>
                <option value="ux">UX / Design</option>
                <option value="performance">Performance</option>
              </select>
              <input
                type="text"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                placeholder="Short, descriptive title"
                className="flex-1 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                required
              />
            </div>
            <textarea
              value={newIssue.description}
              onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              placeholder="Please provide details to help us reproduce or understand the issue..."
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
                disabled={isSubmitting || !newIssue.title.trim() || !newIssue.description.trim()}
                className="flex items-center gap-2 bg-[#111827] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#1f2937] transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#6B7280] px-2">Your Reported Issues</h3>
        {issues.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100">
            <p className="text-[#6B7280] font-serif italic">You haven&apos;t reported any issues yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex gap-6 items-start"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    {getTypeIcon(issue.type)}
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    {getStatusBadge(issue.status)}
                    <span className="text-xs text-[#6B7280] font-medium">
                      {new Date(issue.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif italic text-[#111827]">{issue.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed whitespace-pre-wrap">
                    {issue.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
