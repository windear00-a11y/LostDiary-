'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Rocket, Zap, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export function MajorUpdateModal() {
  const [update, setUpdate] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchMajorUpdate = async () => {
      // Fetch the latest active major update
      const { data: updates, error: updatesError } = await supabase
        .from('updates')
        .select('*')
        .eq('is_active', true)
        .eq('is_major', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updatesError || !updates || updates.length === 0) return;

      const majorUpdate = updates[0];

      // Check if user has read it
      const { data: userUpdate, error: userUpdateError } = await supabase
        .from('user_updates')
        .select('is_read')
        .eq('user_id', user.id)
        .eq('update_id', majorUpdate.id)
        .single();

      // If no record exists or it's not read, show the modal
      if (userUpdateError || !userUpdate?.is_read) {
        setUpdate(majorUpdate);
        setIsOpen(true);
      }
    };

    fetchMajorUpdate();
  }, [user, supabase]);

  const handleClose = async () => {
    setIsOpen(false);
    
    if (user && update && supabase) {
      // Mark as read
      await supabase.from('user_updates').upsert({
        user_id: user.id,
        update_id: update.id,
        is_read: true,
        read_at: new Date().toISOString()
      }, { onConflict: 'user_id, update_id' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new': return <Rocket className="w-6 h-6 text-indigo-500" />;
      case 'improvement': return <Zap className="w-6 h-6 text-green-500" />;
      case 'upcoming': return <Sparkles className="w-6 h-6 text-yellow-500" />;
      default: return <Rocket className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && update && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 space-y-6"
          >
            <button 
              onClick={handleClose} 
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
              {getIcon(update.type)}
            </div>

            <div className="space-y-3">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                Major Update
              </div>
              <h2 className="text-2xl font-serif italic text-[#111827]">{update.title}</h2>
              <p className="text-[#6B7280] leading-relaxed text-sm whitespace-pre-wrap">
                {update.description}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-[#111827] text-white py-4 rounded-2xl font-medium hover:bg-[#1f2937] transition-all active:scale-[0.98] shadow-xl shadow-gray-200"
            >
              Got it, thanks!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
