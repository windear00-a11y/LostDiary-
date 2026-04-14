import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase";
import { PipelineController } from "@/ai-core/pipeline-controller";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key is required' }, { status: 500 });

    const { session_id, user_id } = await req.json();

    if (!session_id || !user_id) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 });
    }

    // Fetch messages for this session
    const { data: messages, error: fetchError } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('session_id', session_id)
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) throw fetchError;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages found for this session' }, { status: 404 });
    }

    const messageContents = messages.map(m => m.content || "");
    
    const pipeline = new PipelineController(apiKey);
    const title = await pipeline.generateSessionTitle(messageContents);

    if (title) {
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', session_id)
        .eq('user_id', user_id);

      if (updateError) throw updateError;
      
      return NextResponse.json({ title });
    }

    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  } catch (error: any) {
    console.error("Generate title error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
