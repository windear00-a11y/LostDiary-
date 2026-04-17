import { getSupabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

// --- Chat Service ---
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

// --- Chapter Service ---
export interface Chapter {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// --- Profile Service ---
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  personality_summary: string | null;
  responsiveness_level: number; // 0-1
  emotional_sensitivity: number; // 0-1
  engagement_level: number; // 0-1
  interaction_frequency: number;
  last_response_at: string;
  updated_at: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export const coreService = {
  // Chat
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
    
    let finalContent = typeof content === 'string' ? content : null;
    let mediaUrl = null;

    if (type !== "text" && type !== "location" && content instanceof File) {
      finalContent = await this.uploadMedia(content, user_id);
      mediaUrl = finalContent;
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
  },

  // Chapter
  async fetchChapters(userId: string): Promise<Chapter[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching chapters:", error);
      return [];
    }
    return data || [];
  },

  async autoSaveChapter(userId: string, content: string) {
    const supabase = getSupabase();
    if (!supabase) return;

    this.generateTitle(content).then(async (title) => {
      try {
        await supabase.from('chapters').insert({
          user_id: userId,
          title: title || 'New Chapter',
          content: content,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error auto-saving chapter:", error);
      }
    });
  },

  async generateTitle(content: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Generate a short title (max 5 words) for this chapter content: ${content.substring(0, 200)}` }] }],
        config: { temperature: 0.7 }
      });
      return response.text?.trim() || 'New Chapter';
    } catch (error) {
      console.error("Error generating title:", error);
      return 'New Chapter';
    }
  },

  // Diary Entries (Raw Writing)
  async saveDiaryEntry(userId: string, content: string): Promise<DiaryEntry> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: userId,
        content: content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async fetchDiaryEntries(userId: string): Promise<DiaryEntry[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching diary entries:", error);
      return [];
    }
    return data || [];
  },

  // Profile
  async getProfile(userId: string, customSupabase?: any): Promise<UserProfile> {
    const supabase = customSupabase || getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const defaultProfile = {
        id: userId,
        display_name: null,
        avatar_url: null,
        bio: null,
        personality_summary: null,
        responsiveness_level: 0.5,
        emotional_sensitivity: 0.5,
        engagement_level: 0.5,
        interaction_frequency: 0,
        last_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data: newData } = await supabase
        .from('users')
        .insert(defaultProfile)
        .select()
        .single();
        
      return newData || defaultProfile;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, base64Image: string): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const res = await fetch(base64Image);
    const blob = await res.blob();
    
    const fileName = `${userId}/avatar_${Date.now()}.png`;
    
    const { error } = await supabase.storage
      .from('chat_media')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('chat_media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },

  async updateInteraction(userId: string, wasResponded: boolean, customSupabase?: any): Promise<void> {
    const supabase = customSupabase || getSupabase();
    if (!supabase) return;
    const profile = await this.getProfile(userId, supabase);
    
    const newInteractionFrequency = profile.interaction_frequency + 1;
    const newEngagementLevel = Math.min(1, profile.engagement_level + (wasResponded ? 0.05 : 0.01));
    
    await supabase
      .from('users')
      .update({
        interaction_frequency: newInteractionFrequency,
        engagement_level: newEngagementLevel,
        last_response_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
};
