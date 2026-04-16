import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { coreService } from "@/lib/services/core-service";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { generateStoryResponse } from "@/ai-core/ai-engine";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key is required' }, { status: 500 });

    const orchestrator = new AIOrchestrator(apiKey);
    const pipelineForAsync = new PipelineController(apiKey);

    const body = await req.json();
    const { role, type, content, media_url, metadata, user_id, session_id } = body;
    const language = metadata?.language || 'en';

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // STEP 1: Fetch context for AI
    let query = supabase
      .from('chat_messages')
      .select('content, role')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    const { data: recentMessages } = await query;

    const contextMessages = recentMessages?.map(m => ({ content: m.content || "", role: m.role })) || [];
    
    // STEP 2: Save user message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        session_id,
        role,
        type,
        content,
        media_url,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Run Orchestrator
    const pipelineOutput = await orchestrator.processInteraction({
      userId: user_id,
      message: { role, type, content },
      contextMessages: contextMessages.map(m => m.content),
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      language
    });

    // Track interaction
    if (role === 'user' && type === 'text' && content) {
      await coreService.updateInteraction(user_id, pipelineOutput.shouldRespond, supabase);
    }

    // Save AI Response if generated
    if (pipelineOutput.shouldRespond) {
      aiResponseText = await generateStoryResponse(content, contextMessages);
      
      if (aiResponseText) {
        await supabase.from('chat_messages').insert({
          user_id,
          session_id,
          role: 'diary',
          type: 'text',
          content: aiResponseText
        });
        
        // Automatically save chapter
        coreService.autoSaveChapter(user_id, aiResponseText);
      }
    }
    
    // STEP 4: Update session title if generic (Async-ish)
    if (session_id) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('title')
        .eq('id', session_id)
        .single();
      
      const isGeneric = !session?.title || 
                        session.title === 'New Chat' || 
                        session.title.startsWith('Chat ') || 
                        session.title.includes(new Date().toLocaleDateString());

      if (isGeneric) {
        // Fetch last few messages to generate a good title
        const { data: sessionMessages } = await supabase
          .from('chat_messages')
          .select('content')
          .eq('session_id', session_id)
          .order('created_at', { ascending: true })
          .limit(5);
        
        if (sessionMessages && sessionMessages.length >= 2) {
          const contents = sessionMessages.map(m => m.content || "");
          const title = await pipelineForAsync.generateSessionTitle(contents);
          if (title) {
            await supabase
              .from('chat_sessions')
              .update({ title })
              .eq('id', session_id);
          }
        }
      }
    }

    return NextResponse.json({
      ...message,
      event_score: pipelineOutput.extractedEvent?.score || 0
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
