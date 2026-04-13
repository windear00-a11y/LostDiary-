import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { mapToChapter } from "@/lib/utils/chapters";
import { chapterService } from "@/lib/services/chapter-service";
import { profileService } from "@/lib/services/profile-service";
import { PipelineController } from "@/ai-core/pipeline-controller";

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
      .select('content')
      .eq('user_id', user_id)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(10);

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    const { data: recentMessages } = await query;

    const contextMessages = recentMessages?.map(m => m.content || "") || [];
    
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
      contextMessages,
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      language
    });

    // Track interaction
    if (role === 'user' && type === 'text' && content) {
      await profileService.updateInteraction(user_id, pipelineOutput.shouldRespond);
    }

    // Save Life Event if extracted
    if (pipelineOutput.extractedEvent && message) {
      const chapterName = mapToChapter(pipelineOutput.extractedEvent.category);
      
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
        summary: pipelineOutput.extractedEvent.summary,
        emotion: pipelineOutput.extractedEvent.emotion,
        event_score: pipelineOutput.extractedEvent.score || 5
      });

      // Update Chapter Narrative (Async)
      if (chapterId) {
        chapterService.updateNarrativeAsync(user_id, chapterId, chapterName, pipelineForAsync);
      }
    }

    // Save AI Response if generated and high-value
    if (pipelineOutput.aiResponse && pipelineOutput.isHighValue) {
      const aiResponse = pipelineOutput.aiResponse;
      const responseText = `${aiResponse.emotion_reflection}\n\n${aiResponse.validation}\n\n${aiResponse.insight}\n\n${aiResponse.gentle_suggestion}\n\n${aiResponse.short_reply}`;
      
      await supabase.from('chat_messages').insert({
        user_id,
        session_id,
        role: 'diary',
        type: 'text',
        content: responseText
      });
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
