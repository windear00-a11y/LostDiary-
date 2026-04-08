import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";

const supabase = createClient();
const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

function isImportantMessage(message: any) {
  const content = message.content || "";
  const includesStrongEmotion = /sad|angry|hate|terrible|worst|stressed|anxious|failed|lonely|overwhelmed|exhausted|worried|frustrated|annoyed|happy|great|awesome|love|excited|wonderful|joy|blessed|proud/i.test(content);
  return (
    content.length > 80 ||
    includesStrongEmotion ||
    message.type !== "text"
  );
}

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

    // 2. Fetch the event (created in send route)
    const { data: event, error: eventError } = await supabase
      .from('life_events')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (event && !eventError) {
      const finalCategory = event.category;

      // 4. Organize/Update Chapters
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', userId)
        .eq('title', finalCategory)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let chapterId = chapter?.id;
      if (!chapter) {
        const { data: newChapter, error: newChapterError } = await supabase
          .from('chapters')
          .insert({
            user_id: userId,
            title: finalCategory,
            story_content: `Your journey in ${finalCategory}`,
            dominant_categories: [finalCategory]
          })
          .select()
          .single();
        if (!newChapterError && newChapter) {
          chapterId = newChapter.id;
        }
      }

      if (chapterId) {
        // Update event with chapter_id
        await supabase.from('life_events').update({ chapter_id: chapterId }).eq('id', event.id);

        // Update chapter narrative
        const { data: eventsInChapter, error: eventsError } = await supabase
          .from('life_events')
          .select('*')
          .eq('chapter_id', chapterId);
          
        if (!eventsError && eventsInChapter) {
          const chapterInput = eventsInChapter.map(e => ({
            summary: e.summary,
            emotion: e.emotion,
            category: e.category
          }));
          const storyContent = await authorEngine.generateChapter(chapterInput);
          await supabase.from('chapters').update({ story_content: storyContent }).eq('id', chapterId);
        }
      }

      // 5. (optional) AI Reply
      if (authorEngine.shouldRespond(event.intensity)) {
        const reply = await authorEngine.generateDiaryResponse(event);
        if (reply) {
          await supabase.from('chat_messages').insert({
            user_id: userId,
            role: 'diary',
            type: 'text',
            content: reply,
            original_content: reply,
            authored_content: reply
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error("Process chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
