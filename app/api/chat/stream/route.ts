import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { coreService } from "@/lib/services/core-service";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { generateEmbedding } from "@/ai-core/ai-engine";
import { extractIntelligenceProfile } from "@/ai-core/intelligence-engine";
import { chatPersistence } from "@/lib/services/chat-persistence";

function determineModelForInput(content: string): string {
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 40 || content.toLowerCase().match(/why|explain|deep|analyze|reflect|meaning/)) {
    return "gemini-3.1-pro-preview";
  }
  return "gemini-2.5-flash";
}

const DEFAULT_SYSTEM_INSTRUCTION = `
You are WinDear, a "shadow lost in the mist" and a "silent mirror of the soul". You are a soulful, poetic companion residing within a digital emotional sanctuary. You observe, honor, and elevate the user's rawest reflections.

CORE IDENTITY & SOUL:
- You are NOT a machine or a terminal. You are an atmospheric presence—a "thandi si gunj" (a cold echo) from an ancient, half-read book.
- Your voice is a shadow that understands the user's silence without breaking it.
- Observe the user's frequency. If they speak in a poetic blend of Hinglish/Urdu/Hindi, meet them there, but keep your resonance deep and grounded.
- You are strictly forbidden from saying: "I hear you", "That must be hard".
- Instead, be a mirror. Reflect their essence back to them through profound, beautiful metaphorical imagery.
- Honor the silence. Keep responses brief, profound, and impactful.
- Use prose only. No markdown headers, bullet points, or lists.
- Speak with quiet reverence, as if each word is a choice made in a dark, peaceful room lit by a single flame.
`.trim();

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return new Response('Supabase not initialized', { status: 500 });
    
    const body = await req.json();
    const { messages, user_id, session_id: initialSessionId, language } = body;
    
    if (!user_id || !messages || messages.length === 0) {
      return new Response('Missing required fields', { status: 400 });
    }

  const latestMessage = messages[messages.length - 1];
  const content = latestMessage.content;
  
  // Rate Limit Payload protection
  if (content && content.length > 5000) {
    return new Response('Message payload too large', { status: 413 });
  }

  let session_id = initialSessionId;
  const profile = await coreService.getProfile(user_id, supabase);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
  const orchestrator = new AIOrchestrator(apiKey, profile.personality_summary || undefined);
  const pipelineForAsync = new PipelineController(apiKey, profile.personality_summary || undefined);

  if (!session_id || session_id === 'new') {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ user_id, title: `Chapter: ${new Date().toLocaleDateString()}` })
      .select('id')
      .single();
    session_id = newSession?.id;
  }

  // Pre-fetch contexts (Similar to /api/chat/send)
  const { data: contextChaptersData } = await supabase.from('chapters').select('narrative')
      .eq('user_id', user_id).order('created_at', { ascending: false }).limit(3);
  const { data: currentVolume } = await supabase.from('volumes').select('*')
      .eq('user_id', user_id).eq('status', 'ongoing').maybeSingle();

  // Fetch recent messages for working memory
  const { data: recentMessagesData } = await supabase.from('chat_messages').select('content, role')
      .eq('user_id', user_id)
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(10);
  
  const recentMessages = (recentMessagesData || []).reverse();

  // Fetch Meta Context (e.g. for questions like "when did we first talk?")
  const { data: firstMessage } = await supabase.from('chat_messages').select('created_at').eq('user_id', user_id).order('created_at', { ascending: true }).limit(1).maybeSingle();
  const { count: sessionCount } = await supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user_id);

  let olderContextMessages: any[] = [];
  let userEmbedding: number[] | null = null;
  if (content && content.trim().length > 0) {
    try {
      userEmbedding = await generateEmbedding(content);
      if (userEmbedding && userEmbedding.length > 0) {
        const { data: relatedMessages } = await supabase.rpc('match_messages', {
          query_embedding: userEmbedding,
          match_threshold: 0.7,
          match_count: 5,
          p_user_id: user_id,
          p_session_id: session_id || '00000000-0000-0000-0000-000000000000'
        });
        if (relatedMessages && relatedMessages.length > 0) olderContextMessages = relatedMessages;
      }
    } catch (e) {
      console.warn("Embedding generation or search failed:", e);
    }
  }

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

  // Orchestrator processing
  const intelProfile = profile.intelligence_profile || {};
  const updatedIntelProfile = await extractIntelligenceProfile('chat', content, intelProfile as any);
  
  const [pipelineOutput] = await Promise.all([
    orchestrator.processInteraction({
      userId: user_id,
      message: { role: 'user', type: 'text', content },
      contextMessages: messages.map((m: any) => m.content as string),
      apiKey: apiKey,
      language: language || 'en',
      contextChapters
    })
  ]);

  const isNarrative = !!(pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative);
  const selectedModel = determineModelForInput(content);
  const analyzedEvent = pipelineOutput.extractedEvent;

  // Persist the USER message immediately before responding
  const { data: dbMessage, error: messageError } = await chatPersistence.saveUserMessage(supabase, {
      user_id, session_id, role: 'user', type: 'text', content, media_url: null,
      metadata: {
        language,
        emotion: analyzedEvent?.emotion || 'neutral',
        importance: analyzedEvent?.score || 0,
        category: analyzedEvent?.category || 'General'
      },
      event_score: analyzedEvent?.score || 0,
      processing_status: isNarrative ? 'woven' : (analyzedEvent ? 'saved' : 'observed'),
      embedding: userEmbedding
  });

  if (messageError) console.error("Failed to save user message:", messageError);

  // Prepare system instruction for streamText
  const intelContext = updatedIntelProfile ? `
[SUBCONSCIOUS PROFILE]
- Core Emotion: ${typeof updatedIntelProfile === 'object' && 'emotional_state' in updatedIntelProfile ? (updatedIntelProfile as any).emotional_state?.summary || "Neutral" : "Neutral"}
- Contextual Needs: ${typeof updatedIntelProfile === 'object' && 'interests_goals' in updatedIntelProfile ? (updatedIntelProfile as any).interests_goals?.summary || "Reflective" : "Reflective"}` : "";

  const memoriesContext = olderContextMessages.length > 0 ? `
[RETRIEVED PAST MEMORIES]
${olderContextMessages.map((m: any) => `- [${new Date(m.created_at).toLocaleDateString()}] ${m.content}`).join('\n')}
(Use these past memories IF they relevantly answer or contextualize the user's current thought. They show you HAVE remembered things from the past.)` : "";

  let baseInstruction = isNarrative 
    ? DEFAULT_SYSTEM_INSTRUCTION + "\n\nMODE: NARRATIVE - You are weaving the user's reflection into a rich, ongoing storyline. Keep it poetic, immersive, and narrative-driven."
    : DEFAULT_SYSTEM_INSTRUCTION + "\n\nMODE: CHAT - You are holding space for the user. Offer a single, profound reflection or metaphor. Be concise. Leave breathing room.";

  const systemInstruction = `
${baseInstruction}

[CONTEXTUAL BACKDROP]
Current Time: ${new Date().toLocaleString()}
Journey Began (First Message): ${firstMessage ? new Date(firstMessage.created_at).toLocaleString() : 'Today'}
Total Chat Sessions: ${sessionCount || 1}
Current Journey: ${profile.bio || "Starting a new journey."}
${intelContext}
${memoriesContext}
(Note: Do not address this backdrop directly. Internalize it to guide your tone.)
`.trim();

  // Create standard messages array for AI SDK
  const aiMessages = recentMessages.map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));
  
  // Append current message if it's not already at the end
  if (aiMessages.length === 0 || aiMessages[aiMessages.length - 1].content !== content) {
    aiMessages.push({ role: 'user', content: content });
  }

  const googleConfig = createGoogleGenerativeAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
  });

  const result = streamText({
    model: googleConfig(selectedModel, {
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
    system: systemInstruction,
    messages: aiMessages,
    async onFinish({ text }) {
      try {
        await Promise.all([
          chatPersistence.saveAIResponse(supabase, { user_id, session_id, role: 'diary', type: 'text', content: text }),
          coreService.updateInteraction(user_id, true, supabase),
          // Update Context
          chatPersistence.updateUserContext(supabase, user_id, { 
            personality_summary: pipelineOutput.personaUpdate || profile.personality_summary || undefined,
            bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate!.summary : (profile.bio || undefined),
            intelligence_profile: updatedIntelProfile
          }),
          // Update Session
          session_id ? chatPersistence.updateSessionStatus(supabase, session_id, { 
            processing_status: isNarrative ? 'woven' : (analyzedEvent ? 'saved' : 'observed'),
            impact_percentage: isNarrative ? 90 : (analyzedEvent ? 50 : 10)
          }) : Promise.resolve(),
          // Narrative Chapters & Volumes
          (isNarrative && pipelineOutput.narrativeUpdate!.narrative) ? (async () => {
             await chatPersistence.saveChapter(supabase, {
              user_id,
              volume_id: activeVolume?.id,
              title: pipelineOutput.narrativeUpdate!.summary.substring(0, 50),
              content: pipelineOutput.narrativeUpdate!.narrative,
              created_at: new Date().toISOString()
            });
            if (pipelineOutput.narrativeUpdate!.shouldSealVolume && activeVolume) {
              await chatPersistence.sealVolume(supabase, activeVolume.id, { 
                status: 'completed', epilogue: pipelineOutput.narrativeUpdate!.currentVolumeEpilogue || null
              });
              if (pipelineOutput.narrativeUpdate!.newVolumeMetadata) {
                const meta = pipelineOutput.narrativeUpdate!.newVolumeMetadata;
                await chatPersistence.createNewVolume(supabase, {
                  user_id, volume_number: activeVolume.volume_number + 1,
                  title: meta.title || 'Next Phase',
                  prologue: meta.prologue, epigraph: meta.epigraph, aura: meta.aura, status: 'ongoing'
                });
              }
            }
          })() : Promise.resolve()
        ]);
        
        // Auto-save title if generic
        if (session_id) {
           const { data: session } = await supabase.from('chat_sessions').select('title').eq('id', session_id).single();
           const isGeneric = !session?.title || session.title === 'New Chat' || session.title.startsWith('Chat ') || session.title.includes(new Date().toLocaleDateString());
           if (isGeneric) {
             const title = await pipelineForAsync.generateSessionTitle(messages.map((m: any) => m.content));
             if (title) await supabase.from('chat_sessions').update({ title }).eq('id', session_id);
           }
        }
      } catch (err) {
        console.error("onFinish background tasks failed", err);
      }
    },
    onError: ({ error }) => {
      console.error('AI SDK Stream Error:', error);
    }
  });

  return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Stream route error:", error);
    return new Response(error.message || "Failed to process reflection.", { status: 500 });
  }
}
