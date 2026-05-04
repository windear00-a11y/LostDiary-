
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
      metadata?: Record<string, any>;
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
  }
};
