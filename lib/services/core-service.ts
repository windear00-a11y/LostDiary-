import { getSupabase } from "@/lib/supabase";
import { getGenAI } from "@/lib/genai";

import { generateContentWithFallback } from "@/lib/genai-utils";

// --- Chat Service ---
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  processing_status?: 'woven' | 'saved' | 'observed' | 'pending';
  impact_percentage?: number;
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
  processing_status?: 'woven' | 'saved' | 'observed' | 'pending';
}

// --- Chapter Service ---
export interface Volume {
  id: string;
  user_id: string;
  volume_number: number;
  title: string;
  prologue: string | null;
  epigraph: string | null;
  aura: string | null;
  epilogue: string | null;
  status: 'ongoing' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  user_id: string;
  volume_id?: string;
  name: string;
  narrative: string;
  is_sealed: boolean;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  processing_status?: 'woven' | 'saved' | 'observed' | 'pending';
  impact_percentage?: number;
  created_at: string;
  updated_at: string;
}

// --- User Intelligence Profile ---
export interface IntelligenceProfile {
  basic_profile: Record<string, any>;
  thinking_style: Record<string, any>;
  emotional_state: Record<string, any>;
  interests_goals: Record<string, any>;
  behavior_patterns: Record<string, any>;
  communication_style: Record<string, any>;
  sensitive_insights: Record<string, any>;
  last_updated?: string;
  source_weights?: {
    chat: number;
    diary: number;
  };
}

// --- Profile Service ---
export interface UserProfile {
  id: string;
  display_name: string | null;
  pen_name: string | null;
  pen_name_tag: string | null;
  avatar_url: string | null;
  bio: string | null;
  personality_summary: string | null;
  intelligence_profile: IntelligenceProfile | null;
  preferred_language: string;
  responsiveness_level: number; // 0-1
  emotional_sensitivity: number; // 0-1
  is_pending_deletion?: boolean;
  deletion_scheduled_at?: string | null;

  engagement_level: number; // 0-1
  interaction_frequency: number;
  last_response_at: string;
  updated_at: string;
}


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

    if (sessionId !== undefined) {
      if (sessionId === null) {
        query = query.is('session_id', null);
      } else {
        query = query.eq('session_id', sessionId);
      }
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
  async fetchVolumes(userId: string): Promise<Volume[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('volumes')
      .select('*')
      .eq('user_id', userId)
      .order('volume_number', { ascending: true });
    
    if (error) {
      console.error("Error fetching volumes:", error);
      return [];
    }
    return data || [];
  },

  async fetchChapters(userId: string, volumeId?: string): Promise<Chapter[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    let query = supabase
      .from('chapters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (volumeId) {
      query = query.eq('volume_id', volumeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching chapters:", error);
      return [];
    }
    return data || [];
  },

  async autoSaveChapter(userId: string, content: string) {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // Find ongoing volume
      const { data: vol } = await supabase.from('volumes').select('id').eq('user_id', userId).eq('status', 'ongoing').maybeSingle();
      let volumeId = vol?.id;

      if (!volumeId) {
        const { data: lastVol } = await supabase.from('volumes').select('volume_number').eq('user_id', userId).order('volume_number', { ascending: false }).limit(1).maybeSingle();
        const nextNum = (lastVol?.volume_number || 0) + 1;
        const { data: newVol } = await supabase.from('volumes').insert({
          user_id: userId, volume_number: nextNum, title: 'Chapters of the Heart', status: 'ongoing'
        }).select().single();
        volumeId = newVol?.id;
      }

      const title = await this.generateTitle(content);
      
      await supabase.from('chapters').insert({
        user_id: userId,
        volume_id: volumeId,
        name: title || 'New Chapter',
        narrative: content,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error auto-saving chapter:", error);
    }
  },

  async generateTitle(content: string): Promise<string | null> {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
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
  async saveDiaryEntry(userId: string, content: string, metadata?: any): Promise<DiaryEntry> {
    const response = await fetch('/api/journal/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, user_id: userId, content, metadata: metadata || {} })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to save diary entry');
    }

    const { entry } = await response.json();
    return entry;
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
        pen_name: null,
        pen_name_tag: null,
        avatar_url: null,
        bio: null,
        personality_summary: null,
        intelligence_profile: {
          basic_profile: {},
          thinking_style: {},
          emotional_state: {},
          interests_goals: {},
          behavior_patterns: {},
          communication_style: {},
          sensitive_insights: {},
          source_weights: { chat: 0.3, diary: 0.7 }
        },
        preferred_language: 'en',
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
    
    // Auto-generate tag if a new pen_name is provided
    if ('pen_name' in updates && updates.pen_name) {
      const current = await this.getProfile(userId);
      // Only generate if pen name changed or tag is missing
      if (current.pen_name !== updates.pen_name || !current.pen_name_tag) {
        let success = false;
        let finalData = null;
        let attempts = 0;
        
        while (!success && attempts < 5) {
          const randomTag = Math.floor(1000 + Math.random() * 9000).toString(); // #1000 to #9999
          const { data, error } = await supabase
            .from('users')
            .update({ ...updates, pen_name_tag: randomTag, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
            
          if (error) {
             if (error.code === '23505') { // Postgres Unique Violation Code
                attempts++;
             } else {
                throw error;
             }
          } else {
             success = true;
             finalData = data;
          }
        }
        if (!success) throw new Error("Could not generate a unique Pen Name tag. Please try again.");
        return finalData;
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async syncSanctuaryMirror(userId: string): Promise<{ profile: UserProfile, summary: string }> {
    const messages = await this.fetchMessages(userId);
    const context = messages
      .filter(m => m.role === 'user' && m.content)
      .slice(-50) // Analyze up to 50 recent messages for depth
      .map(m => m.content)
      .join('\n');

    if (!context) {
      throw new Error("No entries found to analyze. Start writing in your sanctuary.");
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.1-pro-preview",
      contents: `Perform a deep psychological and spiritual analysis of this digital archive. 
Your goal is to populate a "Sanctuary Mirror" across several dimensions and provide a "Soul Signature" summary.

Archive Context:
${context}

Return a JSON object with the following structure:
{
  "summary": "A 1-2 sentence deep, evocative Soul Signature (poetic and insightful)",
  "intelligence": {
    "thinking_style": { "pattern_name": "value", ... },
    "emotional_state": { "core_resonance": "value", ... },
    "communication_style": { "rhythm": "value", ... },
    "behavior_patterns": { "tendency": "value", ... },
    "interests_goals": { "orbit": "value", ... },
    "sensitive_insights": { "unspoken": "value", ... }
  }
}

Be insightful, non-judgmental, and evocative. Use high-level vocabulary fitting a "Mirror of the Soul".`,
    });

    try {
      const text = response.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const updated = await this.updateProfile(userId, {
        personality_summary: parsed.summary,
        intelligence_profile: {
          ...parsed.intelligence,
          source_weights: { chat: 0.5, diary: 0.5 },
          last_updated: new Date().toISOString()
        }
      });

      return { profile: updated, summary: parsed.summary };
    } catch (e) {
      console.error("Mirror Analysis Parse Error:", e);
      throw new Error("WinDear encountered a cognitive blur. Please try syncing again.");
    }
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
  },

  async requestAccountDeletion(userId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    await supabase
      .from('users')
      .update({ is_pending_deletion: true, deletion_scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', userId);
  }
};
