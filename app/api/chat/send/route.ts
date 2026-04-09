import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";
import { analyzeEntries } from "@/ai-core/pattern-detector";
import { isImportantMessage } from "@/lib/utils/importance";
import { mapToChapter } from "@/lib/utils/chapters";

const supabase = createClient();
const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, type, content, media_url, metadata, user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let original_content = content;
    let authored_content = content;
    let extractedEvent = null;
    let aiResponse = null;

    // STEP 1: Fetch context for AI
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('authored_content, content')
      .eq('user_id', user_id)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(10);

    const contextMessages = recentMessages?.map(m => m.authored_content || m.content || "") || [];
    const patterns = analyzeEntries(contextMessages);
    
    // STEP 2: Consolidated AI Pipeline
    const isImportant = isImportantMessage({ content, type });
    
    if (role === 'user' && type === 'text' && content) {
      try {
        const result = await authorEngine.processMessageConsolidated(
          content, 
          { recent_messages: contextMessages.slice(0, 5) } as any, 
          patterns
        );
        authored_content = result.authored;
        // Only extract event if message is deemed important
        extractedEvent = isImportant ? result.event : null;
        aiResponse = result.response;
      } catch (error) {
        console.error("Consolidated AI processing failed:", error);
      }
    }

    // STEP 3: Save user message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        role,
        type,
        content,
        original_content,
        authored_content,
        media_url,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    // STEP 4: Save Life Event if extracted
    if (extractedEvent && message) {
      const chapterName = mapToChapter(extractedEvent.category);
      
      // Ensure chapter exists
      let chapterId = null;
      const { data: existingChapter } = await supabase
        .from('chapters')
        .select('id')
        .eq('user_id', user_id)
        .eq('name', chapterName)
        .single();
      
      if (existingChapter) {
        chapterId = existingChapter.id;
      } else {
        const { data: newChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            user_id,
            name: chapterName,
            start_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!chapterError && newChapter) {
          chapterId = newChapter.id;
        }
      }

      await supabase.from('life_events').insert({
        user_id,
        message_id: message.id,
        chapter_id: chapterId,
        chapter_name: chapterName,
        summary: extractedEvent.summary,
        emotion: extractedEvent.emotion,
        category: extractedEvent.category,
        intensity: extractedEvent.intensity || 'medium'
      });

      // STEP 5: Update Chapter Narrative (Incremental)
      try {
        const { data: events } = await supabase
          .from('life_events')
          .select('*')
          .eq('user_id', user_id)
          .eq('chapter_name', chapterName)
          .order('created_at', { ascending: false })
          .limit(10);

        if (events && events.length > 0 && chapterId) {
          const narrative = await authorEngine.generateChapter(events);
          if (narrative) {
            await supabase.from('chapters').update({
              story_content: narrative,
              end_date: events[0].created_at,
              dominant_categories: [chapterName]
            }).eq('id', chapterId);
          }
        }
      } catch (chapterErr) {
        console.error("Chapter update failed:", chapterErr);
      }
    }

    // STEP 6: Save AI Response if generated
    if (aiResponse) {
      const responseText = `${aiResponse.emotion_reflection}\n\n${aiResponse.validation}\n\n${aiResponse.insight}\n\n${aiResponse.gentle_suggestion}\n\n${aiResponse.short_reply}`;
      
      await supabase.from('chat_messages').insert({
        user_id,
        role: 'diary',
        type: 'text',
        content: responseText,
        original_content: responseText,
        authored_content: responseText
      });
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
