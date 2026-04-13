import { getSupabase } from "@/lib/supabase";

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

export const profileService = {
  async getProfile(userId: string, customSupabase?: any): Promise<UserProfile> {
    const supabase = customSupabase || getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Default profile
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
      
      // Try to create it if it doesn't exist
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
    
    // Simple engagement tracking logic
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
