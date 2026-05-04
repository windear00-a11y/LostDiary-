import { getSupabase } from "@/lib/supabase";
import { getGenAI } from "@/lib/genai";

import { generateContentWithFallback } from "@/lib/genai-utils";

// --- Chat Service ---
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  processing_status?: 'active' | 'woven';
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
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

// --- Extracted Signals ---
export interface ExtractedSignal {
  id: string;
  message_id: string;
  user_id: string;
  emotion: string | null;
  intensity: 'low' | 'medium' | 'high' | null;
  trigger_context: string | null;
  behavior_type: string | null;
  created_at: string;
}

// --- Behavior Patterns ---
export interface BehaviorPattern {
  id: string;
  user_id: string;
  pattern_description: string;
  frequency_count: number;
  status: 'active' | 'observing' | 'resolved';
  last_detected_at: string;
  created_at: string;
}

// --- Direction Engine (Purpose Layer) ---
export interface CoreValue {
  id: string;
  user_id: string;
  value_name: string;
  confidence_score: number;
  created_at: string;
}

export interface EnergyMap {
  id: string;
  user_id: string;
  activity_type: string;
  energy_level: 'energizing' | 'draining' | 'neutral';
  confidence_score: number;
  created_at: string;
}

export interface Experiment {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  findings: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DirectionInsight {
  id: string;
  user_id: string;
  content: string;
  insight_type: 'role' | 'environment' | 'strength' | 'growth';
  is_read: boolean;
  created_at: string;
}

export interface EvolutionTrend {
  id: string;
  user_id: string;
  trend_description: string;
  time_period: string;
  created_at: string;
}

// --- Insights ---
export interface Insight {
  id: string;
  user_id: string;
  pattern_id: string | null;
  content: string;
  action_suggestion: string | null;
  is_read: boolean;
  created_at: string;
}

// --- Profile Service ---
export interface UserProfile {
  id: string;
  awareness_score: number;
  reaction_ratio: number;
  created_at: string;
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

  async fetchMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(input: {
    user_id: string;
    session_id?: string;
    content: string;
    metadata?: any;
    onUpdate?: (content: string, thinkingStep?: string) => void;
  }): Promise<ChatMessage> {
    const { content, user_id, session_id, metadata, onUpdate } = input;
    
    const finalContent = content;

    const actualOnUpdate = onUpdate || (() => {});

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
                      actualOnUpdate(aiFullContent, lastThinkingStep);
                    } else if (data.type === 'reasoning-delta') {
                      const delta = data.delta || data.text || data.textDelta || '';
                      if (delta) {
                        lastThinkingStep = `Thinking: ${delta.slice(0, 30)}...`;
                        actualOnUpdate(aiFullContent, lastThinkingStep);
                      }
                    } else if (data.type === 'tool-call' || data.type === 'tool-input-start' || data.type === 'tool-input-available') {
                      const toolName = data.toolName || 'tool';
                      lastThinkingStep = `Using ${toolName}...`;
                      actualOnUpdate(aiFullContent, lastThinkingStep);
                    } else if (data.type === 'error' || data.type === 'tool-input-error') {
                      lastThinkingStep = `Error: ${data.errorText || data.error || 'Unknown stream error'}`;
                      actualOnUpdate(aiFullContent, lastThinkingStep);
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
                  actualOnUpdate(aiFullContent, lastThinkingStep);
                } else if (type === '1') {
                  // Reasoning part (thinking)
                  try {
                    const text = JSON.parse(contentStr);
                    if (text) {
                      lastThinkingStep = `Thinking: ${text.slice(0, 30)}...`;
                      actualOnUpdate(aiFullContent, lastThinkingStep);
                    }
                  } catch (e) {}
                } else if (type === '3') {
                  const errMessage = JSON.parse(contentStr);
                  lastThinkingStep = `Server Error: ${errMessage}`;
                  actualOnUpdate(aiFullContent, lastThinkingStep);
                } else if (type === 'd') {
                  const data = JSON.parse(contentStr);
                  if (data.type === 'step') {
                    lastThinkingStep = data.value;
                    actualOnUpdate(aiFullContent, lastThinkingStep);
                  }
                } else if (type === '9') {
                  const toolCall = JSON.parse(contentStr);
                  lastThinkingStep = `Consulting ${toolCall.toolName}...`;
                  actualOnUpdate(aiFullContent, lastThinkingStep);
                }
              } catch (e) {}
  
              // Raw text fallback
              if (!trimmedLine.startsWith('data: ') && !/^[0-9abd-f]:/.test(trimmedLine)) {
                aiFullContent += line + '\n';
                actualOnUpdate(aiFullContent, lastThinkingStep);
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
          role: 'assistant',
          content: errorMessage,
          created_at: new Date().toISOString()
        } as ChatMessage;
      }

      return {
        id: `diary-${Date.now()}`,
        user_id,
        session_id: responseSessionId,
        role: 'assistant',
        content: aiFullContent,
        created_at: new Date().toISOString()
      } as ChatMessage;

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

  async endSession(userId: string, sessionId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    // Mark as finished/ready for deep weaving
    const { error } = await supabase
      .from('chat_sessions')
      .update({ processing_status: 'woven', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Profile
  async getProfile(userId: string, customSupabase?: any): Promise<UserProfile> {
    const supabase = customSupabase || getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const defaultProfile = {
        id: userId,
        awareness_score: 0,
        reaction_ratio: 0.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data: newData } = await supabase
        .from('profiles')
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
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
