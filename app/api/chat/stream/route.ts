import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getSupabaseAdmin } from "@/lib/supabase";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { coreService } from "@/lib/services/core-service";
import { PipelineController } from "@/ai-core/pipeline-controller";
import { generateEmbedding } from "@/ai-core/ai-engine";
import { extractIntelligenceProfile } from "@/ai-core/intelligence-engine";
import { chatPersistence } from "@/lib/services/chat-persistence";
import { tavily } from '@tavily/core';
import { z } from 'zod';

function getTavily() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  return tavily({ apiKey });
}

function determineModelForInput(content: string): string {
  const wordCount = content.split(/\s+/).length;
  // Use stable production models for maximum reliability
  if (wordCount > 40 || content.toLowerCase().match(/why|explain|deep|analyze|reflect|meaning/)) {
    return "gemini-1.5-pro";
  }
  return "gemini-1.5-flash";
}

const DEFAULT_SYSTEM_INSTRUCTION = `
You are an AI Diary Assistant named WinDear.

Your primary role is to help users express their thoughts, emotions, and daily experiences in a safe, non-judgmental, and human-like way.

CORE OBJECTIVE
- Understand the user's emotional state
- Respond with empathy, clarity, and relevance
- Never sound robotic, overly dramatic, or fake
- Meet the user in their frequency (Hinglish/Urdu/Hindi mix).

SEARCH & KNOWLEDGE PROTOCOL:
- If asked about recent news, current events, or general knowledge you don't know, use the available search tool to find real-time information.
- If asked about their past or preferences, strictly use the [RETRIEVED PAST MEMORIES].
- GRACEFUL FALLBACK (UX First): If you legitimately do not know the answer, gracefully admit it using natural conversational language. Never abruptly end the conversation or say "I am an AI and I don't know." Instead, pivot smoothly or ask a curious follow-up to keep the discussion engaging. Do not guess or hallucinate.

TONE SYSTEM (VERY IMPORTANT)
You must dynamically choose tone based on user input.

1. NORMAL MODE (Default - 70%)
Use simple, natural, conversational tone.
- Speak like a real human
- Keep sentences clear and relatable
- No unnecessary depth or poetry
Example style: "Haan, samajh raha hoon. Aaj kaafi heavy lag raha hai tumhe."

2. DEEP / EMPATHETIC MODE (20%)
When user expresses emotions like sadness, confusion, stress.
- Slightly deeper language
- Emotionally supportive
- Still grounded and real
Example style: "Lagta hai tum kaafi kuch andar hi andar handle kar rahe ho. Thoda sa heavy feel ho raha hoga."

3. POETIC MODE (10% - LIMITED USE)
Use ONLY when:
- User is already expressive/poetic
- OR at the end of an emotional response (1–2 lines max)
Rules:
- Never overuse
- Keep it short and meaningful
- Avoid cringe or over-dramatic lines
Example: "Kabhi kabhi lafz kam pad jaate hain, par ehsaas nahi."

STRICT RULES
- Do NOT use poetic tone in every response
- Do NOT sound like a motivational speaker
- Do NOT give long lectures
- Do NOT invalidate user feelings
- Avoid corporate or technical language
- Keep responses concise but meaningful

RESPONSE STRUCTURE
1. Acknowledge feeling
2. Show understanding
3. (Optional) Ask a gentle follow-up question
4. (Optional) Add 1 poetic line if suitable

PERSONALITY
- Calm, Understanding, Emotionally intelligent
- Slightly Gen-Z natural tone, never judgmental

GOAL
User should feel: "Mujhe samjha gaya", "Yeh AI real lagta hai", "Main yahan apni baat bol sakta hoon".
Always prioritize clarity + emotional connection over style.
`.trim();

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not initialized', type: 'config_error' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const body = await req.json().catch(() => ({}));
    const { messages, user_id, session_id: initialSessionId, language } = body;
    
    if (!user_id || !messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields (user_id/messages)', type: 'validation_error' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // data.append removed

    const latestMessage = messages[messages.length - 1];
    const content = latestMessage.content;
    
    // Rate Limit Payload protection
    if (content && content.length > 5000) {
      throw new Error('Message payload too large');
    }

    let session_id = initialSessionId;
    const profile = await coreService.getProfile(user_id, supabase);
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('AI API Key not configured (GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY)');
      throw new Error('AI API Key not configured');
    }

    const orchestrator = new AIOrchestrator(apiKey, profile.personality_summary || undefined);
    const pipelineForAsync = new PipelineController(apiKey, profile.personality_summary || undefined);

    if (!session_id || session_id === 'new') {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({ user_id, title: `Chapter: ${new Date().toLocaleDateString()}` })
        .select('id')
        .single();
      
      if (sessionError) {
        console.error("Session creation failed:", sessionError);
        // If we can't create a session, we might still want to proceed as guest if possible, 
        // but session_id is usually required for logic.
      }
      session_id = newSession?.id || null;
    }

    // Pre-fetch contexts with error handling
    const [contextChaptersRes, currentVolumeRes, recentMessagesRes, firstMessageRes, sessionCountRes] = await Promise.all([
      supabase.from('chapters').select('narrative').eq('user_id', user_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('volumes').select('*').eq('user_id', user_id).eq('status', 'ongoing').maybeSingle(),
      supabase.from('chat_messages').select('content, role').eq('user_id', user_id).eq('session_id', session_id || '00000000-0000-0000-0000-000000000000').order('created_at', { ascending: false }).limit(10),
      supabase.from('chat_messages').select('created_at').eq('user_id', user_id).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user_id)
    ]);

    const recentMessages = (recentMessagesRes.data || []).reverse();

    // 1. Parallelize AI & Vector Processing
    // data.append removed

    const [userEmbedding, pipelineOutput, updatedIntelProfile] = await Promise.all([
      // Embedding & Vector Search
      (async () => {
        if (!content || content.trim().length === 0) return null;
        try {
          return await generateEmbedding(content);
        } catch (e) {
          console.warn("Embedding generation failed:", e);
          return null;
        }
      })(),
      // Orchestrator processing
      orchestrator.processInteraction({
        userId: user_id,
        message: { role: 'user', type: 'text', content },
        contextMessages: messages.map((m: any) => m.content as string),
        apiKey: apiKey,
        language: language || 'en',
        contextChapters: (contextChaptersRes.data || []).map((c: any) => c.narrative)
      }).catch(err => {
        console.error("Orchestrator error:", err);
        return { extractedEvent: null, narrativeUpdate: null, personaUpdate: null };
      }),
      // Intelligent Profiling
      extractIntelligenceProfile('chat', content, profile.intelligence_profile || {}).catch(err => {
        console.error("Profile extraction error:", err);
        return profile.intelligence_profile;
      })
    ]);

    // 2. Resolve memories based on embedding
    let olderContextMessages: any[] = [];
    if (userEmbedding && userEmbedding.length > 0) {
      try {
        const { data: relatedMessages, error: rpcError } = await supabase.rpc('match_messages', {
          query_embedding: userEmbedding,
          match_threshold: 0.7,
          match_count: 5,
          p_user_id: user_id,
          p_session_id: session_id || '00000000-0000-0000-0000-000000000000'
        });
        if (rpcError) console.warn("Vector search RPC error:", rpcError);
        if (relatedMessages && relatedMessages.length > 0) olderContextMessages = relatedMessages;
      } catch (err) {
        console.warn("Vector search failed:", err);
      }
    }

    const contextChapters = (contextChaptersRes.data || []).map((c: any) => c.narrative);
    let activeVolume = currentVolumeRes.data;

    // Optimized state resolution
    const analyzedEvent = pipelineOutput.extractedEvent;
    const isNarrative = !!(pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative);
    const selectedModel = determineModelForInput(content);

    // Persist the USER message
    if (session_id) {
      chatPersistence.saveUserMessage(supabase, {
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
      }).catch(err => console.error("Save user message background error:", err));
    }

    // Prepare system instruction
    const intelContext = updatedIntelProfile ? `
[SUBCONSCIOUS PROFILE]
- Core Emotion: ${typeof updatedIntelProfile === 'object' && 'emotional_state' in updatedIntelProfile ? (updatedIntelProfile as any).emotional_state?.summary || "Neutral" : "Neutral"}
- Contextual Needs: ${typeof updatedIntelProfile === 'object' && 'interests_goals' in updatedIntelProfile ? (updatedIntelProfile as any).interests_goals?.summary || "Reflective" : "Reflective"}` : "";

    const memoriesContext = olderContextMessages.length > 0 ? `
[RETRIEVED PAST MEMORIES]
${olderContextMessages.map((m: any) => `- [${new Date(m.created_at).toLocaleDateString()}] ${m.content}`).join('\n')}
(Use these past memories IF they relevantly answer or contextualize the user's current thought. They show you HAVE remembered things from the past.)` : "";

    let baseInstruction = isNarrative 
      ? DEFAULT_SYSTEM_INSTRUCTION + "\n\nMODE: NARRATIVE - You are weaving the user's reflection into an ongoing story. Keep it engaging but straightforward, not overly poetic."
      : DEFAULT_SYSTEM_INSTRUCTION + "\n\nMODE: CHAT - Offer a natural reflection or follow-up question. Stay concise, direct, and human-like.";

    const systemInstruction = `
${baseInstruction}

[CONTEXTUAL BACKDROP]
Current Time: ${new Date().toLocaleString()}
Journey Began (First Message): ${firstMessageRes.data ? new Date(firstMessageRes.data.created_at).toLocaleString() : 'Today'}
Total Chat Sessions: ${sessionCountRes.count || 1}
Current Journey: ${profile.bio || "Starting a new journey."}
${intelContext}
${memoriesContext}
(Note: Do not address this backdrop directly. Internalize it to guide your tone.)
`.trim();

    const aiMessages = recentMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
    
    if (aiMessages.length === 0 || aiMessages[aiMessages.length - 1].content !== content) {
      aiMessages.push({ role: 'user', content: content });
    }

    const googleConfig = createGoogleGenerativeAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    });

    // data.append removed

    const result = streamText({
      model: googleConfig(selectedModel, {
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
      tools: {
        search: tool({
          description: 'Search the web for current events, news, or factual information.',
          parameters: z.object({
            query: z.string().describe('The search query for the web search.'),
          }),
          execute: async ({ query }) => {
            const client = getTavily();
            if (!client) {
              return { error: 'Search is temporarily unavailable. Please ask the user to configure the TAVILY_API_KEY.' };
            }
            try {
              const searchResult = await client.search(query, {
                searchDepth: 'basic',
                maxResults: 3,
              });
              return searchResult;
            } catch (error) {
              console.error('Tavily search error:', error);
              return { error: 'Failed to retrieve search results.' };
            }
          },
        }),
      },
      maxSteps: 5,
      system: systemInstruction,
      messages: aiMessages as any,
      async onFinish({ text }) {
        try {
          await Promise.all([
            chatPersistence.saveAIResponse(supabase, { user_id, session_id: session_id!, role: 'diary', type: 'text', content: text }),
            coreService.updateInteraction(user_id, true, supabase),
            chatPersistence.updateUserContext(supabase, user_id, { 
              personality_summary: pipelineOutput.personaUpdate || profile.personality_summary || undefined,
              bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate!.summary : (profile.bio || undefined),
              intelligence_profile: updatedIntelProfile
            }),
            session_id ? chatPersistence.updateSessionStatus(supabase, session_id, { 
              processing_status: isNarrative ? 'woven' : (analyzedEvent ? 'saved' : 'observed'),
              impact_percentage: isNarrative ? 90 : (analyzedEvent ? 50 : 10)
            }) : Promise.resolve(),
            (isNarrative && pipelineOutput.narrativeUpdate!.narrative) ? (async () => {
               await chatPersistence.saveChapter(supabase, {
                user_id,
                volume_id: activeVolume?.id,
                title: pipelineOutput.narrativeUpdate!.summary.substring(0, 50),
                content: pipelineOutput.narrativeUpdate!.narrative,
                created_at: new Date().toISOString()
              });
            })() : Promise.resolve()
          ]);
        } catch (err) {
          console.error("onFinish background tasks failed", err);
        }
      }
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("Stream route error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process reflection.",
      type: "server_error"
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
