import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  personality_summary: string | null;
  responsivenessLevel: number; // 0-1
  emotionalSensitivity: number; // 0-1
  engagementLevel: number; // 0-1
  interactionFrequency: number;
  lastResponseAt: string;
  updated_at: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Default profile
      const defaultProfile = {
        user_id: userId,
        display_name: null,
        avatar_url: null,
        bio: null,
        personality_summary: null,
        responsivenessLevel: 0.5,
        emotionalSensitivity: 0.5,
        engagementLevel: 0.5,
        interactionFrequency: 0,
        lastResponseAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Try to create it if it doesn't exist
      const { data: newData } = await supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single();
        
      return newData || defaultProfile;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, base64Image: string): Promise<string> {
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

  async updateInteraction(userId: string, wasResponded: boolean): Promise<void> {
    const profile = await this.getProfile(userId);
    
    // Simple engagement tracking logic
    const newInteractionFrequency = profile.interactionFrequency + 1;
    const newEngagementLevel = Math.min(1, profile.engagementLevel + (wasResponded ? 0.05 : 0.01));
    
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        interactionFrequency: newInteractionFrequency,
        engagementLevel: newEngagementLevel,
        lastResponseAt: new Date().toISOString(),
      });
  }
};
