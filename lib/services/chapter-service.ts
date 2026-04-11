import { createClient } from "@/lib/supabase";

const supabase = createClient();

export interface Chapter {
  id: string;
  user_id: string;
  name: string;
  summary: string | null;
  narrative: string | null;
  start_date: string;
  end_date: string | null;
  dominant_emotion: string | null;
  created_at: string;
  events?: any[];
}

export const chapterService = {
  async fetchChapters(userId: string): Promise<Chapter[]> {
    try {
      const query = supabase
        .from('chapters')
        .select('*, events:life_events(*)');

      const queryString = JSON.stringify(query);
      if (queryString.includes('chat_messages')) {
        throw new Error("SECURITY VIOLATION: Book view cannot access chat_messages.");
      }

      const { data, error } = await query
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
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

  async updateNarrativeAsync(userId: string, chapterId: string, chapterName: string, pipeline: any) {
    try {
      const { data: events } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (events && events.length > 0) {
        const narrative = await pipeline.generateNarrative(events);
        if (narrative) {
          await supabase.from('chapters').update({
            summary: narrative.summary,
            narrative: narrative.narrative,
            end_date: events[0].created_at,
          }).eq('id', chapterId);
        }
      }
    } catch (err) {
      console.error("Async narrative update failed:", err);
    }
  }
};
