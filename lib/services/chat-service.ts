import { getSupabase } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'diary';
  type: 'text' | 'image' | 'video' | 'audio' | 'location';
  content: string | null;
  media_url: string | null;
  metadata: any | null;
  created_at: string;
  event_score?: number;
}

export const chatService = {
  async fetchMessages(userId: string): Promise<ChatMessage[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(input: {
    user_id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }): Promise<ChatMessage> {
    const { type, content, metadata, user_id } = input;
    
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
  }
};
