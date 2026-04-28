'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ResonanceEvent {
  type: string;
  data: any;
  userId: string;
}

export function useChapterEngagement(chapterId: string | null, userId: string = 'anonymous') {
  const [activeGhosts, setActiveGhosts] = useState(0);
  const [lastResonance, setLastResonance] = useState<ResonanceEvent | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase || !chapterId) return;

    // 1. Join Channel
    const channel = supabase.channel(`chapter:${chapterId}`, {
      config: { presence: { key: userId } }
    });

    channelRef.current = channel;

    // 2. Presence tracking (How many ghosts are here)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setActiveGhosts(Object.keys(state).length);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // 3. Broadcast handling (Instant resonance feedback)
    channel.on('broadcast', { event: 'resonance' }, ({ payload }: { payload: any }) => {
      setLastResonance(payload);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapterId, userId, supabase]);

  const sendResonance = (type: string, data: any) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'resonance',
      payload: { type, data, userId }
    });
  };

  return { activeGhosts, lastResonance, sendResonance };
}
