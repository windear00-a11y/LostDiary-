import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'diary';
  type: 'text' | 'image' | 'video' | 'audio' | 'location';
  content: string | null;
  original_content: string | null;
  authored_content: string | null;
  media_url: string | null;
  created_at: string;
}

export const chatService = {
  async fetchMessages(userId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  },

  async uploadMedia(file: File, userId: string): Promise<string> {
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
