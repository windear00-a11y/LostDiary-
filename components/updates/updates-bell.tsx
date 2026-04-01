'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export function UpdatesBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabase = null;
  }

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchUnreadCount = async () => {
      // Fetch all active updates
      const { data: updates, error: updatesError } = await supabase
        .from('updates')
        .select('id')
        .eq('is_active', true);

      if (updatesError || !updates) return;

      // Fetch user's read updates
      const { data: userUpdates, error: userUpdatesError } = await supabase
        .from('user_updates')
        .select('update_id')
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (userUpdatesError || !userUpdates) return;

      const readUpdateIds = new Set(userUpdates.map((u: any) => u.update_id));
      const unread = updates.filter((u: any) => !readUpdateIds.has(u.id)).length;
      
      setUnreadCount(unread);
    };

    fetchUnreadCount();

    // Optional: Realtime subscription for new updates
    const channel = supabase
      .channel('public:updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'updates' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return (
    <button
      onClick={() => router.push('/updates')}
      className="relative p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
      title="Updates"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
}
