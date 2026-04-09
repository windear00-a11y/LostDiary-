import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface UserProfile {
  user_id: string;
  responsivenessLevel: number; // 0-1
  emotionalSensitivity: number; // 0-1
  engagementLevel: number; // 0-1
  interactionFrequency: number;
  lastResponseAt: string;
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
      return {
        user_id: userId,
        responsivenessLevel: 0.5,
        emotionalSensitivity: 0.5,
        engagementLevel: 0.5,
        interactionFrequency: 0,
        lastResponseAt: new Date().toISOString(),
      };
    }
    return data;
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
