import { chatPersistence } from "@/lib/services/chat-persistence";
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { coreService } from "@/lib/services/core-service";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { generateStoryResponse, generateEmbedding } from "@/ai-core/ai-engine";
import { extractIntelligenceProfile } from "@/ai-core/intelligence-engine";

// Helper to determine the best model for the interaction ("Magic Way")
function determineModelForInput(content: string): string {
  const wordCount = content.split(/\s+/).length;
  // Use Pro for long reflections or deep analytical intent
  if (wordCount > 40 || content.toLowerCase().match(/why|explain|deep|analyze|reflect|meaning/)) {
    return "gemini-3.1-pro-preview";
  }
  // Use Flash Lite for quick, everyday chat
  return "gemini-3-flash-preview";
}

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
    const orchestrator = new AIOrchestrator(apiKey, profile.personality_summary || undefined);
    const pipelineForAsync = new PipelineController(apiKey, profile.personality_summary || undefined);

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
    // STEP 1: Sliding Window - Fetch only the last 15 messages for direct working memory
    const { data: recentMessages } = await supabase.from('chat_messages').select('content, role')
        .eq('user_id', user_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(15);

    const { data: contextChaptersData } = await supabase.from('chapters').select('narrative')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(3);

    const { data: currentVolume } = await supabase.from('volumes').select('*')
        .eq('user_id', user_id)
        .eq('status', 'ongoing')
        .maybeSingle();

    // STEP 2: Semantic Search (True Vector RAG)
    // Generate embedding for the current user input
    let olderContextMessages: any[] = [];
    let userEmbedding: number[] | null = null;
    
    if (content && content.trim().length > 0) {
      try {
        userEmbedding = await generateEmbedding(content);
        
        if (userEmbedding && userEmbedding.length > 0) {
          // Fetch up to 5 relevant messages from older interactions across ANY session using match_messages RPC
          const { data: relatedMessages, error: searchError } = await supabase.rpc('match_messages', {
            query_embedding: userEmbedding,
            match_threshold: 0.7, // 70% similarity threshold
            match_count: 5,
            p_user_id: user_id,
            p_session_id: session_id || '00000000-0000-0000-0000-000000000000'
          });
             
          if (!searchError && relatedMessages && relatedMessages.length > 0) {
             olderContextMessages = relatedMessages;
          } else if (searchError) {
             console.warn("Vector search failed (ensure pgvector and match_messages are setup):", searchError);
          }
        }
      } catch (e) {
        console.warn("Embedding generation or search failed:", e);
      }
    }

    const contextMessages = recentMessages?.map((m: any) => ({ content: m.content || "", role: m.role })).reverse() || [];
    const contextChapters = contextChaptersData?.map((c: any) => c.narrative) || [];
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
    // Skip duplicate pipeline extraction if orchestrated
    const updatedIntelProfile = await extractIntelligenceProfile('chat', content, intelProfile as any);

    // STEP 4: Orchestration and AI generation (Core Path - Keep Awaited)
    const selectedModel = determineModelForInput(content);
    console.log(`[Magic Way] Selected model: ${selectedModel}`);
    
    // Tell orchestrator to evaluate the mode
    const [pipelineOutput] = await Promise.all([
      orchestrator.processInteraction({
        userId: user_id,
        message: { role, type, content },
        contextMessages: contextMessages.map((m: any) => m.content as string),
        apiKey: apiKey,
        language,
        contextChapters
      })
    ]);

    const isNarrative = !!(pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative);

    // Call the AI engine specifically with the context of whether this is narrative or chat mode
    // We await this so the user gets an instant empathetic reply
    const aiResponseText = await generateStoryResponse(
        content || "", 
        contextMessages, 
        profile.bio || undefined, 
        profile.personality_summary || undefined, 
        updatedIntelProfile as any, 
        { model: selectedModel, isNarrativeMode: isNarrative, retrievedMemories: olderContextMessages }
    );

    const analyzedEvent = pipelineOutput.extractedEvent;
    
    // STEP 5: Reliable Persistence (Core Path - Keep Awaited)
    const { data: message, error: messageError } = await chatPersistence.saveUserMessage(supabase, {
        user_id, session_id: session_id || undefined, role, type, content, media_url: media_url || null,
        metadata: {
          ...(metadata || {}),
          emotion: analyzedEvent?.emotion || 'neutral',
          importance: analyzedEvent?.score || 0,
          category: analyzedEvent?.category || 'General'
        },
        event_score: analyzedEvent?.score || 0,
        processing_status: pipelineOutput.narrativeUpdate?.narrative ? 'woven' : (pipelineOutput.extractedEvent ? 'saved' : 'observed'),
        embedding: userEmbedding
    });
      
    if (messageError) throw messageError;

    // Concurrently handle interactions & immediate AI response persistence
    await Promise.all([
      (role === 'user' && type === 'text' && content) ? chatPersistence.saveAIResponse(supabase, { user_id, session_id: session_id || undefined, role: 'diary', type: 'text', content: aiResponseText as string }) : Promise.resolve(),
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
            personality_summary: pipelineOutput.personaUpdate || profile.personality_summary || undefined,
            bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate!.summary : (profile.bio || undefined),
            intelligence_profile: updatedIntelProfile
          }),
          // Update Session
          session_id ? chatPersistence.updateSessionStatus(supabase, session_id, { 
            processing_status: pipelineOutput.narrativeUpdate?.narrative ? 'woven' : (pipelineOutput.extractedEvent ? 'saved' : 'observed'),
            impact_percentage: pipelineOutput.narrativeUpdate?.narrative ? 90 : (pipelineOutput.extractedEvent ? 50 : 10)
          }) : Promise.resolve(),
          // Narrative Chapters & Volumes
          (pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate!.narrative) ? (async () => {
             await chatPersistence.saveChapter(supabase, {
              user_id,
              volume_id: activeVolume?.id,
              title: pipelineOutput.narrativeUpdate!.summary.substring(0, 50),
              content: pipelineOutput.narrativeUpdate!.narrative,
              created_at: new Date().toISOString()
            });

            if (pipelineOutput.narrativeUpdate!.shouldSealVolume && activeVolume) {
              await chatPersistence.sealVolume(supabase, activeVolume.id, { 
                status: 'completed',
                epilogue: pipelineOutput.narrativeUpdate!.currentVolumeEpilogue || null
              });
              
              if (pipelineOutput.narrativeUpdate!.newVolumeMetadata) {
                const meta = pipelineOutput.narrativeUpdate!.newVolumeMetadata;
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
                const contents = sessionMessages.map((m: any) => m.content || "");
                const title = await pipelineForAsync.generateSessionTitle(contents);
                if (title) await supabase.from('chat_sessions').update({ title }).eq('id', session_id);
              }
            }
          })() : Promise.resolve(),
          // Chapter Auto-save
          aiResponseText ? coreService.autoSaveChapter(user_id, aiResponseText as string) : Promise.resolve()
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
