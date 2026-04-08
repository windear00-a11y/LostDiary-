import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";
import { format } from "date-fns";

const supabase = createClient();

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response("Missing userId", { status: 400 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return new Response("Missing API Key", { status: 500 });

    const authorEngine = new LifeAuthorEngine(apiKey);

    // 1. Fetch all entries that don't have a life_event yet
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;
    if (!entries || entries.length === 0) return new Response(JSON.stringify({ message: "No entries found" }), { status: 200 });

    // Fetch existing life events to filter out already processed ones
    const { data: existingEvents } = await supabase
      .from('life_events')
      .select('entry_id')
      .eq('user_id', userId);
      
    const existingEntryIds = new Set(existingEvents?.map(e => e.entry_id) || []);
    const unprocessedEntries = entries.filter(e => !existingEntryIds.has(e.id));

    if (unprocessedEntries.length === 0) {
      return new Response(JSON.stringify({ message: "All entries are already processed" }), { status: 200 });
    }

    // 2. Extract Life Events for unprocessed entries
    const extractedEvents = [];
    for (const entry of unprocessedEntries) {
      const eventData = await authorEngine.extractLifeEvent(entry.content);
      if (eventData) {
        extractedEvents.push({
          user_id: userId,
          entry_id: entry.id,
          summary: eventData.summary,
          emotion: eventData.emotion,
          category: eventData.category,
          impact_score: eventData.impact_score,
          created_at: entry.created_at
        });
      }
    }

    // Insert new life events
    if (extractedEvents.length > 0) {
      const { error: insertEventsError } = await supabase
        .from('life_events')
        .insert(extractedEvents);
      if (insertEventsError) throw insertEventsError;
    }

    // 3. Group all life events by Month/Year to create chapters
    const { data: allEvents, error: allEventsError } = await supabase
      .from('life_events')
      .select('*')
      .eq('user_id', userId)
      .is('chapter_id', null)
      .order('created_at', { ascending: true });

    if (allEventsError) throw allEventsError;
    if (!allEvents || allEvents.length === 0) {
      return new Response(JSON.stringify({ message: "Events extracted, but no new chapters needed yet." }), { status: 200 });
    }

    // Grouping logic: Group by Month-Year
    const groups: Record<string, any[]> = {};
    allEvents.forEach(event => {
      const monthYear = format(new Date(event.created_at), 'MMMM yyyy');
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });

    // 4. Generate Chapters for each group
    for (const [monthYear, groupEvents] of Object.entries(groups)) {
      // Only generate a chapter if there are at least 3 events, or if it's an older month
      // For simplicity in this script, we'll generate a chapter for any group
      
      const chapterInput = groupEvents.map(e => ({
        summary: e.summary,
        emotion: e.emotion,
        category: e.category,
        date: format(new Date(e.created_at), 'MMM d, yyyy')
      }));

      const storyContent = await authorEngine.generateChapter(chapterInput);
      
      if (storyContent) {
        // Determine dominant emotion and category (simple mode)
        const emotions = groupEvents.map(e => e.emotion);
        const categories = groupEvents.map(e => e.category);
        const dominantEmotion = emotions.sort((a,b) => emotions.filter(v => v===a).length - emotions.filter(v => v===b).length).pop();
        const dominantCategory = categories.sort((a,b) => categories.filter(v => v===a).length - categories.filter(v => v===b).length).pop();

        // Create Chapter
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            user_id: userId,
            title: `Chapter: ${monthYear}`,
            story_content: storyContent,
            start_date: groupEvents[0].created_at,
            end_date: groupEvents[groupEvents.length - 1].created_at,
            dominant_emotion: dominantEmotion,
            dominant_categories: [dominantCategory]
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        // Update events with chapter_id
        const eventIds = groupEvents.map(e => e.id);
        await supabase
          .from('life_events')
          .update({ chapter_id: chapter.id })
          .in('id', eventIds);
      }
    }

    return new Response(JSON.stringify({ message: "Sync complete!" }), { status: 200 });
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
