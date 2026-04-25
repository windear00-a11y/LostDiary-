import { chatPersistence } from "@/lib/services/chat-persistence";
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

    // DoW / Rate Limit Payload protection
    if (type === 'text' && content && content.length > 5000) {
      return NextResponse.json({ error: 'Message payload too large. Please shorten your reflection.' }, { status: 413 });
    }

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
    if (!session_id) {
       // Only fetch if session_id is missing
       const { data: recentSession } = await supabase
        .from('chat_sessions')
        .select('id, updated_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid 404/Empty issues
      
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      
      if (recentSession && new Date(recentSession.updated_at) > twelveHoursAgo) {
        session_id = recentSession.id;
      } else {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ user_id, title: `Chapter: ${new Date().toLocaleDateString()}` })
          .select('id')
          .single();
        session_id = newSession?.id;
      }
    }

    // Parallel fetch only essential context for this turn
    const [ { data: recentMessages }, { data: contextChaptersData }, { data: currentVolume }] = await Promise.all([
      supabase.from('chat_messages').select('content, role')
        .eq('user_id', user_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('chapters').select('content').eq('user_id', user_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('volumes').select('*').eq('user_id', user_id).eq('status', 'ongoing').maybeSingle()
    ]);

    const contextMessages = recentMessages?.map(m => ({ content: m.content || "", role: m.role })) || [];
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

    // Sequential extraction to ensure AI response uses updated intelligence
    const intelProfile = profile.intelligence_profile || {};
    const updatedIntelProfile = await extractIntelligenceProfile('chat', content, intelProfile as any);

    // STEP 4: Orchestration and AI generation (Core Path - Keep Awaited)
    const [pipelineOutput, aiResponseText] = await Promise.all([
      orchestrator.processInteraction({
        userId: user_id,
        message: { role, type, content },
        contextMessages: contextMessages.map(m => m.content),
        apiKey: apiKey,
        language,
        contextChapters,
        updatedIntelProfile
      }),
      generateStoryResponse(content, contextMessages, profile.bio, profile.personality_summary, updatedIntelProfile as any),
    ]);

    const analyzedEvent = pipelineOutput.extractedEvent;
    
    // STEP 5: Reliable Persistence (Core Path - Keep Awaited)
    const { data: message, error: messageError } = await chatPersistence.saveUserMessage(supabase, {
        user_id, session_id, role, type, content, media_url: media_url || null,
        metadata: {
          ...(metadata || {}),
          emotion: analyzedEvent?.emotion || 'neutral',
          importance: analyzedEvent?.score || 0,
          category: analyzedEvent?.category || 'General'
        },
        event_score: analyzedEvent?.score || 0,
        processing_status: pipelineOutput.narrativeUpdate?.narrative ? 'woven' : (pipelineOutput.extractedEvent ? 'saved' : 'observed')
    });
      
    if (messageError) throw messageError;

    // Concurrently handle interactions & immediate AI response persistence
    await Promise.all([
      (role === 'user' && type === 'text' && content) ? chatPersistence.saveAIResponse(supabase, { user_id, session_id, role: 'diary', type: 'text', content: aiResponseText }) : Promise.resolve(),
      (role === 'user' && type === 'text' && content) ? coreService.updateInteraction(user_id, !!aiResponseText, supabase) : Promise.resolve()
    ]);

    // Return the response promptly! The heavy lifting below happens in the background.
    const responseToUser = NextResponse.json({
      message,
      aiResponse: aiResponseText ? { role: 'diary', content: aiResponseText, created_at: new Date().toISOString() } : null,
      event_score: pipelineOutput.extractedEvent?.score || 0
    });

    // --- BACKGROUND TASKS (Fire and forget, do not await) ---
    (async () => {
      try {
        await Promise.all([
          // Update Context
          chatPersistence.updateUserContext(supabase, user_id, { 
            personality_summary: pipelineOutput.personaUpdate || profile.personality_summary,
            bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate.summary : profile.bio,
            intelligence_profile: updatedIntelProfile
          }),
          // Update Session
          session_id ? chatPersistence.updateSessionStatus(supabase, session_id, { 
            processing_status: pipelineOutput.narrativeUpdate?.narrative ? 'woven' : (pipelineOutput.extractedEvent ? 'saved' : 'observed'),
            impact_percentage: pipelineOutput.narrativeUpdate?.narrative ? 90 : (pipelineOutput.extractedEvent ? 50 : 10)
          }) : Promise.resolve(),
          // Narrative Chapters & Volumes
          (pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative) ? (async () => {
             await chatPersistence.saveChapter(supabase, {
              user_id,
              volume_id: activeVolume?.id,
              title: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
              content: pipelineOutput.narrativeUpdate.narrative,
              created_at: new Date().toISOString()
            });

            if (pipelineOutput.narrativeUpdate.shouldSealVolume && activeVolume) {
              await chatPersistence.sealVolume(supabase, activeVolume.id, { 
                status: 'completed',
                epilogue: pipelineOutput.narrativeUpdate.currentVolumeEpilogue || null
              });
              
              if (pipelineOutput.narrativeUpdate.newVolumeMetadata) {
                const meta = pipelineOutput.narrativeUpdate.newVolumeMetadata;
                await chatPersistence.createNewVolume(supabase, {
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
          })() : Promise.resolve(),
          // Title Generation
          session_id ? (async () => {
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
          })() : Promise.resolve(),
          // Chapter Auto-save
          aiResponseText ? coreService.autoSaveChapter(user_id, aiResponseText) : Promise.resolve()
        ]);
      } catch (e) {
        console.error("Background task failure:", e);
      }
    })();

    return responseToUser;

  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
