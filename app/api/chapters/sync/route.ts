import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";
import { format } from "date-fns";
import { isImportantMessage } from "@/lib/utils/importance";
import { mapToChapter } from "@/lib/utils/chapters";

const supabase = createClient();

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response("Missing userId", { status: 400 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return new Response("Missing API Key", { status: 500 });

    const authorEngine = new LifeAuthorEngine(apiKey);

    // 1. Fetch all chat messages that don't have a life_event yet
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, content, original_content, authored_content, created_at, type')
      .eq('user_id', userId)
      .eq('role', 'user')
      .eq('type', 'text')
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    if (!messages || messages.length === 0) return new Response(JSON.stringify({ message: "No messages found" }), { status: 200 });

    // Fetch existing life events to filter out already processed ones
    const { data: existingEvents } = await supabase
      .from('life_events')
      .select('message_id')
      .eq('user_id', userId);
      
    const existingMessageIds = new Set(existingEvents?.map(e => e.message_id) || []);
    const unprocessedMessages = messages.filter(m => !existingMessageIds.has(m.id));

    if (unprocessedMessages.length === 0) {
      return new Response(JSON.stringify({ message: "All messages are already processed" }), { status: 200 });
    }

    // 2. Extract Life Events for unprocessed messages
    const extractedEvents = [];
    for (const msg of unprocessedMessages) {
      const contentToProcess = msg.authored_content || msg.content;
      if (!contentToProcess) continue;
      
      if (isImportantMessage(msg)) {
        const eventData = await authorEngine.extractLifeEvent(contentToProcess);
        if (eventData) {
          extractedEvents.push({
            user_id: userId,
            message_id: msg.id,
            summary: eventData.summary,
            emotion: eventData.emotion,
            category: eventData.category,
            intensity: eventData.intensity,
            created_at: msg.created_at
          });
        }
      } else {
        // skip processing
      }
    }

    // Insert new life events
    if (extractedEvents.length > 0) {
      const { error: insertEventsError } = await supabase
        .from('life_events')
        .insert(extractedEvents);
      if (insertEventsError) throw insertEventsError;
    }

    // 3. Group all life events by category
    const { data: allEvents, error: allEventsError } = await supabase
      .from('life_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (allEventsError) throw allEventsError;
    if (!allEvents || allEvents.length === 0) {
      return new Response(JSON.stringify({ message: "Events extracted, but no new chapters needed yet." }), { status: 200 });
    }

    // 3.5 Clean existing data: Ensure all events have mapped categories
    for (const event of allEvents) {
      const mappedCat = mapToChapter(event.category || "Growth");
      if (mappedCat !== event.category) {
        await supabase
          .from('life_events')
          .update({ category: mappedCat })
          .eq('id', event.id);
        event.category = mappedCat; // Update local object for grouping
      }
    }

    const chaptersMap = new Map<string, any[]>();
    for (const event of allEvents) {
      const cat = mapToChapter(event.category || "Growth");
      if (!chaptersMap.has(cat)) {
        chaptersMap.set(cat, []);
      }
      chaptersMap.get(cat)!.push(event);
    }

    const organization = {
      chapters: Array.from(chaptersMap.entries()).map(([category, events]) => ({
        title: category,
        description: `Your journey in ${category}`,
        events: events.map(e => e.id)
      }))
    };

    if (!organization || !organization.chapters) {
      return new Response(JSON.stringify({ message: "Failed to organize chapters." }), { status: 500 });
    }

    // 4. Generate Chapters for each group
    // (We no longer delete all chapters, we upsert them based on name)
    
    for (const chap of organization.chapters) {
      if (!chap.events || chap.events.length === 0) continue;

      const chapterEvents = allEvents.filter(e => chap.events.includes(e.id));
      if (chapterEvents.length === 0) continue;
      
      const chapterInput = chapterEvents.map(e => ({
        summary: e.summary,
        emotion: e.emotion,
        category: e.category,
        date: format(new Date(e.created_at), 'MMM d, yyyy')
      }));

      const storyContent = await authorEngine.generateChapter(chapterInput);
      const originalSummaries = chapterEvents.map(e => e.summary).join('\n');
      
      // Determine dominant emotion and category (simple mode)
      const emotions = chapterEvents.map(e => e.emotion);
      const dominantEmotion = emotions.sort((a,b) => emotions.filter(v => v===a).length - emotions.filter(v => v===b).length).pop();

      // Create or Update Chapter
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .upsert({
          user_id: userId,
          name: chap.title,
          story_content: storyContent || chap.description,
          authored_content: storyContent || chap.description,
          original_content: originalSummaries,
          start_date: chapterEvents[0].created_at,
          end_date: chapterEvents[chapterEvents.length - 1].created_at,
          dominant_emotion: dominantEmotion,
          dominant_categories: [chap.title]
        }, { onConflict: 'user_id, name' })
        .select()
        .single();

      if (chapterError) throw chapterError;

      // Update events with chapter_id
      await supabase
        .from('life_events')
        .update({ chapter_id: chapter.id })
        .in('id', chap.events);
    }

    return new Response(JSON.stringify({ message: "Sync complete!" }), { status: 200 });
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
