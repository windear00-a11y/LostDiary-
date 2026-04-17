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
    const { role, type, content, media_url, metadata, user_id } = body;
    let { session_id } = body;
    const language = metadata?.language || 'en';

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // --- SMART SESSION MANAGEMENT ---
    if (!session_id) {
      // Find the most recent active session for this user
      const { data: recentSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      
      if (recentSession && new Date(recentSession.updated_at) > twelveHoursAgo) {
        // Continue the recent session
        session_id = recentSession.id;
      } else {
        // Create a new session for a new 'moment' of the day
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ 
            user_id, 
            title: `Chapter: ${new Date().toLocaleDateString()}` 
          })
          .select()
          .single();
        session_id = newSession?.id;
      }
    }
    // --------------------------------

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
    
    // STEP 2: Save user message with rich metadata
    const pipelineForAsync = new PipelineController(apiKey);
    const analyzedEvent = await pipelineForAsync.extractLifeEvent(content);
    
    const enrichedMetadata = {
      ...(metadata || {}),
      emotion: analyzedEvent?.emotion || 'neutral',
      importance: analyzedEvent?.score || 0,
      category: analyzedEvent?.category || 'General'
    };

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        session_id,
        role,
        type,
        content,
        media_url,
        metadata: enrichedMetadata,
        event_score: analyzedEvent?.score || 0
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
    let aiResponseText: string | null = null;
    if (pipelineOutput.shouldRespond) {
      // Fetch long-term memory for context
      const profile = await coreService.getProfile(user_id, supabase);
      
      // Use the modern resilient engine with long-term memory
      aiResponseText = await generateStoryResponse(content, contextMessages, profile.personality_summary) || null;
      
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
    
    // STEP 4: Update session title and user narrative (Async-ish)
    if (session_id) {
      // 4.1 Update User Narrative/Memory
      if (pipelineOutput.narrativeUpdate) {
        await supabase
          .from('users')
          .update({ personality_summary: pipelineOutput.narrativeUpdate.summary })
          .eq('id', user_id);
      }

      // 4.2 Update session title if generic
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
      message,
      aiResponse: aiResponseText ? {
        role: 'diary',
        content: aiResponseText,
        created_at: new Date().toISOString()
      } : null,
      event_score: pipelineOutput.extractedEvent?.score || 0
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
