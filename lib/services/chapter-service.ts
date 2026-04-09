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
      // SAFEGUARD: Explicitly forbid chat_messages access
      const query = supabase
        .from('chapters')
        .select('*, events:life_events(*)');

      // Runtime check to ensure query does not include chat_messages
      const queryString = JSON.stringify(query);
      if (queryString.includes('chat_messages')) {
        throw new Error("SECURITY VIOLATION: Book view cannot access chat_messages.");
      }

      const { data, error } = await query
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
  },

  async updateNarrativeAsync(userId: string, chapterId: string, chapterName: string, authorEngine: any) {
    try {
      const { data: events } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_name', chapterName)
        .order('created_at', { ascending: false })
        .limit(10);

      if (events && events.length > 0) {
        const narrative = await authorEngine.generateNarrative(events);
        if (narrative) {
          await supabase.from('chapters').update({
            story_content: narrative.narrative,
            end_date: events[0].created_at,
            dominant_categories: [chapterName]
          }).eq('id', chapterId);
        }
      }
    } catch (err) {
      console.error("Async narrative update failed:", err);
    }
  }
};
