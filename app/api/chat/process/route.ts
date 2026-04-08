import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";

const supabase = createClient();
const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messageId, userId } = await req.json();

    // 1. Fetch the message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) throw new Error("Message not found");

    // 2. Extract Event (if text)
    if (message.type === 'text' && message.content) {
      const eventData = await authorEngine.extractLifeEvent(message.content);
      
      if (eventData) {
        // 3. Save Event
        const { data: event, error: eventError } = await supabase
          .from('life_events')
          .insert({
            user_id: userId,
            entry_id: messageId,
            summary: eventData.summary,
            emotion: eventData.emotion,
            category: eventData.category,
            intensity: eventData.intensity
          })
          .select()
          .single();
        
        if (eventError) throw eventError;

        // 4. Organize/Update Chapters (simplified: just update the chapter narrative)
        // For now, let's just update the chapter narrative for the category
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('user_id', userId)
          .contains('dominant_categories', [eventData.category])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (chapter) {
          // Update chapter narrative
          const { data: eventsInChapter, error: eventsError } = await supabase
            .from('life_events')
            .select('*')
            .eq('chapter_id', chapter.id);
            
          if (!eventsError && eventsInChapter) {
            const chapterInput = eventsInChapter.map(e => ({
              summary: e.summary,
              emotion: e.emotion,
              category: e.category
            }));
            const storyContent = await authorEngine.generateChapter(chapterInput);
            await supabase.from('chapters').update({ story_content: storyContent }).eq('id', chapter.id);
          }
        }

        // 5. (optional) AI Reply
        if (authorEngine.shouldRespond(eventData.intensity)) {
          const reply = await authorEngine.generateDiaryResponse(eventData);
          if (reply) {
            await supabase.from('chat_messages').insert({
              user_id: userId,
              role: 'diary',
              type: 'text',
              content: reply
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error("Process chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
