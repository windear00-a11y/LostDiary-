import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface Chapter {
  id: string;
  user_id: string;
  title: string;
  story_content: string | null;
  start_date: string;
  end_date: string | null;
  dominant_emotion: string | null;
  dominant_categories: string[] | null;
  created_at: string;
}

export const chapterService = {
  async fetchChapters(userId: string): Promise<Chapter[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching chapters:", error);
      throw error;
    }
  },

  async fetchChapterById(chapterId: string): Promise<Chapter | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching chapter:", error);
      return null;
    }
  }
};
