import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { coreService } from "@/lib/services/core-service";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { generateStoryResponse } from "@/ai-core/ai-engine";
import { extractIntelligenceProfile } from "@/ai-core/intelligence-engine";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key is required' }, { status: 500 });

    const body = await req.json();
    const { role, type, content, media_url, metadata, user_id } = body;
    let { session_id } = body;
    const language = metadata?.language || 'en';

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // STEP 1: Fetch user profile for context, including intelligence_profile
    const profile = await coreService.getProfile(user_id, supabase);
    const orchestrator = new AIOrchestrator(apiKey, profile.personality_summary);
    const pipelineForAsync = new PipelineController(apiKey, profile.personality_summary);

    // --- SMART SESSION MANAGEMENT ---
    // ...(omitted for brevity during fetch, handled implicitly via database)
    if (!session_id) {
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
        session_id = recentSession.id;
      } else {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ user_id, title: `Chapter: ${new Date().toLocaleDateString()}` })
          .select()
          .single();
        session_id = newSession?.id;
      }
    }

    let query = supabase
      .from('chat_messages')
      .select('content, role')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (session_id) query = query.eq('session_id', session_id);
    const { data: recentMessages } = await query;
    const contextMessages = recentMessages?.map(m => ({ content: m.content || "", role: m.role })) || [];
    
    // Safety fallback for empty intelligence profile
    const currentIntelProfile = profile.intelligence_profile || {
      basic_profile: {}, thinking_style: {}, emotional_state: {},
      interests_goals: {}, behavior_patterns: {}, communication_style: {},
      sensitive_insights: {}, source_weights: { chat: 0.3, diary: 0.7 }
    };

    // STEP 2: parallelize tasks (Reply, Pipeline, and Deep Intelligence Extraction)
    const [{ data: contextChaptersData }, { data: currentVolume }] = await Promise.all([
      supabase.from('chapters').select('content').eq('user_id', user_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('volumes').select('*').eq('user_id', user_id).eq('status', 'ongoing').maybeSingle()
    ]);
    const contextChapters = contextChaptersData?.map(c => c.content) || [];
    let activeVolume = currentVolume;

    if (!activeVolume) {
       const { data: lastVol } = await supabase.from('volumes').select('volume_number').eq('user_id', user_id).order('volume_number', { ascending: false }).limit(1).maybeSingle();
       const nextNum = (lastVol?.volume_number || 0) + 1;
       const { data: newVol } = await supabase.from('volumes').insert({
         user_id, volume_number: nextNum, title: 'Chapters of the Heart', status: 'ongoing'
       }).select().single();
       activeVolume = newVol;
    }

    const [pipelineOutput, aiResponseText, updatedIntelProfile] = await Promise.all([
      orchestrator.processInteraction({
        userId: user_id,
        message: { role, type, content },
        contextMessages: contextMessages.map(m => m.content),
        apiKey: apiKey,
        language,
        contextChapters
      }),
      generateStoryResponse(content, contextMessages, profile.bio, profile.personality_summary, currentIntelProfile as any),
      extractIntelligenceProfile('chat', content, currentIntelProfile as any)
    ]);

    const analyzedEvent = pipelineOutput.extractedEvent;
    
    // STEP 3: Save user message with rich metadata from pipeline
    const enrichedMetadata = {
      ...(metadata || {}),
      emotion: analyzedEvent?.emotion || 'neutral',
      importance: analyzedEvent?.score || 0,
      category: analyzedEvent?.category || 'General'
    };

    // Determine status and impact
    let processingStatus: 'woven' | 'saved' | 'observed' = 'observed';
    let impactPercentage = 10; // Default for observed

    if (pipelineOutput.narrativeUpdate?.narrative) {
      processingStatus = 'woven';
      impactPercentage = 85 + Math.floor(Math.random() * 15); // 85-100%
    } else if (pipelineOutput.extractedEvent) {
      processingStatus = 'saved';
      impactPercentage = 40 + Math.floor(Math.random() * 30); // 40-70%
    } else if (analyzedEvent?.score && analyzedEvent.score > 0.3) {
      impactPercentage = Math.floor(analyzedEvent.score * 100);
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id, session_id, role, type, content, media_url,
        metadata: enrichedMetadata, event_score: analyzedEvent?.score || 0,
        processing_status: processingStatus
      }).select().single();
    if (error) throw error;

    if (role === 'user' && type === 'text' && content) {
      await coreService.updateInteraction(user_id, !!aiResponseText, supabase);
    }
    
    // STEP 4: Save AI Response
    if (aiResponseText) {
      await supabase.from('chat_messages').insert({
        user_id, session_id, role: 'diary', type: 'text', content: aiResponseText
      });
      coreService.autoSaveChapter(user_id, aiResponseText);
    }

    // STEP 5: Update session title, user identity and narrative
    await supabase.from('users').update({ 
      personality_summary: pipelineOutput.personaUpdate || profile.personality_summary,
      bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate.summary : profile.bio,
      intelligence_profile: updatedIntelProfile
    }).eq('id', user_id);

    // Update Session status
    if (session_id) {
       await supabase.from('chat_sessions').update({ 
         processing_status: processingStatus,
         impact_percentage: impactPercentage
       }).eq('id', session_id);
    }

    // Save narrative chapter if triggered
    if (pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative) {
      const { data: newChapter } = await supabase.from('chapters').insert({
        user_id,
        volume_id: activeVolume?.id,
        title: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
        content: pipelineOutput.narrativeUpdate.narrative,
        created_at: new Date().toISOString()
      }).select().single();

      // Handle Volume Sealing
      if (pipelineOutput.narrativeUpdate.shouldSealVolume && activeVolume) {
        await supabase.from('volumes').update({ 
          status: 'completed',
          epilogue: pipelineOutput.narrativeUpdate.currentVolumeEpilogue || null
        }).eq('id', activeVolume.id);
        
        if (pipelineOutput.narrativeUpdate.newVolumeMetadata) {
          const meta = pipelineOutput.narrativeUpdate.newVolumeMetadata;
          await supabase.from('volumes').insert({
            user_id,
            volume_number: activeVolume.volume_number + 1,
            title: meta.title || 'Next Phase',
            prologue: meta.prologue,
            epigraph: meta.epigraph,
            aura: meta.aura,
            status: 'ongoing'
          });
        }
      }
    }

    if (session_id) {
      const { data: session } = await supabase.from('chat_sessions').select('title').eq('id', session_id).single();
      const isGeneric = !session?.title || session.title === 'New Chat' || session.title.startsWith('Chat ') || session.title.includes(new Date().toLocaleDateString());

      if (isGeneric) {
        const { data: sessionMessages } = await supabase.from('chat_messages').select('content').eq('session_id', session_id).order('created_at', { ascending: true }).limit(5);
        if (sessionMessages && sessionMessages.length >= 2) {
          const contents = sessionMessages.map(m => m.content || "");
          const title = await pipelineForAsync.generateSessionTitle(contents);
          if (title) await supabase.from('chat_sessions').update({ title }).eq('id', session_id);
        }
      }
    }

    return NextResponse.json({
      message,
      aiResponse: aiResponseText ? { role: 'diary', content: aiResponseText, created_at: new Date().toISOString() } : null,
      event_score: pipelineOutput.extractedEvent?.score || 0
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
