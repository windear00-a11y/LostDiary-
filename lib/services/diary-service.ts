import { createClient } from "@/lib/supabase";
import { DiaryEntry } from "@/lib/store/use-diary-store";

const supabase = createClient();

export const diaryService = {
  async fetchEntries(userId: string): Promise<DiaryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching entries:", error);
      throw error;
    }
  },

  async createEntry(userId: string, content: string, imageUrl?: string, aiResponse?: any): Promise<DiaryEntry> {
    try {
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          ai_response: aiResponse,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating entry:", error);
      throw error;
    }
  },

  async updateEntry(id: string, content: string, imageUrl?: string, aiResponse?: any): Promise<DiaryEntry> {
    try {
      const { data, error } = await supabase
        .from('entries')
        .update({
          content,
          image_url: imageUrl,
          ai_response: aiResponse,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    }
  },

  async deleteEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  }
};
