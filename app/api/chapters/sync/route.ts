import { getSupabase } from "@/lib/supabase";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { format } from "date-fns";
import { isImportantMessage } from "@/lib/utils/importance";
import { mapToChapter } from "@/lib/utils/chapters";

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase)
      return new Response("Supabase not initialized", { status: 500 });

    const { userId } = await req.json();
    if (!userId) return new Response("Missing userId", { status: 400 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return new Response("Missing API Key", { status: 500 });

    const pipeline = new PipelineController(apiKey);

    // 1. Fetch all chat messages that don't have a life_event yet
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, content, created_at, type")
      .eq("user_id", userId)
      .eq("role", "user")
      .eq("type", "text")
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;
    if (!messages || messages.length === 0)
      return new Response(JSON.stringify({ message: "No messages found" }), {
        status: 200,
      });

    // Fetch existing life events to filter out already processed ones
    const { data: existingEvents } = await supabase
      .from("life_events")
      .select("message_id")
      .eq("user_id", userId);

    const existingMessageIds = new Set(
      existingEvents?.map((e: any) => e.message_id) || [],
    );
    const unprocessedMessages = messages.filter(
      (m: any) => !existingMessageIds.has(m.id),
    );

    if (unprocessedMessages.length === 0) {
      return new Response(
        JSON.stringify({ message: "All messages are already processed" }),
        { status: 200 },
      );
    }

    // 2. Extract Life Events for unprocessed messages
    const extractedEvents = [];
    for (const msg of unprocessedMessages) {
      const contentToProcess = msg.content;
      if (!contentToProcess) continue;

      if (isImportantMessage(msg)) {
        const eventData = await pipeline.extractLifeEvent(contentToProcess);
        if (eventData) {
          extractedEvents.push({
            user_id: userId,
            message_id: msg.id,
            summary: eventData.summary,
            emotion: eventData.emotion,
            event_score: eventData.score || 5,
            created_at: msg.created_at,
            // Temporary field for grouping, will be removed or ignored by DB if not in schema
            // We need to map it to chapter_id later
            _temp_category: eventData.category,
          });
        }
      } else {
        // skip processing
      }
    }

    // Since we need chapter_id, we should insert chapters first or find them
    // Let's group extracted events by category first
    const chaptersMap = new Map<string, any[]>();
    for (const event of extractedEvents) {
      const cat = mapToChapter(event._temp_category || "Growth");
      if (!chaptersMap.has(cat)) {
        chaptersMap.set(cat, []);
      }
      chaptersMap.get(cat)!.push(event);
    }

    // Ensure chapters exist and get their IDs
    for (const [category, events] of chaptersMap.entries()) {
      let chapterId = null;
      const { data: existingChapter } = await supabase
        .from("chapters")
        .select("id")
        .eq("user_id", userId)
        .eq("name", category)
        .single();

      if (existingChapter) {
        chapterId = existingChapter.id;
      } else {
        const { data: newChapter, error: chapterError } = await supabase
          .from("chapters")
          .insert({
            user_id: userId,
            name: category,
            start_date: events[0].created_at,
          })
          .select()
          .single();

        if (!chapterError && newChapter) {
          chapterId = newChapter.id;
        }
      }

      // Assign chapter_id and remove _temp_category
      for (const event of events) {
        event.chapter_id = chapterId;
        delete event._temp_category;
      }
    }

    // Insert new life events
    if (extractedEvents.length > 0) {
      const { error: insertEventsError } = await supabase
        .from("life_events")
        .insert(extractedEvents);
      if (insertEventsError) throw insertEventsError;
    }

    // 3. Group all life events by chapter_id
    const { data: allEvents, error: allEventsError } = await supabase
      .from("life_events")
      .select("*, chapters(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (allEventsError) throw allEventsError;
    if (!allEvents || allEvents.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Events extracted, but no new chapters needed yet.",
        }),
        { status: 200 },
      );
    }

    const allChaptersMap = new Map<string, any[]>();
    for (const event of allEvents) {
      const cat = event.chapters?.name || "Growth";
      if (!allChaptersMap.has(cat)) {
        allChaptersMap.set(cat, []);
      }
      allChaptersMap.get(cat)!.push(event);
    }

    const organization = {
      chapters: Array.from(allChaptersMap.entries()).map(
        ([category, events]) => ({
          title: category,
          description: `Your journey in ${category}`,
          events: events.map((e: any) => e.id),
        }),
      ),
    };

    if (!organization || !organization.chapters) {
      return new Response(
        JSON.stringify({ message: "Failed to organize chapters." }),
        { status: 500 },
      );
    }

    // 4. Generate Chapters for each group

    for (const chap of organization.chapters) {
      if (!chap.events || chap.events.length === 0) continue;

      const chapterEvents = allEvents.filter((e: any) =>
        chap.events.includes(e.id),
      );
      if (chapterEvents.length === 0) continue;

      const chapterInput = chapterEvents.map((e: any) => ({
        summary: e.summary,
        emotion: e.emotion,
        category: chap.title,
        date: format(new Date(e.created_at), "MMM d, yyyy"),
      }));

      const chapterData = await pipeline.generateNarrative(chapterInput, []);
      if (!chapterData) continue;

      // Determine dominant emotion
      const emotions = chapterEvents.map((e: any) => e.emotion);
      const dominantEmotion = emotions
        .sort(
          (a: any, b: any) =>
            emotions.filter((v: any) => v === a).length -
            emotions.filter((v: any) => v === b).length,
        )
        .pop();

      // Create or Update Chapter
      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .upsert(
          {
            user_id: userId,
            name: chap.title,
            summary: chapterData.summary,
            narrative: chapterData.narrative,
            start_date: chapterEvents[0].created_at,
            end_date: chapterEvents[chapterEvents.length - 1].created_at,
            dominant_emotion: dominantEmotion,
          },
          { onConflict: "user_id, name" },
        )
        .select()
        .single();

      if (chapterError) throw chapterError;
    }

    return new Response(JSON.stringify({ message: "Sync complete!" }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
