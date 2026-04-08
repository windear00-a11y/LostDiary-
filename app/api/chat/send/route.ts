import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase";
import { LifeAuthorEngine } from "@/ai-core/life-author";

const supabase = createClient();
const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, type, content, media_url, user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let original_content = content;
    let authored_content = content;
    let extractedEvent = null;

    // STEP 1 & 3: Consolidated AI Pipeline
    if (role === 'user' && type === 'text' && content) {
      try {
        const result = await authorEngine.processMessageConsolidated(content);
        authored_content = result.authored;
        extractedEvent = result.event;
      } catch (error) {
        console.error("Consolidated AI processing failed:", error);
      }
    }

    // STEP 1: Save both fields together
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        role,
        type,
        content, // keeping legacy content field for compatibility
        original_content,
        authored_content,
        media_url
      })
      .select()
      .single();

    if (error) throw error;

    // STEP 2: Save Life Event if extracted
    if (extractedEvent && message) {
      await supabase.from('life_events').insert({
        user_id,
        message_id: message.id,
        summary: extractedEvent.summary,
        emotion: extractedEvent.emotion,
        category: extractedEvent.category,
        intensity: extractedEvent.intensity
      });
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
