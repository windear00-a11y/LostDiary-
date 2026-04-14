import { getSupabase } from "@/lib/supabase";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id?: string;
  role: 'user' | 'diary';
  type: 'text' | 'image' | 'video' | 'audio' | 'location';
  content: string | null;
  media_url: string | null;
  metadata: any | null;
  created_at: string;
  event_score?: number;
  status?: 'sending' | 'saved' | 'error';
}

export const chatService = {
  async fetchSessions(userId: string): Promise<ChatSession[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
    return data || [];
  },

  async createSession(userId: string, title: string = "New Chat"): Promise<ChatSession> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async fetchMessages(userId: string, sessionId?: string | null): Promise<ChatMessage[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      query = query.is('session_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async sendMessage(input: {
    user_id: string;
    session_id?: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }): Promise<ChatMessage> {
    const { type, content, metadata, user_id, session_id } = input;
    
    // Handle input types:
    // - text → store directly in content
    // - image/video/audio → upload to storage → store URL in content
    // - location → store lat/lng in metadata
    
    let finalContent = typeof content === 'string' ? content : null;
    let mediaUrl = null;

    if (type !== "text" && type !== "location" && content instanceof File) {
      finalContent = await this.uploadMedia(content, user_id);
      mediaUrl = finalContent; // For backward compatibility with media_url column
    }

    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        session_id,
        role: 'user',
        type,
        content: finalContent,
        media_url: mediaUrl,
        metadata: metadata || {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  },

  async uploadMedia(file: File, userId: string): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('chat_media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('chat_media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },

  async updateSessionTitle(userId: string, sessionId: string, title: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async generateSessionTitle(userId: string, sessionId: string): Promise<string> {
    const response = await fetch('/api/chat/sessions/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, session_id: sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate title');
    }

    const data = await response.json();
    return data.title;
  }
};
