
import { SupabaseClient } from '@supabase/supabase-js';

export const chatPersistence = {
  saveUserMessage: async (
    supabase: SupabaseClient,
    data: {
      user_id: string;
      session_id: string | null;
      role: 'user' | 'diary';
      type: 'text' | 'image';
      content: string | null;
      media_url: string | null;
      metadata: Record<string, any>;
      event_score: number;
      processing_status: 'woven' | 'saved' | 'observed';
      embedding?: number[] | null;
    }
  ) => {
    return await supabase.from('chat_messages').insert(data).select().single();
  },

  saveAIResponse: async (
    supabase: SupabaseClient,
    data: {
      user_id: string;
      session_id: string | null;
      role: 'diary';
      type: 'text';
      content: string;
    }
  ) => {
    return await supabase.from('chat_messages').insert(data);
  },

  updateUserContext: async (
    supabase: SupabaseClient,
    user_id: string,
    data: {
      personality_summary?: string;
      bio?: string;
      intelligence_profile?: any;
    }
  ) => {
    return await supabase.from('users').update(data).eq('id', user_id);
  },

  updateSessionStatus: async (
    supabase: SupabaseClient,
    session_id: string,
    data: {
      processing_status: 'woven' | 'saved' | 'observed';
      impact_percentage: number;
    }
  ) => {
    return await supabase.from('chat_sessions').update(data).eq('id', session_id);
  },
  
  saveChapter: async (
    supabase: SupabaseClient,
    data: {
      user_id: string;
      volume_id: string | undefined;
      title: string;
      content: string;
      created_at: string;
    }
  ) => {
    return await supabase.from('chapters').insert(data).select().single();
  },

  sealVolume: async (
    supabase: SupabaseClient,
    volume_id: string,
    data: {
      status: 'completed';
      epilogue: string | null;
    }
  ) => {
    return await supabase.from('volumes').update(data).eq('id', volume_id);
  },

  createNewVolume: async (
    supabase: SupabaseClient,
    data: {
      user_id: string;
      volume_number: number;
      title: string;
      prologue?: string;
      epigraph?: string;
      aura?: string;
      status: 'ongoing';
    }
  ) => {
    return await supabase.from('volumes').insert(data);
  }
};
