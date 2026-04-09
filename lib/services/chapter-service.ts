import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface Chapter {
  id: string;
  user_id: string;
  name: string;
  story_content: string | null;
  original_content: string | null;
  authored_content: string | null;
  start_date: string;
  end_date: string | null;
  dominant_emotion: string | null;
  dominant_categories: string[] | null;
  created_at: string;
  events?: any[];
}

export const chapterService = {
  async fetchChapters(userId: string): Promise<Chapter[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*, events:life_events(*)')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      // Sort events within each chapter chronologically
      const chaptersWithSortedEvents = (data || []).map((chapter: any) => ({
        ...chapter,
        events: (chapter.events || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));

      return chaptersWithSortedEvents;
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
