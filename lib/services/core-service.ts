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

interface ChatMessage {
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
  thinking_step?: string;
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
    onUpdate?: (content: string, thinkingStep?: string) => void;
  }): Promise<ChatMessage> {
    const { type, content, metadata, user_id, session_id, onUpdate } = input;
    
    let finalContent = typeof content === 'string' ? content : null;
    let mediaUrl = null;

    if (type !== "text" && type !== "location" && content instanceof File) {
      finalContent = await this.uploadMedia(content, user_id);
      mediaUrl = finalContent;
    }

    if (!onUpdate) {
       console.warn("coreService.sendMessage called without onUpdate. Streaming is REQUIRED. Providing a dummy function.");
       onUpdate = () => {};
    }

    // Stream path
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        session_id,
        messages: [{ role: 'user', content: finalContent }],
        language: metadata?.language || 'en',
        timezone: metadata?.timezone
      })
    });

      if (!response.ok) {
        let text = '';
        try {
          text = await response.text();
        } catch (e) {}
        
        let parsedError = null;
        try {
          if (text) parsedError = JSON.parse(text);
        } catch (e) {}

        throw new Error(JSON.stringify({
          error: parsedError?.error || parsedError?.message || text || 'Failed to send message',
          stack: parsedError?.stack || undefined,
          status: response.status,
          type: parsedError?.type || 'server_error'
        }));
      }

      const responseSessionId = response.headers.get('x-session-id') || session_id;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiFullContent = '';
      let lastThinkingStep = '';
      let buffer = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
  
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
  
              // Handle SSE (Server-Sent Events)
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.slice(6).trim();
                if (dataStr === '[DONE]') continue;
  
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === 'text-delta') {
                    aiFullContent += (data.delta || data.text || data.textDelta || '');
                    if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                  } else if (data.type === 'reasoning-delta') {
                    const delta = data.delta || data.text || data.textDelta || '';
                    if (delta) {
                      lastThinkingStep = `Thinking: ${delta.slice(0, 30)}...`;
                      if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                    }
                  } else if (data.type === 'tool-call' || data.type === 'tool-input-start' || data.type === 'tool-input-available') {
                    const toolName = data.toolName || 'tool';
                    lastThinkingStep = `Using ${toolName}...`;
                    if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                  } else if (data.type === 'error' || data.type === 'tool-input-error') {
                    lastThinkingStep = `Error: ${data.errorText || data.error || 'Unknown stream error'}`;
                    if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                  }
                  continue;
                } catch (e) {}
              }
  
              // AI SDK Data Stream Protocol
              try {
                const type = trimmedLine[0];
                const contentStr = trimmedLine.slice(2);
                
                if (type === '0') {
                  const text = JSON.parse(contentStr);
                  aiFullContent += text;
                  if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                } else if (type === '1') {
                  // Reasoning part (thinking)
                  try {
                    const text = JSON.parse(contentStr);
                    if (text) {
                      lastThinkingStep = `Thinking: ${text.slice(0, 30)}...`;
                      if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                    }
                  } catch (e) {}
                } else if (type === '3') {
                  const errMessage = JSON.parse(contentStr);
                  lastThinkingStep = `Server Error: ${errMessage}`;
                  if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                } else if (type === 'd') {
                  const data = JSON.parse(contentStr);
                  if (data.type === 'step') {
                    lastThinkingStep = data.value;
                    if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                  }
                } else if (type === '9') {
                  const toolCall = JSON.parse(contentStr);
                  lastThinkingStep = `Consulting ${toolCall.toolName}...`;
                  if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
                }
              } catch (e) {}
  
              // Raw text fallback
              if (!trimmedLine.startsWith('data: ') && !/^[0-9abd-f]:/.test(trimmedLine)) {
                aiFullContent += line + '\n';
                if (onUpdate) onUpdate(aiFullContent, lastThinkingStep);
              }
            }
          }
        } catch (readError: any) {
          console.error("Reader loop error:", readError);
          lastThinkingStep = `Connection Lost: ${readError.message}`;
        }
      }
        
        // Final attempt to process any remaining buffer
        if (buffer.trim()) {
          const line = buffer.trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6).trim());
              if (data.type === 'text-delta') {
                aiFullContent += (data.delta || data.text || data.textDelta || '');
              }
            } catch (e) {}
          } else {
            // Try old protocol
            try {
              const type = line[0];
              if (type === '0') {
                aiFullContent += JSON.parse(line.slice(2));
              }
            } catch (e) {}
          }
        }

        if (!aiFullContent || aiFullContent.trim().length === 0) {
        // Fallback for empty stream
        console.error("Empty stream. lastThinkingStep:", lastThinkingStep);
        
        // Structure the error more clearly for the user
        let errorMessage = "I'm holding this space for you, but my words are lost in the mist for a moment.";
        if (lastThinkingStep) {
          if (lastThinkingStep.includes('Server Error') || lastThinkingStep.includes('Error:')) {
            errorMessage = `[WinDear Technical Error]\nEvent: Cognitive Shadow\nContext: Stream Failure\nTechnical Detail: "${lastThinkingStep}"\n\nPossible Causes: API Rate Limit, Model Unavailability, or Regional Deployment Shadow. Check Console for Pipeline Logs.`;
          } else {
            errorMessage = `WinDear was processing a thought: "${lastThinkingStep}", but the connection was severed. Status: Stream Terminated.`;
          }
        }

        return {
          id: `diary-err-${Date.now()}`,
          user_id,
          session_id: responseSessionId,
          role: 'diary',
          type: 'text',
          content: errorMessage,
          media_url: null,
          metadata: { error: 'empty_stream', lastThinkingStep },
          created_at: new Date().toISOString(),
          processing_status: 'error'
        } as ChatMessage;
      }

      return {
        id: `diary-${Date.now()}`,
        user_id,
        session_id: responseSessionId,
        role: 'diary',
        type: 'text',
        content: aiFullContent,
        media_url: null,
        metadata: {},
        created_at: new Date().toISOString(),
        processing_status: 'saved' // fallback, will be accurately fetched by frontend
      } as ChatMessage;

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
  async saveDiaryEntry(userId: string, content: string, metadata?: any): Promise<{entry: DiaryEntry, processingStatus?: string}> {
    const response = await fetch('/api/journal/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, user_id: userId, content, metadata: metadata || {} })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to save diary entry');
    }

    const { entry, processingStatus } = await response.json();
    return { entry, processingStatus };
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
